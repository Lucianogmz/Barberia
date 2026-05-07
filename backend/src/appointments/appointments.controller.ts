import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppointmentStatus } from '@prisma/client';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * GET /appointments/available-slots?date=2026-05-10&serviceId=xxx
   * Public — Get available time slots for a date and service.
   */
  @Get('available-slots')
  async getAvailableSlots(
    @Query('date') date: string,
    @Query('serviceId') serviceId: string,
  ) {
    return this.appointmentsService.getAvailableSlots(date, serviceId);
  }

  /**
   * POST /appointments
   * Public — Create a new booking (guest).
   */
  @Post()
  async create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  /**
   * GET /appointments
   * Protected — List appointments with optional filters.
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Request() req: any,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll(req.user.id, {
      date,
      status,
    });
  }

  /**
   * PATCH /appointments/:id/status
   * Protected — Update appointment status.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.appointmentsService.updateStatus(id, req.user.id, dto);
  }
}
