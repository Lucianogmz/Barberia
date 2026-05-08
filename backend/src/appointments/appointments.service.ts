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

const BUFFER_MINUTES = 10;
const SLOT_INTERVAL_MINUTES = 60;
const APPOINTMENT_DURATION_MINUTES = 40;
const TZ_OFFSET_MS = -3 * 60 * 60 * 1000;

export interface TimeSlot {
  startTime: string;
  endTime: string;
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

  private async getDefaultBarber() {
    const barber = await this.prisma.user.findFirst({
      where: { role: 'BARBER' },
    });

    if (!barber) {
      throw new NotFoundException('No se encontró un barbero configurado');
    }

    return barber;
  }

  private toArgentinaISO(date: Date): string {
    const argentinaTime = new Date(date.getTime() + TZ_OFFSET_MS);
    return argentinaTime.toISOString().replace('Z', '-03:00');
  }

  private buildRangeBoundaries(
    targetDate: Date,
    morningStart: string,
    morningEnd: string,
    afternoonStart: string | null,
    afternoonEnd: string | null,
  ) {
    const parseHHMM = (str: string, base: Date) => {
      const [h, m] = str.split(':').map(Number);
      const d = new Date(base);
      d.setHours(h, m, 0, 0);
      return d;
    };

    const morningStartTime = parseHHMM(morningStart, targetDate);
    const morningEndTime = parseHHMM(morningEnd, targetDate);
    const afternoonStartTime = afternoonStart
      ? parseHHMM(afternoonStart, targetDate)
      : null;
    const afternoonEndTime = afternoonEnd ? parseHHMM(afternoonEnd, targetDate) : null;

    const toUTC = (d: Date) => new Date(d.getTime() - TZ_OFFSET_MS);

    return {
      ranges: [
        {
          localStart: morningStartTime,
          localEnd: morningEndTime,
          utcStart: toUTC(morningStartTime),
          utcEnd: toUTC(morningEndTime),
        },
        afternoonStartTime && afternoonEndTime
          ? {
              localStart: afternoonStartTime,
              localEnd: afternoonEndTime,
              utcStart: toUTC(afternoonStartTime),
              utcEnd: toUTC(afternoonEndTime),
            }
          : null,
      ].filter(Boolean) as {
        localStart: Date;
        localEnd: Date;
        utcStart: Date;
        utcEnd: Date;
      }[],
      allUtcStart: toUTC(
        afternoonEndTime && afternoonStartTime
          ? afternoonEndTime
          : morningEndTime,
      ),
    };
  }

  async getAvailableSlots(date: string, serviceId: string): Promise<TimeSlot[]> {
    const barber = await this.getDefaultBarber();
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const targetDate = new Date(date + 'T00:00:00-03:00');
    const dayOfWeek = targetDate.getDay();

    const schedule = await this.scheduleService.getScheduleForDay(
      barber.id,
      dayOfWeek,
    );

    if (!schedule || !schedule.isActive) {
      return [];
    }

    const { ranges, allUtcStart } = this.buildRangeBoundaries(
      targetDate,
      schedule.morningStart,
      schedule.morningEnd,
      schedule.afternoonStart,
      schedule.afternoonEnd,
    );

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        status: { in: ['PENDIENTE', 'COMPLETADO'] },
        startTime: { gte: ranges[0].utcStart },
        endTime: { lte: allUtcStart },
      },
      select: { startTime: true, endTime: true },
    });

    const busyIntervals = await this.calendarService.getBusyIntervals(
      barber.id,
      ranges[0].utcStart,
      allUtcStart,
    );

    const allBusyIntervals = [
      ...existingAppointments.map((a) => ({
        start: a.startTime,
        end: new Date(a.endTime.getTime() + BUFFER_MINUTES * 60 * 1000),
      })),
      ...busyIntervals,
    ];

    const slots: TimeSlot[] = [];
    const slotInterval = SLOT_INTERVAL_MINUTES * 60 * 1000;
    const appointmentDuration = APPOINTMENT_DURATION_MINUTES * 60 * 1000;
    const now = new Date();

    for (const range of ranges) {
      let currentSlotStart = range.utcStart;

      while (currentSlotStart.getTime() + appointmentDuration <= range.utcEnd.getTime()) {
        const currentSlotEnd = new Date(
          currentSlotStart.getTime() + appointmentDuration,
        );

        const isConflicting = allBusyIntervals.some(
          (busy) =>
            currentSlotStart < busy.end && currentSlotEnd > busy.start,
        );

        const isPast = currentSlotStart <= now;

        slots.push({
          startTime: this.toArgentinaISO(currentSlotStart),
          endTime: this.toArgentinaISO(currentSlotEnd),
          available: !isConflicting && !isPast,
        });

        currentSlotStart = new Date(currentSlotStart.getTime() + slotInterval);
      }
    }

    return slots;
  }

  async create(dto: CreateAppointmentDto) {
    const barber = await this.getDefaultBarber();

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, isActive: true },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    const startTime = new Date(dto.startTime);
    const endTime = new Date(
      startTime.getTime() + APPOINTMENT_DURATION_MINUTES * 60 * 1000,
    );

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

    const googleEventId = await this.calendarService.createEvent(barber.id, {
      summary: `✂️ ${service.name} — ${client.name}`,
      description: `Cliente: ${client.name}\nTeléfono: ${client.phone}\nEmail: ${client.email}\nServicio: ${service.name}\nDuración: ${service.durationMin} min`,
      startTime,
      endTime,
      attendeeEmail: client.email,
    });

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

  async findAllWithDefaultBarber(filters?: {
    date?: string;
    status?: AppointmentStatus;
  }) {
    const barber = await this.getDefaultBarber();
    return this.findAllByBarberId(barber.id, filters);
  }

  async findAllByBarberId(
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
      const gte = new Date(dayStart.getTime() + 3 * 60 * 60 * 1000);
      const lte = new Date(dayEnd.getTime() + 3 * 60 * 60 * 1000);
      where.startTime = { gte, lte };
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

  async updateStatusWithDefaultBarber(
    appointmentId: string,
    dto: UpdateStatusDto,
  ) {
    const barber = await this.getDefaultBarber();
    return this.updateStatus(appointmentId, barber.id, dto);
  }

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

    if (dto.status === 'CANCELADO' && appointment.googleEventId) {
      await this.calendarService.deleteEvent(
        barberId,
        appointment.googleEventId,
      );

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
