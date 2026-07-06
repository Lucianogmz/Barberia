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
import { AppointmentStatus, Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const BUFFER_MINUTES = 10;
const TZ = 'America/Argentina/Buenos_Aires';

// Estados que ocupan un horario (no debe permitirse reservar encima de ellos).
// CANCELADO y NO_ASISTIO liberan el horario.
const OCCUPYING_STATUSES: AppointmentStatus[] = ['PENDIENTE', 'COMPLETADO'];

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
      orderBy: { updatedAt: 'desc' },
    });

    if (!barber) {
      throw new NotFoundException('No se encontró un barbero configurado');
    }

    return barber;
  }

  private toArgentinaISO(date: Date): string {
    return dayjs(date).tz(TZ).format();
  }

  private buildRangeBoundaries(
    dateStr: string,
    morningStart: string,
    morningEnd: string,
    afternoonStart: string | null,
    afternoonEnd: string | null,
  ) {
    const parseHHMM = (str: string) => {
      // Create date strictly in Argentina timezone
      return dayjs.tz(`${dateStr}T${str}:00`, TZ).toDate();
    };

    const morningStartTime = parseHHMM(morningStart);
    const morningEndTime = parseHHMM(morningEnd);
    const afternoonStartTime = afternoonStart ? parseHHMM(afternoonStart) : null;
    const afternoonEndTime = afternoonEnd ? parseHHMM(afternoonEnd) : null;

    return {
      ranges: [
        {
          utcStart: morningStartTime,
          utcEnd: morningEndTime,
        },
        afternoonStartTime && afternoonEndTime
          ? {
              utcStart: afternoonStartTime,
              utcEnd: afternoonEndTime,
            }
          : null,
      ].filter(Boolean) as {
        utcStart: Date;
        utcEnd: Date;
      }[],
      allUtcStart: afternoonEndTime && afternoonStartTime
          ? afternoonEndTime
          : morningEndTime,
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

    const targetDate = dayjs.tz(`${date}T12:00:00`, TZ).toDate();
    const dayOfWeek = targetDate.getDay();

    const schedule = await this.scheduleService.getScheduleForDay(
      barber.id,
      dayOfWeek,
    );

    if (!schedule || !schedule.isActive) {
      return [];
    }

    const { ranges, allUtcStart } = this.buildRangeBoundaries(
      date,
      schedule.morningStart,
      schedule.morningEnd,
      schedule.afternoonStart,
      schedule.afternoonEnd,
    );

    const firstUtc = ranges[0].utcStart;
    const lastUtc = allUtcStart;

    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        barberId: barber.id,
        status: { in: OCCUPYING_STATUSES },
        AND: [
          { startTime: { lt: lastUtc } },
          { endTime: { gt: firstUtc } },
        ],
      },
      select: { startTime: true, endTime: true },
    });

    const busyIntervals = await this.calendarService.getBusyIntervals(
      barber.id,
      firstUtc,
      lastUtc,
    );

    const allBusyIntervals = [
      ...existingAppointments.map((a) => ({
        start: a.startTime,
        end: new Date(a.endTime.getTime() + BUFFER_MINUTES * 60 * 1000),
      })),
      ...busyIntervals,
    ];

    const slots: TimeSlot[] = [];
    const slotInterval = service.durationMin * 60 * 1000;
    const appointmentDuration = service.durationMin * 60 * 1000;
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
      startTime.getTime() + service.durationMin * 60 * 1000,
    );

    if (startTime.getTime() <= Date.now()) {
      throw new BadRequestException('No se puede reservar en el pasado.');
    }

    // El horario existente ocupa [start, end + buffer]; hay conflicto si se solapa.
    const startMinusBuffer = new Date(
      startTime.getTime() - BUFFER_MINUTES * 60 * 1000,
    );

    // Upsert del cliente (fuera de la transacción de reserva, es idempotente).
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

    // Re-chequeo de conflicto + inserción atómicos (Serializable) para evitar
    // dobles reservas por condición de carrera. Mismo criterio que la
    // disponibilidad: estados ocupantes + buffer entre turnos.
    let appointment;
    try {
      appointment = await this.prisma.$transaction(
        async (tx) => {
          const conflicting = await tx.appointment.findFirst({
            where: {
              barberId: barber.id,
              status: { in: OCCUPYING_STATUSES },
              startTime: { lt: endTime },
              endTime: { gt: startMinusBuffer },
            },
            select: { id: true },
          });

          if (conflicting) {
            throw new BadRequestException(
              'Este horario ya no está disponible. Por favor, elegí otro.',
            );
          }

          return tx.appointment.create({
            data: {
              startTime,
              endTime,
              status: 'PENDIENTE',
              priceAtBooking: service.price,
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
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // Violación de constraint anti-solapamiento a nivel DB (ver migración).
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2002' || error.code === 'P2034')
      ) {
        throw new BadRequestException(
          'Este horario ya no está disponible. Por favor, elegí otro.',
        );
      }
      throw error;
    }

    // Efectos externos DESPUÉS de confirmar el turno (evita eventos huérfanos).
    const googleEventId = await this.calendarService.createEvent(barber.id, {
      summary: `✂️ ${service.name} — ${client.name}`,
      description: `Cliente: ${client.name}\nTeléfono: ${client.phone}\nEmail: ${client.email}\nServicio: ${service.name}\nDuración: ${service.durationMin} min`,
      startTime,
      endTime,
      attendeeEmail: client.email,
    });

    if (googleEventId) {
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { googleEventId },
      });
      appointment.googleEventId = googleEventId;
    }

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
      where.startTime = {
        gte: dayjs.tz(`${filters.date}T00:00:00`, TZ).toDate(),
        lte: dayjs.tz(`${filters.date}T23:59:59`, TZ).toDate(),
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
