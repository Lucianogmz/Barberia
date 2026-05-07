import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export interface BusyInterval {
    start: Date;
    end: Date;
}
export interface CalendarEventData {
    summary: string;
    description: string;
    startTime: Date;
    endTime: Date;
    attendeeEmail?: string;
}
export declare class CalendarService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    private getOAuth2Client;
    getBusyIntervals(barberId: string, timeMin: Date, timeMax: Date): Promise<BusyInterval[]>;
    createEvent(barberId: string, eventData: CalendarEventData): Promise<string | null>;
    deleteEvent(barberId: string, googleEventId: string): Promise<boolean>;
}
