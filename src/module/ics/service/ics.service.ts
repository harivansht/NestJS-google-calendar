/* eslint-disable linebreak-style */
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  crlfJoin,
  escapeText,
  foldLine,
  formatDateUtc,
  nowUtcStamp,
  buildProp,
} from '../util/ics.util';
import { IcsAttendeeDto, IcsEventDto, IcsMethod } from '../dto/ics.dto';

@Injectable()
export class IcsMeetingService {
  private normalize(input: any): IcsEventDto {
    const title = input.title || input.subject || 'Meeting';
    const startsAt =
      input.startsAt || input.start || input.startTime || new Date();
    const endsAt = input.endsAt || input.end || input.endTime;
    const durationMinutes = input.durationMinutes || input.duration || 60;

    const organizer =
      input.organizer ||
      (input.organizerEmail
        ? { email: input.organizerEmail, name: input.organizerName }
        : undefined);

    const attendeesIn = Array.isArray(input.attendees) ? input.attendees : [];
    const attendees: IcsAttendeeDto[] = attendeesIn.flatMap((a: any) => {
      if (!a) return [];
      if (typeof a === 'string') return [{ email: a }];
      if (typeof a.email === 'string') {
        return [
          {
            email: a.email,
            name: a.name,
            role: a.role,
            partStat: a.partStat,
            rsvp: typeof a.rsvp === 'boolean' ? a.rsvp : true,
          },
        ];
      }
      if (Array.isArray(a.email)) {
        return a.email.filter(Boolean).map((e: string) => ({ email: e }));
      }
      return [];
    });

    const method: IcsMethod =
      (input.method as IcsMethod) || (input.cancel ? 'CANCEL' : 'REQUEST');
    const status =
      input.status || (method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED');
    const sequence = typeof input.sequence === 'number' ? input.sequence : 0;
    const uid = input.uid || input.eventId || `${uuidv4()}@etherapp.in`;

    const location = input.location || 'Online';
    const description = input.description || '';
    const url = input.url || input.meetUrl || input.hangoutLink;

    return {
      uid,
      method,
      status,
      sequence,
      startsAt,
      endsAt,
      durationMinutes,
      title,
      description,
      location,
      url,
      organizer,
      attendees,
    } as IcsEventDto;
  }

  private attendeeLines(attendees: IcsAttendeeDto[] = []): string[] {
    return attendees.map((a) => {
      const params: Record<string, string> = {
        CUTYPE: 'INDIVIDUAL',
        ROLE: a.role || 'REQ-PARTICIPANT',
        PARTSTAT: a.partStat || 'NEEDS-ACTION',
        'X-NUM-GUESTS': '0',
      };
      if (a.name) params.CN = escapeText(a.name);
      if (a.rsvp !== false) params.RSVP = 'TRUE';
      return buildProp('ATTENDEE', params, `mailto:${a.email}`);
    });
  }

  generateIcsText(input: any): string {
    const dto = this.normalize(input);
    const now = nowUtcStamp();

    const dtStart = formatDateUtc(dto.startsAt);
    const dtEnd = dto.endsAt
      ? formatDateUtc(dto.endsAt)
      : formatDateUtc(
          new Date(
            new Date(dto.startsAt as any).getTime() +
              (dto.durationMinutes || 60) * 60000,
          ),
        );

    const lines: string[] = [];
    lines.push('BEGIN:VCALENDAR');
    lines.push('PRODID:-//NestJS ICS Service//EN');
    lines.push('VERSION:2.0');
    lines.push('CALSCALE:GREGORIAN');
    lines.push(`METHOD:${dto.method}`);
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${dto.uid}`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);

    if (dto.organizer?.email) {
      const orgParams: Record<string, string> = {};
      if (dto.organizer.name) orgParams.CN = escapeText(dto.organizer.name);
      lines.push(
        buildProp('ORGANIZER', orgParams, `mailto:${dto.organizer.email}`),
      );
    }

    this.attendeeLines(dto.attendees).forEach((l) => lines.push(l));

    if (dto.title)
      lines.push(
        foldLine(buildProp('SUMMARY', undefined, escapeText(dto.title))),
      );
    if (dto.description)
      lines.push(
        foldLine(
          buildProp('DESCRIPTION', undefined, escapeText(dto.description)),
        ),
      );
    if (dto.location)
      lines.push(
        foldLine(buildProp('LOCATION', undefined, escapeText(dto.location))),
      );
    if (dto.url)
      lines.push(foldLine(buildProp('URL', undefined, escapeText(dto.url))));

    if (dto.status) lines.push(`STATUS:${dto.status}`);
    lines.push(`SEQUENCE:${dto.sequence ?? 0}`);
    lines.push('TRANSP:OPAQUE');

    const triggerMinutes =
      typeof input?.alarm?.triggerMinutesBefore === 'number'
        ? input.alarm.triggerMinutesBefore
        : typeof input?.triggerMinutesBefore === 'number'
          ? input.triggerMinutesBefore
          : undefined;
    if (typeof triggerMinutes === 'number' && triggerMinutes > 0) {
      lines.push('BEGIN:VALARM');
      lines.push('ACTION:DISPLAY');
      lines.push(`TRIGGER:-PT${Math.floor(triggerMinutes)}M`);
      lines.push(
        foldLine(
          buildProp(
            'DESCRIPTION',
            undefined,
            escapeText(dto.title || 'Reminder'),
          ),
        ),
      );
      lines.push('END:VALARM');
    }

    lines.push('END:VEVENT');
    lines.push('END:VCALENDAR');

    return crlfJoin(lines);
  }

  generateIcs(input: any): string {
    const icsContent = this.generateIcsText(input);
    return Buffer.from(icsContent, 'utf-8').toString('base64');
  }
}
