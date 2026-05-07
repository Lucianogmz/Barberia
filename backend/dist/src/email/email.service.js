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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let EmailService = EmailService_1 = class EmailService {
    configService;
    logger = new common_1.Logger(EmailService_1.name);
    resend;
    fromEmail;
    constructor(configService) {
        this.configService = configService;
        this.resend = new resend_1.Resend(this.configService.get('RESEND_API_KEY'));
        this.fromEmail =
            this.configService.get('EMAIL_FROM') ?? 'turnos@barberia.com';
    }
    formatDateES(date) {
        return date.toLocaleDateString('es-AR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Argentina/Buenos_Aires',
        });
    }
    formatTimeES(date) {
        return date.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Argentina/Buenos_Aires',
        });
    }
    formatPriceARS(price) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
        }).format(price);
    }
    async sendBookingConfirmation(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send booking confirmation to ${data.clientEmail}: ${error.message}`);
        }
    }
    async sendCancellationNotification(data) {
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
        }
        catch (error) {
            this.logger.error(`Failed to send cancellation email to ${data.clientEmail}: ${error.message}`);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map