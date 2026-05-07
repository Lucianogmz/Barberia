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
var CalendarService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const googleapis_1 = require("googleapis");
let CalendarService = CalendarService_1 = class CalendarService {
    configService;
    prisma;
    logger = new common_1.Logger(CalendarService_1.name);
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
    }
    async getOAuth2Client(barberId) {
        const user = await this.prisma.user.findUnique({
            where: { id: barberId },
            select: {
                googleAccessToken: true,
                googleRefreshToken: true,
                googleTokenExpiry: true,
            },
        });
        if (!user?.googleAccessToken || !user?.googleRefreshToken) {
            throw new Error('Google Calendar tokens not found. Please re-authenticate.');
        }
        const oauth2Client = new googleapis_1.google.auth.OAuth2(this.configService.get('GOOGLE_CLIENT_ID'), this.configService.get('GOOGLE_CLIENT_SECRET'));
        oauth2Client.setCredentials({
            access_token: user.googleAccessToken,
            refresh_token: user.googleRefreshToken,
            expiry_date: user.googleTokenExpiry?.getTime(),
        });
        const now = Date.now();
        const expiry = user.googleTokenExpiry?.getTime() ?? 0;
        if (now >= expiry - 5 * 60 * 1000) {
            this.logger.log(`Refreshing Google tokens for barber ${barberId}`);
            const { credentials } = await oauth2Client.refreshAccessToken();
            await this.prisma.user.update({
                where: { id: barberId },
                data: {
                    googleAccessToken: credentials.access_token,
                    googleRefreshToken: credentials.refresh_token ?? user.googleRefreshToken,
                    googleTokenExpiry: credentials.expiry_date
                        ? new Date(credentials.expiry_date)
                        : undefined,
                },
            });
            oauth2Client.setCredentials(credentials);
        }
        return oauth2Client;
    }
    async getBusyIntervals(barberId, timeMin, timeMax) {
        try {
            const auth = await this.getOAuth2Client(barberId);
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString(),
                    timeZone: 'America/Argentina/Buenos_Aires',
                    items: [{ id: 'primary' }],
                },
            });
            const busySlots = response.data.calendars?.primary?.busy ?? [];
            return busySlots
                .filter((slot) => Boolean(slot.start && slot.end))
                .map((slot) => ({
                start: new Date(slot.start),
                end: new Date(slot.end),
            }));
        }
        catch (error) {
            this.logger.error(`Failed to get busy intervals for barber ${barberId}: ${error.message}`);
            return [];
        }
    }
    async createEvent(barberId, eventData) {
        try {
            const auth = await this.getOAuth2Client(barberId);
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
            const event = {
                summary: eventData.summary,
                description: eventData.description,
                start: {
                    dateTime: eventData.startTime.toISOString(),
                    timeZone: 'America/Argentina/Buenos_Aires',
                },
                end: {
                    dateTime: eventData.endTime.toISOString(),
                    timeZone: 'America/Argentina/Buenos_Aires',
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'popup', minutes: 30 },
                    ],
                },
            };
            if (eventData.attendeeEmail) {
                event.attendees = [{ email: eventData.attendeeEmail }];
            }
            const response = await calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                sendUpdates: 'none',
            });
            this.logger.log(`Created Google Calendar event: ${response.data.id}`);
            return response.data.id ?? null;
        }
        catch (error) {
            this.logger.error(`Failed to create calendar event: ${error.message}`);
            return null;
        }
    }
    async deleteEvent(barberId, googleEventId) {
        try {
            const auth = await this.getOAuth2Client(barberId);
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth });
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: googleEventId,
            });
            this.logger.log(`Deleted Google Calendar event: ${googleEventId}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to delete calendar event ${googleEventId}: ${error.message}`);
            return false;
        }
    }
};
exports.CalendarService = CalendarService;
exports.CalendarService = CalendarService = CalendarService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], CalendarService);
//# sourceMappingURL=calendar.service.js.map