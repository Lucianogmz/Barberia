import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('revenue')
@UseGuards(JwtAuthGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  /**
   * GET /revenue/summary
   * Dashboard overview: today, week, and month metrics.
   */
  @Get('summary')
  async getDashboardSummary(@Request() req: any) {
    return this.revenueService.getDashboardSummary(req.user.id);
  }

  /**
   * GET /revenue/monthly?year=2026&month=5
   * Monthly revenue + appointment stats.
   */
  @Get('monthly')
  async getMonthlyRevenue(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.revenueService.getMonthlyRevenue(req.user.id, y, m);
  }

  /**
   * GET /revenue/services?year=2026&month=5
   * Service breakdown for the month.
   */
  @Get('services')
  async getServiceBreakdown(
    @Request() req: any,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) || new Date().getMonth() + 1;
    return this.revenueService.getServiceBreakdown(req.user.id, y, m);
  }
}
