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
    findAll(req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
    }[]>;
    create(req: any, dto: CreateServiceDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
    }>;
    update(id: string, req: any, dto: UpdateServiceDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
    }>;
    deactivate(id: string, req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        price: import("@prisma/client/runtime/library").Decimal;
        durationMin: number;
        isActive: boolean;
        barberId: string;
    }>;
}
