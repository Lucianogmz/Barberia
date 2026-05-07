import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterTokensDto } from './dto/register-tokens.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Upserts the barber user and stores Google OAuth tokens.
   * Returns a JWT for subsequent API calls.
   */
  async registerTokens(dto: RegisterTokensDto) {
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {
        name: dto.name,
        image: dto.image,
        googleAccessToken: dto.googleAccessToken,
        googleRefreshToken: dto.googleRefreshToken,
        googleTokenExpiry: new Date(dto.googleTokenExpiry),
      },
      create: {
        email: dto.email,
        name: dto.name,
        image: dto.image,
        role: 'BARBER',
        googleAccessToken: dto.googleAccessToken,
        googleRefreshToken: dto.googleRefreshToken,
        googleTokenExpiry: new Date(dto.googleTokenExpiry),
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  /**
   * Get the current user's profile.
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }
}
