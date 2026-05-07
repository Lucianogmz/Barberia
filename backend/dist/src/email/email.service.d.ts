import { ConfigService } from '@nestjs/config';
export interface BookingConfirmationData {
    clientName: string;
    clientEmail: string;
    serviceName: string;
    startTime: Date;
    endTime: Date;
    price: number;
}
export interface CancellationNotificationData {
    clientName: string;
    clientEmail: string;
    serviceName: string;
    startTime: Date;
}
export declare class EmailService {
    private readonly configService;
    private readonly logger;
    private readonly resend;
    private readonly fromEmail;
    constructor(configService: ConfigService);
    private formatDateES;
    private formatTimeES;
    private formatPriceARS;
    sendBookingConfirmation(data: BookingConfirmationData): Promise<void>;
    sendCancellationNotification(data: CancellationNotificationData): Promise<void>;
}
