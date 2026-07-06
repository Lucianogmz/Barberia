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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AppointmentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const calendar_service_1 = require("../calendar/calendar.service");
const email_service_1 = require("../email/email.service");
const schedule_service_1 = require("../schedule/schedule.service");
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const BUFFER_MINUTES = 10;
const TZ = 'America/Argentina/Buenos_Aires';
const OCCUPYING_STATUSES = ['PENDIENTE', 'COMPLETADO'];
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
            orderBy: { updatedAt: 'desc' },
        });
        if (!barber) {
            throw new common_1.NotFoundException('No se encontró un barbero configurado');
        }
        return barber;
    }
    toArgentinaISO(date) {
        return (0, dayjs_1.default)(date).tz(TZ).format();
    }
    buildRangeBoundaries(dateStr, morningStart, morningEnd, afternoonStart, afternoonEnd) {
        const parseHHMM = (str) => {
            return dayjs_1.default.tz(`${dateStr}T${str}:00`, TZ).toDate();
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
            ].filter(Boolean),
            allUtcStart: afternoonEndTime && afternoonStartTime
                ? afternoonEndTime
                : morningEndTime,
        };
    }
    async getAvailableSlots(date, serviceId) {
        const barber = await this.getDefaultBarber();
        const service = await this.prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service || !service.isActive) {
            throw new common_1.NotFoundException('Servicio no encontrado');
        }
        const targetDate = dayjs_1.default.tz(`${date}T12:00:00`, TZ).toDate();
        const dayOfWeek = targetDate.getDay();
        const schedule = await this.scheduleService.getScheduleForDay(barber.id, dayOfWeek);
        if (!schedule || !schedule.isActive) {
            return [];
        }
        const { ranges, allUtcStart } = this.buildRangeBoundaries(date, schedule.morningStart, schedule.morningEnd, schedule.afternoonStart, schedule.afternoonEnd);
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
        const busyIntervals = await this.calendarService.getBusyIntervals(barber.id, firstUtc, lastUtc);
        const allBusyIntervals = [
            ...existingAppointments.map((a) => ({
                start: a.startTime,
                end: new Date(a.endTime.getTime() + BUFFER_MINUTES * 60 * 1000),
            })),
            ...busyIntervals,
        ];
        const slots = [];
        const slotInterval = service.durationMin * 60 * 1000;
        const appointmentDuration = service.durationMin * 60 * 1000;
        const now = new Date();
        for (const range of ranges) {
            let currentSlotStart = range.utcStart;
            while (currentSlotStart.getTime() + appointmentDuration <= range.utcEnd.getTime()) {
                const currentSlotEnd = new Date(currentSlotStart.getTime() + appointmentDuration);
                const isConflicting = allBusyIntervals.some((busy) => currentSlotStart < busy.end && currentSlotEnd > busy.start);
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
        if (startTime.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('No se puede reservar en el pasado.');
        }
        const startMinusBuffer = new Date(startTime.getTime() - BUFFER_MINUTES * 60 * 1000);
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
        let appointment;
        try {
            appointment = await this.prisma.$transaction(async (tx) => {
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
                    throw new common_1.BadRequestException('Este horario ya no está disponible. Por favor, elegí otro.');
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
            }, { isolationLevel: client_1.Prisma.TransactionIsolationLevel.Serializable });
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException)
                throw error;
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                (error.code === 'P2002' || error.code === 'P2034')) {
                throw new common_1.BadRequestException('Este horario ya no está disponible. Por favor, elegí otro.');
            }
            throw error;
        }
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
        this.logger.log(`New appointment created: ${appointment.id} for ${client.name}`);
        return appointment;
    }
    async findAllByBarberId(barberId, filters) {
        const where = { barberId };
        if (filters?.status) {
            where.status = filters.status;
        }
        if (filters?.date) {
            where.startTime = {
                gte: dayjs_1.default.tz(`${filters.date}T00:00:00`, TZ).toDate(),
                lte: dayjs_1.default.tz(`${filters.date}T23:59:59`, TZ).toDate(),
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
        if (dto.status === 'CANCELADO' && appointment.googleEventId) {
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