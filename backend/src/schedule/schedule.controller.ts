import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * GET /schedule
   * Protected — Get the barber's work schedule.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async getSchedule(@Request() req: any) {
    return this.scheduleService.getSchedule(req.user.id);
  }

  /**
   * PUT /schedule
   * Protected — Update the barber's entire work schedule.
   */
  @UseGuards(JwtAuthGuard)
  @Put()
  async updateSchedule(
    @Request() req: any,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.scheduleService.updateSchedule(req.user.id, dto);
  }
}
