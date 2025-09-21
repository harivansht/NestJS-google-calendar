// src/google/google.service.ts
import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );
  }

  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/calendar.events'],
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens; // { access_token, refresh_token, expiry_date, ... }
  }

  getCalendarClient(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  async createEvent(userRefreshToken: string, payload: any) {
    const calendar = this.getCalendarClient(userRefreshToken);

    const event = {
      summary: payload.title,
      description: payload.description,
      location: payload.location,
      start: { dateTime: payload.startTime },
      end: { dateTime: payload.endTime },
      attendees: payload.attendees.map((email) => ({ email })),
    };

    //     curl --location 'http://localhost:8080/google/create' \
    // --header 'Content-Type: application/json' \
    // --data-raw '{
    //   "title": "Counseling Session",
    //   "description": "Career guidance discussion",
    //   "location": "https://maps.app.goo.gl/JtMGFaefP3kDbMnK6",
    //   "startTime": "2025-09-07T10:00:00+05:30",
    // "endTime":   "2025-09-07T11:00:00+05:30",
    //   "attendees": [""]
    // }'

    const res = await calendar.events.insert({
      calendarId: 'primary',
      sendUpdates: 'all', // 👈 ensures invites are emailed
      requestBody: event,
    });

    return { success: true, eventId: res.data.id, htmlLink: res.data.htmlLink };
  }

  // google.service.ts
  async updateEvent(
    eventId: string,
    updatePayload: any,
    userRefreshToken: string,
  ): Promise<any> {
    const calendar = this.getCalendarClient(userRefreshToken);

    //     curl --location 'http://localhost:8080/google/create' \
    // --header 'Content-Type: application/json' \
    // --data-raw '{
    //     "eventId" : "7908plh9d3gllijth1kk6v5h4o",
    //   "title": "Counseling Session",
    //   "description": "Career guidance discussion https://meet.google.com/abc",

    //   "startTime": "2025-09-07T10:00:00+05:30",
    // "endTime":   "2025-09-07T11:00:00+05:30",
    // }'

    const event = {
      // subject: updatePayload.subject,
      summary: updatePayload.title,
      description: updatePayload.description,
      location: updatePayload.location,
      start: {
        dateTime: updatePayload.startTime,
        timeZone: updatePayload.timeZone || 'Asia/Kolkata',
      },
      end: {
        dateTime: updatePayload.endTime,
        timeZone: updatePayload.timeZone || 'Asia/Kolkata',
      },
      attendees: updatePayload.attendees?.map((email) => ({ email })) || [],
    };

    // If online meeting with custom link
    if (updatePayload.meetingType === 'online' && updatePayload.meetingLink) {
      event.description = `${event.description || ''}\nJoin here: ${updatePayload.meetingLink}`;
    }

    // If physical meeting
    if (updatePayload.meetingType === 'offline' && updatePayload.location) {
      event['location'] = updatePayload.location;
    }

    // If Google Meet requested
    // if (updatePayload.meetingType === 'googleMeet') {
    //   event['conferenceData'] = {
    //     createRequest: {
    //       requestId: `update-${Date.now()}`,
    //       conferenceSolutionKey: { type: 'hangoutsMeet' },
    //     },
    //   };
    // }

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event,
      // conferenceDataVersion: updatePayload.meetingType === 'googleMeet' ? 1 : 0,
      sendUpdates: 'all', // ensures all attendees get updated invite
    });

    return response;
  }
}
