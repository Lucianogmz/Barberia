import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

export const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export interface ScheduleDayResponse {
  dayOfWeek: number;
  dayName: string;
  isActive: boolean;
  morning: { start: string; end: string };
  afternoon: { start: string; end: string } | null;
}

@Injectable()
export class ScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getSchedule(barberId: string): Promise<ScheduleDayResponse[]> {
    const schedules = await this.prisma.workSchedule.findMany({
      where: { barberId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return Array.from({ length: 7 }, (_, i) => {
      const existing = schedules.find((s: any) => s.dayOfWeek === i);
      return {
        dayOfWeek: i,
        dayName: DAY_NAMES_ES[i],
        isActive: existing?.isActive ?? false,
        morning: {
          start: existing?.morningStart ?? '08:00',
          end: existing?.morningEnd ?? '12:00',
        },
        afternoon: existing?.afternoonStart && existing?.afternoonEnd
          ? { start: existing.afternoonStart, end: existing.afternoonEnd }
          : null,
      };
    });
  }

  async getScheduleForDay(barberId: string, dayOfWeek: number) {
    return this.prisma.workSchedule.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
    });
  }

  async updateSchedule(barberId: string, dto: UpdateScheduleDto) {
    const operations = dto.schedule.map((day) =>
      this.prisma.workSchedule.upsert({
        where: {
          barberId_dayOfWeek: { barberId, dayOfWeek: day.dayOfWeek },
        },
        update: {
          isActive: day.isActive,
          morningStart: day.morning.start,
          morningEnd: day.morning.end,
          afternoonStart: day.afternoon?.start ?? null,
          afternoonEnd: day.afternoon?.end ?? null,
        },
        create: {
          barberId,
          dayOfWeek: day.dayOfWeek,
          isActive: day.isActive,
          morningStart: day.morning.start,
          morningEnd: day.morning.end,
          afternoonStart: day.afternoon?.start ?? null,
          afternoonEnd: day.afternoon?.end ?? null,
        },
      }),
    );

    await this.prisma.$transaction(operations);
    return this.getSchedule(barberId);
  }

  async initializeDefaultSchedule(barberId: string) {
    const defaults = Array.from({ length: 7 }, (_, i) => ({
      barberId,
      dayOfWeek: i,
      isActive: i !== 0,
      morningStart: '08:00',
      morningEnd: '12:00',
      afternoonStart: i >= 1 && i <= 5 ? '17:00' : null,
      afternoonEnd: i >= 1 && i <= 5 ? '20:00' : null,
    }));

    await this.prisma.workSchedule.createMany({
      data: defaults,
      skipDuplicates: true,
    });

    return this.getSchedule(barberId);
  }
}
