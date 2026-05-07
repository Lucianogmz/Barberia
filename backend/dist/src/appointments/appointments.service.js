"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AppointmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const calendar_service_1 = require("../calendar/calendar.service");
const email_service_1 = require("../email/email.service");
const schedule_service_1 = require("../schedule/schedule.service");
const BUFFER_MINUTES = 10;
let AppointmentsService = AppointmentsService_1 = class AppointmentsService {
    prisma;
    calendarService;
    emailService;
    scheduleService;
    logger = new common_1.Logger(AppointmentsService_1.name);
    constructor(prisma, calendarService, emailService, scheduleService) {
        this.prisma = prisma;
        this.calendarService = calendarService;
        this.emailService = emailService;
        this.scheduleService = scheduleService;
    }
    async getDefaultBarber() {
        const barber = await this.prisma.user.findFirst({
            where: { role: 'BARBER' },
        });
        if (!barber) {
            throw new common_1.NotFoundException('No se encontró un barbero configurado');
        }
        return barber;
    }
    async getAvailableSlots(date, serviceId) {
        const barber = await this.getDefaultBarber();
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service || !service.isActive) {
            throw new common_1.NotFoundException('Servicio no encontrado');
        }
        const targetDate = new Date(date + 'T00:00:00-03:00');
        const dayOfWeek = targetDate.getDay();
        const schedule = await this.scheduleService.getScheduleForDay(barber.id, dayOfWeek);
        if (!schedule || !schedule.isActive) {
            return [];
        }
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const dayStart = new Date(targetDate);
        dayStart.setHours(startH, startM, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(endH, endM, 0, 0);
        const dayStartUTC = new Date(dayStart.getTime() + 3 * 60 * 60 * 1000);
        const dayEndUTC = new Date(dayEnd.getTime() + 3 * 60 * 60 * 1000);
        const existingAppointments = await this.prisma.appointment.findMany({
            where: {
                barberId: barber.id,
                status: { in: ['PENDIENTE', 'COMPLETADO'] },
                startTime: { gte: dayStartUTC },
                endTime: { lte: dayEndUTC },
            },
            select: { startTime: true, endTime: true },
        });
        const busyIntervals = await this.calendarService.getBusyIntervals(barber.id, dayStartUTC, dayEndUTC);
        const allBusyIntervals = [
            ...existingAppointments.map((a) => ({
                start: a.startTime,
                end: new Date(a.endTime.getTime() + BUFFER_MINUTES * 60 * 1000),
            })),
            ...busyIntervals,
        ];
        const slots = [];
        const slotDuration = service.durationMin * 60 * 1000;
        const now = new Date();
        let currentSlotStart = dayStartUTC;
        while (currentSlotStart.getTime() + slotDuration <= dayEndUTC.getTime()) {
            const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDuration);
            const isConflicting = allBusyIntervals.some((busy) => currentSlotStart < busy.end && currentSlotEnd > busy.start);
            const isPast = currentSlotStart <= now;
            slots.push({
                startTime: currentSlotStart.toISOString(),
                endTime: currentSlotEnd.toISOString(),
                available: !isConflicting && !isPast,
            });
            currentSlotStart = new Date(currentSlotStart.getTime() + slotDuration + BUFFER_MINUTES * 60 * 1000);
        }
        return slots;
    }
    async create(dto) {
        const barber = await this.getDefaultBarber();
        const service = await this.prisma.service.findFirst({
            where: { id: dto.serviceId, isActive: true },
        });
        if (!service) {
            throw new common_1.NotFoundException('Servicio no encontrado');
        }
        const startTime = new Date(dto.startTime);
        const endTime = new Date(startTime.getTime() + service.durationMin * 60 * 1000);
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
            throw new common_1.BadRequestException('Este horario ya no está disponible. Por favor, elegí otro.');
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
        this.logger.log(`New appointment created: ${appointment.id} for ${client.name}`);
        return appointment;
    }
    async findAll(barberId, filters) {
        const where = { barberId };
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.date) {
            const dayStart = new Date(filters.date + 'T00:00:00-03:00');
            const dayEnd = new Date(filters.date + 'T23:59:59-03:00');
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
    async updateStatus(appointmentId, barberId, dto) {
        const appointment = await this.prisma.appointment.findFirst({
            where: { id: appointmentId, barberId },
            include: {
                client: { select: { name: true, email: true } },
                service: { select: { name: true } },
            },
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Turno no encontrado');
        }
        if (dto.status === 'CANCELADO' &&
            appointment.googleEventId) {
            await this.calendarService.deleteEvent(barberId, appointment.googleEventId);
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
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = AppointmentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        calendar_service_1.CalendarService,
        email_service_1.EmailService,
        schedule_service_1.ScheduleService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map