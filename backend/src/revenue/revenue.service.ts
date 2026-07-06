import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'America/Argentina/Buenos_Aires';

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
   * Helper: rango [inicio, fin) del mes indicado (month 1-indexado),
   * calculado en hora de Argentina y devuelto en UTC.
   * Independiente del huso del servidor (Vercel/Railway corren en UTC).
   */
  private getMonthRangeUTC(year: number, month: number) {
    const start = dayjs.tz(
      `${year}-${String(month).padStart(2, '0')}-01 00:00:00`,
      TZ,
    );
    return { startUTC: start.toDate(), endUTC: start.add(1, 'month').toDate() };
  }

  /**
   * Get monthly revenue and appointment stats.
   */
  async getMonthlyRevenue(
    barberId: string,
    year: number,
    month: number, // 1-indexed (1=January)
  ): Promise<RevenueSummary> {
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

  /**
   * Get a full dashboard summary: today, this week, this month.
   */
  async getDashboardSummary(barberId: string) {
    // "Ahora" en hora de Argentina, independiente del huso del servidor.
    const nowAr = dayjs().tz(TZ);

    // Hoy [inicio, fin)
    const todayStartUTC = nowAr.startOf('day').toDate();
    const todayEndUTC = nowAr.endOf('day').toDate();

    // Semana (lunes a lunes). dayjs: 0 = domingo.
    const dow = nowAr.day();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    const weekStart = nowAr.add(mondayOffset, 'day').startOf('day');
    const weekStartUTC = weekStart.toDate();
    const weekEndUTC = weekStart.add(7, 'day').toDate();

    // Mes [inicio, fin)
    const monthStart = nowAr.startOf('month');
    const monthStartUTC = monthStart.toDate();
    const monthEndUTC = monthStart.add(1, 'month').toDate();

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

    // Fetch service names
    const serviceIds = result.map((r: any) => r.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true },
    });

    const serviceMap = new Map(services.map((s: any) => [s.id, s.name]));

    return result.map((r: any) => ({
      serviceId: r.serviceId,
      serviceName: serviceMap.get(r.serviceId) ?? 'Servicio eliminado',
      count: r._count,
      revenue: Number(r._sum.priceAtBooking ?? 0),
    }));
  }
}
