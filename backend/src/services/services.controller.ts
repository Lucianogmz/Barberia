import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  /**
   * GET /services
   * Public — List active services for client booking.
   */
  @Get()
  async findActive() {
    return this.servicesService.findActive();
  }

  /**
   * GET /services/all
   * Protected — List all services (including inactive) for barber dashboard.
   */
  @UseGuards(JwtAuthGuard)
  @Get('all')
  async findAll(@Request() req: any) {
    return this.servicesService.findAll(req.user.id);
  }

  /**
   * POST /services
   * Protected — Create a new service.
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(req.user.id, dto);
  }

  /**
   * PATCH /services/:id
   * Protected — Update a service.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, req.user.id, dto);
  }

  /**
   * DELETE /services/:id
   * Protected — Soft-delete (deactivate) a service.
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deactivate(@Param('id') id: string, @Request() req: any) {
    return this.servicesService.deactivate(id, req.user.id);
  }
}
