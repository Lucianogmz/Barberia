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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const TZ = 'America/Argentina/Buenos_Aires';
let RevenueService = class RevenueService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getMonthRangeUTC(year, month) {
        const start = dayjs_1.default.tz(`${year}-${String(month).padStart(2, '0')}-01 00:00:00`, TZ);
        return { startUTC: start.toDate(), endUTC: start.add(1, 'month').toDate() };
    }
    async getMonthlyRevenue(barberId, year, month) {
        const { startUTC, endUTC } = this.getMonthRangeUTC(year, month);
        const [completed, cancelled, noShow, pending] = await Promise.all([
            this.prisma.appointment.aggregate({
                where: {
                    barberId,
                    status: 'COMPLETADO',
                    startTime: { gte: startUTC, lt: endUTC },
                },
                _sum: { priceAtBooking: true },
                _count: true,
            }),
            this.prisma.appointment.count({
                where: {
                    barberId,
                    status: 'CANCELADO',
                    startTime: { gte: startUTC, lt: endUTC },
                },
            }),
            this.prisma.appointment.count({
                where: {
                    barberId,
                    status: 'NO_ASISTIO',
                    startTime: { gte: startUTC, lt: endUTC },
                },
            }),
            this.prisma.appointment.count({
                where: {
                    barberId,
                    status: 'PENDIENTE',
                    startTime: { gte: startUTC, lt: endUTC },
                },
            }),
        ]);
        return {
            totalRevenue: Number(completed._sum.priceAtBooking ?? 0),
            completedCount: completed._count,
            cancelledCount: cancelled,
            noShowCount: noShow,
            pendingCount: pending,
        };
    }
    async getDashboardSummary(barberId) {
        const nowAr = (0, dayjs_1.default)().tz(TZ);
        const todayStartUTC = nowAr.startOf('day').toDate();
        const todayEndUTC = nowAr.endOf('day').toDate();
        const dow = nowAr.day();
        const mondayOffset = dow === 0 ? -6 : 1 - dow;
        const weekStart = nowAr.add(mondayOffset, 'day').startOf('day');
        const weekStartUTC = weekStart.toDate();
        const weekEndUTC = weekStart.add(7, 'day').toDate();
        const monthStart = nowAr.startOf('month');
        const monthStartUTC = monthStart.toDate();
        const monthEndUTC = monthStart.add(1, 'month').toDate();
        const [todayRevenue, weekRevenue, monthRevenue, todayAppointments] = await Promise.all([
            this.prisma.appointment.aggregate({
                where: {
                    barberId,
                    status: 'COMPLETADO',
                    startTime: { gte: todayStartUTC, lte: todayEndUTC },
                },
                _sum: { priceAtBooking: true },
                _count: true,
            }),
            this.prisma.appointment.aggregate({
                where: {
                    barberId,
                    status: 'COMPLETADO',
                    startTime: { gte: weekStartUTC, lt: weekEndUTC },
                },
                _sum: { priceAtBooking: true },
                _count: true,
            }),
            this.prisma.appointment.aggregate({
                where: {
                    barberId,
                    status: 'COMPLETADO',
                    startTime: { gte: monthStartUTC, lt: monthEndUTC },
                },
                _sum: { priceAtBooking: true },
                _count: true,
            }),
            this.prisma.appointment.count({
                where: {
                    barberId,
                    status: 'PENDIENTE',
                    startTime: { gte: todayStartUTC, lte: todayEndUTC },
                },
            }),
        ]);
        return {
            today: {
                revenue: Number(todayRevenue._sum.priceAtBooking ?? 0),
                completedCount: todayRevenue._count,
                pendingCount: todayAppointments,
            },
            week: {
                revenue: Number(weekRevenue._sum.priceAtBooking ?? 0),
                completedCount: weekRevenue._count,
            },
            month: {
                revenue: Number(monthRevenue._sum.priceAtBooking ?? 0),
                completedCount: monthRevenue._count,
            },
        };
    }
    async getServiceBreakdown(barberId, year, month) {
        const { startUTC, endUTC } = this.getMonthRangeUTC(year, month);
        const result = await this.prisma.appointment.groupBy({
            by: ['serviceId'],
            where: {
                barberId,
                status: 'COMPLETADO',
                startTime: { gte: startUTC, lt: endUTC },
            },
            _count: true,
            _sum: { priceAtBooking: true },
            orderBy: { _count: { serviceId: 'desc' } },
        });
        const serviceIds = result.map((r) => r.serviceId);
        const services = await this.prisma.service.findMany({
            where: { id: { in: serviceIds } },
            select: { id: true, name: true },
        });
        const serviceMap = new Map(services.map((s) => [s.id, s.name]));
        return result.map((r) => ({
            serviceId: r.serviceId,
            serviceName: serviceMap.get(r.serviceId) ?? 'Servicio eliminado',
            count: r._count,
            revenue: Number(r._sum.priceAtBooking ?? 0),
        }));
    }
};
exports.RevenueService = RevenueService;
exports.RevenueService = RevenueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RevenueService);
//# sourceMappingURL=revenue.service.js.map