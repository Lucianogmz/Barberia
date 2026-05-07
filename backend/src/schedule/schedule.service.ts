import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

// Day names in Spanish for reference/display
export const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get the barber's work schedule for all days.
   */
  async getSchedule(barberId: string) {
    const schedules = await this.prisma.workSchedule.findMany({
      where: { barberId },
      orderBy: { dayOfWeek: 'asc' },
    });

    // Return all 7 days, filling in defaults for missing days
    return Array.from({ length: 7 }, (_, i) => {
      const existing = schedules.find((s) => s.dayOfWeek === i);
      return {
        dayOfWeek: i,
        dayName: DAY_NAMES_ES[i],
        startTime: existing?.startTime ?? '09:00',
        endTime: existing?.endTime ?? '19:00',
        isActive: existing?.isActive ?? false,
      };
    });
  }

  /**
   * Get the schedule for a specific day of the week.
   */
  async getScheduleForDay(barberId: string, dayOfWeek: number) {
    const schedule = await this.prisma.workSchedule.findUnique({
      where: {
        barberId_dayOfWeek: { barberId, dayOfWeek },
      },
    });

    return schedule;
  }

  /**
   * Update the barber's entire work schedule (upsert all 7 days).
   */
  async updateSchedule(barberId: string, dto: UpdateScheduleDto) {
    const operations = dto.schedule.map((day) =>
      this.prisma.workSchedule.upsert({
        where: {
          barberId_dayOfWeek: { barberId, dayOfWeek: day.dayOfWeek },
        },
        update: {
          startTime: day.startTime,
          endTime: day.endTime,
          isActive: day.isActive,
        },
        create: {
          barberId,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isActive: day.isActive,
        },
      }),
    );

    await this.prisma.$transaction(operations);

    return this.getSchedule(barberId);
  }

  /**
   * Initialize default schedule for a new barber.
   * Mon-Sat 09:00-19:00, Sunday off.
   */
  async initializeDefaultSchedule(barberId: string) {
    const defaults = Array.from({ length: 7 }, (_, i) => ({
      barberId,
      dayOfWeek: i,
      startTime: '09:00',
      endTime: '19:00',
      isActive: i !== 0, // Sunday (0) is off by default
    }));

    await this.prisma.workSchedule.createMany({
      data: defaults,
      skipDuplicates: true,
    });

    return this.getSchedule(barberId);
  }
}
