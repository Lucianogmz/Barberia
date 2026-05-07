import { PrismaService } from '../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
export declare const DAY_NAMES_ES: string[];
export declare class ScheduleService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSchedule(barberId: string): Promise<{
        dayOfWeek: number;
        dayName: string;
        startTime: string;
        endTime: string;
        isActive: boolean;
    }[]>;
    getScheduleForDay(barberId: string, dayOfWeek: number): Promise<{
        id: string;
        isActive: boolean;
        barberId: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
    } | null>;
    updateSchedule(barberId: string, dto: UpdateScheduleDto): Promise<{
        dayOfWeek: number;
        dayName: string;
        startTime: string;
        endTime: string;
        isActive: boolean;
    }[]>;
    initializeDefaultSchedule(barberId: string): Promise<{
        dayOfWeek: number;
        dayName: string;
        startTime: string;
        endTime: string;
        isActive: boolean;
    }[]>;
}
