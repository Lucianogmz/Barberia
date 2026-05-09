import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    findActive(): Promise<{
        id: string;
        name: string;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
    }[]>;
    findAll(): Promise<{
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
    create(dto: CreateServiceDto): Promise<{
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
    update(id: string, dto: UpdateServiceDto): Promise<{
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
    deactivate(id: string): Promise<{
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
