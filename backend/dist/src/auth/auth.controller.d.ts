import { AuthService } from './auth.service';
import { RegisterTokensDto } from './dto/register-tokens.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        image: string | null;
        role: import(".prisma/client/client").$Enums.Role;
        createdAt: Date;
    } | null>;
}
