import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getDefaultBarber() {
    const barber = await this.prisma.user.findFirst({
      where: { role: 'BARBER' },
    });
    if (!barber) {
      throw new Error('No se encontró un barbero configurado');
    }
    return barber;
  }

  /**
   * List active services (public — for client booking).
   */
  async findActive() {
    return this.prisma.service.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        durationMin: true,
      },
    });
  }

  /**
   * Wrapper: Find all services using default barber.
   */
  async findAllWithDefaultBarber() {
    const barber = await this.getDefaultBarber();
    return this.findAll(barber.id);
  }

  /**
   * List all services including inactive (protected — for barber dashboard).
   */
  async findAll(barberId: string) {
    return this.prisma.service.findMany({
      where: { barberId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Wrapper: Create service using default barber.
   */
  async createWithDefaultBarber(dto: CreateServiceDto) {
    const barber = await this.getDefaultBarber();
    return this.create(barber.id, dto);
  }

  /**
   * Wrapper: Update service using default barber.
   */
  async updateWithDefaultBarber(id: string, dto: UpdateServiceDto) {
    const barber = await this.getDefaultBarber();
    return this.update(id, barber.id, dto);
  }

  /**
   * Wrapper: Deactivate service using default barber.
   */
  async deactivateWithDefaultBarber(id: string) {
    const barber = await this.getDefaultBarber();
    return this.deactivate(id, barber.id);
  }

  /**
   * Get a single service by ID.
   */
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return service;
  }

  /**
   * Create a new service.
   */
  async create(barberId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        ...dto,
        barberId,
      },
    });
  }

  /**
   * Update a service.
   */
  async update(id: string, barberId: string, dto: UpdateServiceDto) {
    // Verify ownership
    const service = await this.prisma.service.findFirst({
      where: { id, barberId },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Soft-delete a service (set isActive = false).
   */
  async deactivate(id: string, barberId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, barberId },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }

    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
