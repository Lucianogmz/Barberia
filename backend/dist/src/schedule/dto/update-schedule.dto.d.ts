export declare class ShiftRangeDto {
    start: string;
    end: string;
}
export declare class ScheduleDayDto {
    dayOfWeek: number;
    isActive: boolean;
    morning: ShiftRangeDto;
    afternoon?: ShiftRangeDto | null;
}
export declare class UpdateScheduleDto {
    schedule: ScheduleDayDto[];
}
