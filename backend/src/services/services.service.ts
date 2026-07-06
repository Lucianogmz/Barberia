import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

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
   * List all services including inactive (protected — for barber dashboard).
   */
  async findAll(barberId: string) {
    return this.prisma.service.findMany({
      where: { barberId },
      orderBy: { createdAt: 'desc' },
    });
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
