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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ServicesService = class ServicesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDefaultBarber() {
        const barber = await this.prisma.user.findFirst({
            where: { role: 'BARBER' },
        });
        if (!barber) {
            throw new Error('No se encontró un barbero configurado');
        }
        return barber;
    }
    async findActive() {
        return this.prisma.service.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                durationMin: true,
            },
        });
    }
    async findAllWithDefaultBarber() {
        const barber = await this.getDefaultBarber();
        return this.findAll(barber.id);
    }
    async findAll(barberId) {
        return this.prisma.service.findMany({
            where: { barberId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createWithDefaultBarber(dto) {
        const barber = await this.getDefaultBarber();
        return this.create(barber.id, dto);
    }
    async updateWithDefaultBarber(id, dto) {
        const barber = await this.getDefaultBarber();
        return this.update(id, barber.id, dto);
    }
    async deactivateWithDefaultBarber(id) {
        const barber = await this.getDefaultBarber();
        return this.deactivate(id, barber.id);
    }
    async findOne(id) {
        const service = await this.prisma.service.findUnique({
            where: { id },
        });
        if (!service) {
            throw new common_1.NotFoundException('Servicio no encontrado');
        }
        return service;
    }
    async create(barberId, dto) {
        return this.prisma.service.create({
            data: {
                ...dto,
                barberId,
            },
        });
    }
    async update(id, barberId, dto) {
        const service = await this.prisma.service.findFirst({
            where: { id, barberId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Servicio no encontrado');
        }
        return this.prisma.service.update({
            where: { id },
            data: dto,
        });
    }
    async deactivate(id, barberId) {
        const service = await this.prisma.service.findFirst({
            where: { id, barberId },
        });
        if (!service) {
            throw new common_1.NotFoundException('Servicio no encontrado');
        }
        return this.prisma.service.update({
            where: { id },
            data: { isActive: false },
        });
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ServicesService);
//# sourceMappingURL=services.service.js.map