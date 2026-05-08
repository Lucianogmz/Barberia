import { PrismaService } from '../prisma/prisma.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
export declare const DAY_NAMES_ES: string[];
export interface ScheduleDayResponse {
    dayOfWeek: number;
    dayName: string;
    isActive: boolean;
    morning: {
        start: string;
        end: string;
    };
    afternoon: {
        start: string;
        end: string;
    } | null;
}
export declare class ScheduleService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getSchedule(barberId: string): Promise<ScheduleDayResponse[]>;
    getScheduleForDay(barberId: string, dayOfWeek: number): Promise<{
        id: string;
        isActive: boolean;
        barberId: string;
        dayOfWeek: number;
        morningStart: string;
        morningEnd: string;
        afternoonStart: string | null;
        afternoonEnd: string | null;
    } | null>;
    updateSchedule(barberId: string, dto: UpdateScheduleDto): Promise<ScheduleDayResponse[]>;
    initializeDefaultSchedule(barberId: string): Promise<ScheduleDayResponse[]>;
}
