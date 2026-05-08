import { ScheduleService } from './schedule.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
export declare class ScheduleController {
    private readonly scheduleService;
    constructor(scheduleService: ScheduleService);
    getSchedule(req: any): Promise<import("./schedule.service").ScheduleDayResponse[]>;
    updateSchedule(req: any, dto: UpdateScheduleDto): Promise<import("./schedule.service").ScheduleDayResponse[]>;
}
