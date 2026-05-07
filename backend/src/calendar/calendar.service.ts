import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

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

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Creates an authenticated OAuth2 client for a specific barber.
   * Automatically refreshes tokens if expired.
   */
  private async getOAuth2Client(barberId: string): Promise<OAuth2Client> {
    const user = await this.prisma.user.findUnique({
      where: { id: barberId },
      select: {
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!user?.googleAccessToken || !user?.googleRefreshToken) {
      throw new Error(
        'Google Calendar tokens not found. Please re-authenticate.',
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
      expiry_date: user.googleTokenExpiry?.getTime(),
    });

    // Auto-refresh if token is expired or about to expire (5 min buffer)
    const now = Date.now();
    const expiry = user.googleTokenExpiry?.getTime() ?? 0;

    if (now >= expiry - 5 * 60 * 1000) {
      this.logger.log(`Refreshing Google tokens for barber ${barberId}`);
      const { credentials } = await oauth2Client.refreshAccessToken();

      // Update tokens in database
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

  /**
   * Get busy intervals from Google Calendar for a date range.
   * This is used to check the barber's personal calendar for blocked times.
   */
  async getBusyIntervals(
    barberId: string,
    timeMin: Date,
    timeMax: Date,
  ): Promise<BusyInterval[]> {
    try {
      const auth = await this.getOAuth2Client(barberId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          timeZone: 'America/Argentina/Buenos_Aires',
          items: [{ id: 'primary' }],
        },
      });

      const busySlots =
        response.data.calendars?.primary?.busy ?? [];

      return busySlots
        .filter((slot): slot is { start: string; end: string } =>
          Boolean(slot.start && slot.end),
        )
        .map((slot) => ({
          start: new Date(slot.start!),
          end: new Date(slot.end!),
        }));
    } catch (error) {
      this.logger.error(
        `Failed to get busy intervals for barber ${barberId}: ${error.message}`,
      );
      // Return empty array on error so booking can still proceed
      // (graceful degradation — worst case, double booking is detected in Calendar)
      return [];
    }
  }

  /**
   * Create a Google Calendar event for a new appointment.
   */
  async createEvent(
    barberId: string,
    eventData: CalendarEventData,
  ): Promise<string | null> {
    try {
      const auth = await this.getOAuth2Client(barberId);
      const calendar = google.calendar({ version: 'v3', auth });

      const event: calendar_v3.Schema$Event = {
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

      // Add attendee email if provided
      if (eventData.attendeeEmail) {
        event.attendees = [{ email: eventData.attendeeEmail }];
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'none', // Don't send Google Calendar invites
      });

      this.logger.log(
        `Created Google Calendar event: ${response.data.id}`,
      );

      return response.data.id ?? null;
    } catch (error) {
      this.logger.error(
        `Failed to create calendar event: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Delete a Google Calendar event (used on cancellation).
   */
  async deleteEvent(
    barberId: string,
    googleEventId: string,
  ): Promise<boolean> {
    try {
      const auth = await this.getOAuth2Client(barberId);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: googleEventId,
      });

      this.logger.log(`Deleted Google Calendar event: ${googleEventId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete calendar event ${googleEventId}: ${error.message}`,
      );
      return false;
    }
  }
}
