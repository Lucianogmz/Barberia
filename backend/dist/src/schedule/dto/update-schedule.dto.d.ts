export declare class ScheduleDayDto {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive: boolean;
}
export declare class UpdateScheduleDto {
    schedule: ScheduleDayDto[];
}
