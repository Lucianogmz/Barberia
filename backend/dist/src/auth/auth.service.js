"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async registerTokens(dto) {
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
        const payload = {
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
    async getProfile(userId) {
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map