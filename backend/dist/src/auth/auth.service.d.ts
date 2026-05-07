import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterTokensDto } from './dto/register-tokens.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    registerTokens(dto: RegisterTokensDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            image: string | null;
            role: import(".prisma/client/client").$Enums.Role;
        };
        accessToken: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        image: string | null;
        role: import(".prisma/client/client").$Enums.Role;
        createdAt: Date;
    } | null>;
}
