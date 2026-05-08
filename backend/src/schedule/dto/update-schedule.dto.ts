import {
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShiftRangeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Must be in HH:mm format',
  })
  start: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Must be in HH:mm format',
  })
  end: string;
}

export class ScheduleDayDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsBoolean()
  isActive: boolean;

  @ValidateNested()
  @Type(() => ShiftRangeDto)
  morning: ShiftRangeDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShiftRangeDto)
  afternoon?: ShiftRangeDto | null;
}

export class UpdateScheduleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  schedule: ScheduleDayDto[];
}
