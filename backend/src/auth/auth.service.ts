import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterTokensDto } from './dto/register-tokens.dto';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Lista blanca de emails autorizados a operar como barbero (dashboard).
   * Se define en ALLOWED_BARBER_EMAILS (separados por coma). Si está vacía,
   * se permite cualquier email (modo desarrollo) — configurar en producción.
   */
  private assertEmailAllowed(email: string) {
    const raw = this.configService.get<string>('ALLOWED_BARBER_EMAILS') ?? '';
    const allowed = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (allowed.length > 0 && !allowed.includes(email.toLowerCase())) {
      throw new ForbiddenException(
        'Esta cuenta no está autorizada para acceder al panel.',
      );
    }
  }

  /**
   * Upserts the barber user and stores Google OAuth tokens.
   * Returns a JWT for subsequent API calls.
   */
  async registerTokens(dto: RegisterTokensDto) {
    this.assertEmailAllowed(dto.email);

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
