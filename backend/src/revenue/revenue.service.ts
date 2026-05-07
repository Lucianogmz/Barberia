import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface RevenueSummary {
  totalRevenue: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  pendingCount: number;
}

export interface ServiceBreakdown {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: number;
}

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Get Argentina timezone date boundaries in UTC.
   */
  private getDateRangeUTC(startDate: Date, endDate: Date) {
    // Argentina is UTC-3, so we add 3 hours to convert local midnight to UTC
    const startUTC = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
    const endUTC = new Date(endDate.getTime() + 3 * 60 * 60 * 1000);
    return { startUTC, endUTC };
  }

  /**
   * Get monthly revenue and appointment stats.
   */
  async getMonthlyRevenue(
    barberId: string,
    year: number,
    month: number, // 1-indexed (1=January)
  ): Promise<RevenueSummary> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1); // First day of next month
    const { startUTC, endUTC } = this.getDateRangeUTC(startOfMonth, endOfMonth);

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

  /**
   * Get a full dashboard summary: today, this week, this month.
   */
  async getDashboardSummary(barberId: string) {
    const now = new Date();

    // Today (Argentina time)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { startUTC: todayStartUTC, endUTC: todayEndUTC } =
      this.getDateRangeUTC(todayStart, todayEnd);

    // This week (Monday start)
    const weekStart = new Date(now);
    const dayOfWeek = weekStart.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const { startUTC: weekStartUTC, endUTC: weekEndUTC } =
      this.getDateRangeUTC(weekStart, weekEnd);

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const { startUTC: monthStartUTC, endUTC: monthEndUTC } =
      this.getDateRangeUTC(monthStart, monthEnd);

    const [todayRevenue, weekRevenue, monthRevenue, todayAppointments] =
      await Promise.all([
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
        // Today's schedule (all statuses)
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

  /**
   * Get service breakdown for the month (most popular services, revenue per service).
   */
  async getServiceBreakdown(
    barberId: string,
    year: number,
    month: number,
  ): Promise<ServiceBreakdown[]> {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 1);
    const { startUTC, endUTC } = this.getDateRangeUTC(startOfMonth, endOfMonth);

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

    // Fetch service names
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
}
