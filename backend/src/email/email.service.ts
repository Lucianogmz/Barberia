import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

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

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
    this.fromEmail =
      this.configService.get<string>('EMAIL_FROM') ?? 'turnos@barberia.com';
  }

  /**
   * Format a date for display in Argentina timezone (Spanish).
   */
  private formatDateES(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }

  /**
   * Format a time for display in Argentina timezone.
   */
  private formatTimeES(date: Date): string {
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }

  /**
   * Format price in ARS.
   */
  private formatPriceARS(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Send booking confirmation email to the client.
   */
  async sendBookingConfirmation(data: BookingConfirmationData) {
    try {
      const dateStr = this.formatDateES(data.startTime);
      const startTimeStr = this.formatTimeES(data.startTime);
      const endTimeStr = this.formatTimeES(data.endTime);
      const priceStr = this.formatPriceARS(data.price);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: data.clientEmail,
        subject: `✂️ Tu turno ha sido reservado — ${dateStr}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">✂️ Turno Confirmado</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin-bottom: 24px;">
                ¡Hola <strong>${data.clientName}</strong>! Tu turno ha sido reservado con éxito.
              </p>
              <div style="background-color: #16213e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #a0a0a0;">Servicio:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #a0a0a0;">Fecha:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #a0a0a0;">Horario:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${startTimeStr} — ${endTimeStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #a0a0a0;">Precio:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #4ade80;">${priceStr}</td>
                  </tr>
                </table>
              </div>
              <p style="font-size: 14px; color: #a0a0a0; text-align: center;">
                Si necesitás cancelar o modificar tu turno, comunicáte con nosotros.
              </p>
            </div>
            <div style="background-color: #0f0f1e; padding: 16px; text-align: center;">
              <p style="font-size: 12px; color: #666; margin: 0;">
                Este es un mensaje automático. Por favor, no respondas a este email.
              </p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Booking confirmation sent to ${data.clientEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send booking confirmation to ${data.clientEmail}: ${error.message}`,
      );
      // Don't throw — email failure shouldn't block the booking
    }
  }

  /**
   * Send cancellation notification email to the client.
   */
  async sendCancellationNotification(data: CancellationNotificationData) {
    try {
      const dateStr = this.formatDateES(data.startTime);
      const timeStr = this.formatTimeES(data.startTime);

      await this.resend.emails.send({
        from: this.fromEmail,
        to: data.clientEmail,
        subject: `❌ Tu turno ha sido cancelado — ${dateStr}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">❌ Turno Cancelado</h1>
            </div>
            <div style="padding: 32px;">
              <p style="font-size: 16px; margin-bottom: 24px;">
                Hola <strong>${data.clientName}</strong>, te informamos que tu turno ha sido cancelado.
              </p>
              <div style="background-color: #16213e; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #a0a0a0;">Servicio:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.serviceName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #a0a0a0;">Fecha:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${dateStr}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #a0a0a0;">Horario:</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${timeStr}</td>
                  </tr>
                </table>
              </div>
              <p style="font-size: 14px; color: #a0a0a0; text-align: center;">
                Podés reservar un nuevo turno en cualquier momento.
              </p>
            </div>
            <div style="background-color: #0f0f1e; padding: 16px; text-align: center;">
              <p style="font-size: 12px; color: #666; margin: 0;">
                Este es un mensaje automático. Por favor, no respondas a este email.
              </p>
            </div>
          </div>
        `,
      });

      this.logger.log(`Cancellation notification sent to ${data.clientEmail}`);
    } catch (error) {
      this.logger.error(
        `Failed to send cancellation email to ${data.clientEmail}: ${error.message}`,
      );
    }
  }
}
