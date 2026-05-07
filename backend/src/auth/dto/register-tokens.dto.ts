import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterTokensDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  googleAccessToken: string;

  @IsString()
  @IsNotEmpty()
  googleRefreshToken: string;

  @IsString()
  @IsNotEmpty()
  googleTokenExpiry: string; // ISO date string
}
