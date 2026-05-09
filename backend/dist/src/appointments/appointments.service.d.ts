import { PrismaService } from '../prisma/prisma.service';
import { CalendarService } from '../calendar/calendar.service';
import { EmailService } from '../email/email.service';
import { ScheduleService } from '../schedule/schedule.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AppointmentStatus } from '@prisma/client';
export interface TimeSlot {
    startTime: string;
    endTime: string;
    available: boolean;
}
export declare class AppointmentsService {
    private readonly prisma;
    private readonly calendarService;
    private readonly emailService;
    private readonly scheduleService;
    private readonly logger;
    constructor(prisma: PrismaService, calendarService: CalendarService, emailService: EmailService, scheduleService: ScheduleService);
    private getDefaultBarber;
    private toArgentinaISO;
    private buildRangeBoundaries;
    getAvailableSlots(date: string, serviceId: string): Promise<TimeSlot[]>;
    create(dto: CreateAppointmentDto): Promise<{
        service: {
            name: string;
            durationMin: number;
        };
        client: {
            email: string;
            name: string;
            phone: string;
        };
    } & {
        id: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        googleEventId: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        serviceId: string;
        clientId: string;
    }>;
    findAllWithDefaultBarber(filters?: {
        date?: string;
        status?: AppointmentStatus;
    }): Promise<({
        service: {
            name: string;
            durationMin: number;
        };
        client: {
            email: string;
            name: string;
            phone: string;
        };
    } & {
        id: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        googleEventId: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        serviceId: string;
        clientId: string;
    })[]>;
    findAllByBarberId(barberId: string, filters?: {
        date?: string;
        status?: AppointmentStatus;
    }): Promise<({
        service: {
            name: string;
            durationMin: number;
        };
        client: {
            email: string;
            name: string;
            phone: string;
        };
    } & {
        id: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        googleEventId: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        serviceId: string;
        clientId: string;
    })[]>;
    updateStatusWithDefaultBarber(appointmentId: string, dto: UpdateStatusDto): Promise<{
        service: {
            name: string;
            durationMin: number;
        };
        client: {
            email: string;
            name: string;
            phone: string;
        };
    } & {
        id: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        googleEventId: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        serviceId: string;
        clientId: string;
    }>;
    updateStatus(appointmentId: string, barberId: string, dto: UpdateStatusDto): Promise<{
        service: {
            name: string;
            durationMin: number;
        };
        client: {
            email: string;
            name: string;
            phone: string;
        };
    } & {
        id: string;
        startTime: Date;
        endTime: Date;
        status: import("@prisma/client").$Enums.AppointmentStatus;
        priceAtBooking: import("@prisma/client/runtime/library").Decimal;
        googleEventId: string | null;
        notes: string | null;
        createdAt: Date;
        updatedAt: Date;
        barberId: string;
        serviceId: string;
        clientId: string;
    }>;
}
