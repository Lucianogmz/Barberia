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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleService = exports.DAY_NAMES_ES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
exports.DAY_NAMES_ES = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
];
let ScheduleService = class ScheduleService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSchedule(barberId) {
        const schedules = await this.prisma.workSchedule.findMany({
            where: { barberId },
            orderBy: { dayOfWeek: 'asc' },
        });
        return Array.from({ length: 7 }, (_, i) => {
            const existing = schedules.find((s) => s.dayOfWeek === i);
            return {
                dayOfWeek: i,
                dayName: exports.DAY_NAMES_ES[i],
                isActive: existing?.isActive ?? false,
                morning: {
                    start: existing?.morningStart ?? '08:00',
                    end: existing?.morningEnd ?? '12:00',
                },
                afternoon: existing?.afternoonStart && existing?.afternoonEnd
                    ? { start: existing.afternoonStart, end: existing.afternoonEnd }
                    : null,
            };
        });
    }
    async getScheduleForDay(barberId, dayOfWeek) {
        return this.prisma.workSchedule.findUnique({
            where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
        });
    }
    async updateSchedule(barberId, dto) {
        const operations = dto.schedule.map((day) => this.prisma.workSchedule.upsert({
            where: {
                barberId_dayOfWeek: { barberId, dayOfWeek: day.dayOfWeek },
            },
            update: {
                isActive: day.isActive,
                morningStart: day.morning.start,
                morningEnd: day.morning.end,
                afternoonStart: day.afternoon?.start ?? null,
                afternoonEnd: day.afternoon?.end ?? null,
            },
            create: {
                barberId,
                dayOfWeek: day.dayOfWeek,
                isActive: day.isActive,
                morningStart: day.morning.start,
                morningEnd: day.morning.end,
                afternoonStart: day.afternoon?.start ?? null,
                afternoonEnd: day.afternoon?.end ?? null,
            },
        }));
        await this.prisma.$transaction(operations);
        return this.getSchedule(barberId);
    }
    async initializeDefaultSchedule(barberId) {
        const defaults = Array.from({ length: 7 }, (_, i) => ({
            barberId,
            dayOfWeek: i,
            isActive: i !== 0,
            morningStart: '08:00',
            morningEnd: '12:00',
            afternoonStart: i >= 1 && i <= 5 ? '17:00' : null,
            afternoonEnd: i >= 1 && i <= 5 ? '20:00' : null,
        }));
        await this.prisma.workSchedule.createMany({
            data: defaults,
            skipDuplicates: true,
        });
        return this.getSchedule(barberId);
    }
};
exports.ScheduleService = ScheduleService;
exports.ScheduleService = ScheduleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScheduleService);
//# sourceMappingURL=schedule.service.js.map