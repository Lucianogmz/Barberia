import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
export declare class ServicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getDefaultBarber;
    findActive(): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
    }[]>;
    findAllWithDefaultBarber(): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findAll(barberId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createWithDefaultBarber(dto: CreateServiceDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateWithDefaultBarber(id: string, dto: UpdateServiceDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deactivateWithDefaultBarber(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(barberId: string, dto: CreateServiceDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, barberId: string, dto: UpdateServiceDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deactivate(id: string, barberId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
