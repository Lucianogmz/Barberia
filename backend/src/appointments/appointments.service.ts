import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service';
import { EmailService } from '../email/email.service';
import { ScheduleService } from '../schedule/schedule.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AppointmentStatus } from '@prisma/client';

// 10-minute buffer between appointments
const BUFFER_MINUTES = 10;

export interface TimeSlot {
  startTime: string; // ISO string
  endTime: string; // ISO string
  available: boolean;
}

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly calendarService: CalendarService,
    private readonly emailService: EmailService,
    private readonly scheduleService: ScheduleService,
  ) {}

  /**
   * Get the first barber (single-barber V1).
   * In multi-barber V2, this would accept a barberId parameter.
   */
  private async getDefaultBarber() {
    const barber = await this.prisma.user.findFirst({
      where: { role: 'BARBER' },
    });

    if (!barber) {
      throw new NotFoundException('No se encontró un barbero configurado');
    }

    return barber;
  }

  /**
   * Calculate available time slots for a given date and service.
   * Algorithm: WorkSchedule slots - existing appointments - Google Calendar busy times
   */
  async getAvailableSlots(
    date: string,
    serviceId: string,
  ): Promise<TimeSlot[]> {
    const barber = await this.getDefaultBarber();
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Servicio no encontrado');
    }

    // Parse the target date in Argentina timezone
    const targetDate = new Date(date + 'T00:00:00-03:00');
    const dayOfWeek = targetDate.getDay(); // 0=Sunday, 6=Saturday

    // Get work schedule for this day
    const schedule = await this.scheduleService.getScheduleForDay(
      barber.id,
      dayOfWeek,
    );

    if (!schedule || !schedule.isActive) {
      return []; // Day off — no slots available
    }

    // Build the day boundaries in Argentina time
    const [startH, startM] = schedule.startTime.split(':').map(Number);
    const [endH, endM] = schedule.endTime.split(':').map(Number);

    const dayStart = new Date(targetDate);
    dayStart.setHours(startH, startM, 0, 0);

    const dayEnd = new Date(targetDate);
    dayEnd.setHours(endH, endM, 0, 0);

    // Convert to UTC for DB/Calendar queries
    // Argentina is UTC-3
    const dayStartUTC = new Date(dayStart.getTime() + 3 * 60 * 60 * 1000);
    const dayEndUTC = new Date(dayEnd.getTime() + 3 * 60 * 60 * 1000);

    // Get existing appointments for this day (only PENDIENTE — not cancelled)
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        status: { in: ['PENDIENTE', 'COMPLETADO'] },
        startTime: { gte: dayStartUTC },
        endTime: { lte: dayEndUTC },
      },
      select: { startTime: true, endTime: true },
    });

    // Get Google Calendar busy times
    const busyIntervals = await this.calendarService.getBusyIntervals(
      barber.id,
      dayStartUTC,
      dayEndUTC,
    );

    // Merge all busy intervals (appointments + Google Calendar)
    const allBusyIntervals = [
      ...existingAppointments.map((a) => ({
        start: a.startTime,
        // Add buffer time after each appointment
        end: new Date(a.endTime.getTime() + BUFFER_MINUTES * 60 * 1000),
      })),
      ...busyIntervals,
    ];

    // Generate possible slots based on service duration
    const slots: TimeSlot[] = [];
    const slotDuration = service.durationMin * 60 * 1000; // in ms
    const now = new Date();

    let currentSlotStart = dayStartUTC;

    while (currentSlotStart.getTime() + slotDuration <= dayEndUTC.getTime()) {
      const currentSlotEnd = new Date(
        currentSlotStart.getTime() + slotDuration,
      );

      // Check if this slot overlaps with any busy interval
      const isConflicting = allBusyIntervals.some(
        (busy) =>
          currentSlotStart < busy.end && currentSlotEnd > busy.start,
      );

      // Check if slot is in the past
      const isPast = currentSlotStart <= now;

      slots.push({
        startTime: currentSlotStart.toISOString(),
        endTime: currentSlotEnd.toISOString(),
        available: !isConflicting && !isPast,
      });

      // Move to next slot (service duration + buffer)
      currentSlotStart = new Date(
        currentSlotStart.getTime() + slotDuration + BUFFER_MINUTES * 60 * 1000,
      );
    }

    return slots;
  }

  /**
   * Create a new appointment (public — guest booking).
   */
  async create(dto: CreateAppointmentDto) {
    const barber = await this.getDefaultBarber();

    // Verify service exists and is active
    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(
      startTime.getTime() + service.durationMin * 60 * 1000,
    );

    // Verify slot is still available (prevent race conditions)
    const conflicting = await this.prisma.appointment.findFirst({
      where: {
        barberId: barber.id,
        status: 'PENDIENTE',
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    if (conflicting) {
      throw new BadRequestException(
        'Este horario ya no está disponible. Por favor, elegí otro.',
      );
    }

    // Upsert the client (guest)
    const client = await this.prisma.client.upsert({
      where: {
        email_phone: {
          email: dto.clientEmail,
          phone: dto.clientPhone,
        },
      },
      update: { name: dto.clientName },
      create: {
        name: dto.clientName,
        phone: dto.clientPhone,
        email: dto.clientEmail,
      },
    });

    // Create Google Calendar event
    const googleEventId = await this.calendarService.createEvent(barber.id, {
      summary: `✂️ ${service.name} — ${client.name}`,
      description: `Cliente: ${client.name}\nTeléfono: ${client.phone}\nEmail: ${client.email}\nServicio: ${service.name}\nDuración: ${service.durationMin} min`,
      startTime,
      endTime,
      attendeeEmail: client.email,
    });

    // Create the appointment with price snapshot
    const appointment = await this.prisma.appointment.create({
      data: {
        startTime,
        endTime,
        status: 'PENDIENTE',
        priceAtBooking: service.price,
        googleEventId,
        notes: dto.notes,
        barberId: barber.id,
        serviceId: service.id,
        clientId: client.id,
      },
      include: {
        service: { select: { name: true, durationMin: true } },
        client: { select: { name: true, email: true, phone: true } },
      },
    });

    // Send confirmation email
    await this.emailService.sendBookingConfirmation({
      clientName: client.name,
      clientEmail: client.email,
      serviceName: service.name,
      startTime,
      endTime,
      price: Number(service.price),
    });

    this.logger.log(
      `New appointment created: ${appointment.id} for ${client.name}`,
    );

    return appointment;
  }

  /**
   * List appointments with optional filters (protected — barber dashboard).
   */
  async findAll(
    barberId: string,
    filters?: {
      date?: string;
      status?: AppointmentStatus;
    },
  ) {
    const where: any = { barberId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.date) {
      const dayStart = new Date(filters.date + 'T00:00:00-03:00');
      const dayEnd = new Date(filters.date + 'T23:59:59-03:00');
      // Convert to UTC
      where.startTime = {
        gte: new Date(dayStart.getTime() + 3 * 60 * 60 * 1000),
        lte: new Date(dayEnd.getTime() + 3 * 60 * 60 * 1000),
      };
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        service: { select: { name: true, durationMin: true } },
        client: { select: { name: true, email: true, phone: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Update appointment status (protected — barber only).
   */
  async updateStatus(
    appointmentId: string,
    barberId: string,
    dto: UpdateStatusDto,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barberId },
      include: {
        client: { select: { name: true, email: true } },
        service: { select: { name: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    // If cancelling, delete the Google Calendar event
    if (
      dto.status === 'CANCELADO' &&
      appointment.googleEventId
    ) {
      await this.calendarService.deleteEvent(
        barberId,
        appointment.googleEventId,
      );

      // Send cancellation email
      await this.emailService.sendCancellationNotification({
        clientName: appointment.client.name,
        clientEmail: appointment.client.email,
        serviceName: appointment.service.name,
        startTime: appointment.startTime,
      });
    }

    return this.prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: dto.status },
      include: {
        service: { select: { name: true, durationMin: true } },
        client: { select: { name: true, email: true, phone: true } },
      },
    });
  }
}
