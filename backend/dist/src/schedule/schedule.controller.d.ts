import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
export declare class ScheduleController {
    private readonly scheduleService;
    constructor(scheduleService: ScheduleService);
    getSchedule(req: any): Promise<{
        dayOfWeek: number;
        dayName: string;
        startTime: string;
        endTime: string;
        isActive: boolean;
    }[]>;
    updateSchedule(req: any, dto: UpdateScheduleDto): Promise<{
        dayOfWeek: number;
        dayName: string;
        startTime: string;
        endTime: string;
        isActive: boolean;
    }[]>;
}
