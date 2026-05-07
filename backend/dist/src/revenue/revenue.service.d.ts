import { PrismaService } from '../prisma/prisma.service';
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
export declare class RevenueService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getDateRangeUTC;
    getMonthlyRevenue(barberId: string, year: number, month: number): Promise<RevenueSummary>;
    getDashboardSummary(barberId: string): Promise<{
        today: {
            revenue: number;
            completedCount: number;
            pendingCount: number;
        };
        week: {
            revenue: number;
            completedCount: number;
        };
        month: {
            revenue: number;
            completedCount: number;
        };
    }>;
    getServiceBreakdown(barberId: string, year: number, month: number): Promise<ServiceBreakdown[]>;
}
