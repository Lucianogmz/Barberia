import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AppointmentStatus } from '@prisma/client';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    getAvailableSlots(date: string, serviceId: string): Promise<import("./appointments.service").TimeSlot[]>;
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
    findAll(req: any, date?: string, status?: AppointmentStatus): Promise<({
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
    updateStatus(id: string, req: any, dto: UpdateStatusDto): Promise<{
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
