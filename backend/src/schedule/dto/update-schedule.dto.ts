import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string;

  @IsBoolean()
  isActive: boolean;
}

export class UpdateScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  schedule: ScheduleDayDto[];
}
