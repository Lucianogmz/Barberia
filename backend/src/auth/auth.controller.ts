import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterTokensDto } from './dto/register-tokens.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register-tokens
   * Called by the frontend after Google OAuth login.
   * Stores the barber's Google tokens and returns a JWT.
   */
  @Post('register-tokens')
  async registerTokens(@Body() dto: RegisterTokensDto) {
    return this.authService.registerTokens(dto);
  }

  /**
   * GET /auth/profile
   * Returns the authenticated barber's profile.
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
