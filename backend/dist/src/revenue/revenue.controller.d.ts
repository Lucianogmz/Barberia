import { RevenueService } from './revenue.service';
export declare class RevenueController {
    private readonly revenueService;
    constructor(revenueService: RevenueService);
    getDashboardSummary(req: any): Promise<{
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
    getMonthlyRevenue(req: any, year: string, month: string): Promise<import("./revenue.service").RevenueSummary>;
    getServiceBreakdown(req: any, year: string, month: string): Promise<import("./revenue.service").ServiceBreakdown[]>;
}
