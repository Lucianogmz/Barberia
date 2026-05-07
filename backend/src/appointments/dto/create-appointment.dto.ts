import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string; // ISO 8601 date string

  // Client guest info
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsEmail()
  @IsNotEmpty()
  clientEmail: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
