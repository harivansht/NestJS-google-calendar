export type IcsMethod = 'REQUEST' | 'CANCEL' | 'PUBLISH';
export type IcsStatus = 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';

export interface IcsAttendeeDto {
  email: string;
  name?: string;
  role?: 'REQ-PARTICIPANT' | 'OPT-PARTICIPANT' | 'CHAIR' | 'NON-PARTICIPANT';
  partStat?: 'NEEDS-ACTION' | 'ACCEPTED' | 'TENTATIVE' | 'DECLINED';
  rsvp?: boolean;
}

export interface IcsOrganizerDto {
  email: string;
  name?: string;
}

export interface IcsAlarmDto {
  // Trigger minutes before start (negative ISO 8601 duration)
  triggerMinutesBefore?: number; // e.g., 10 -> TRIGGER:-PT10M
  description?: string;
  action?: 'DISPLAY' | 'EMAIL';
}

export interface IcsEventDto {
  uid?: string;
  method?: IcsMethod;
  sequence?: number;
  status?: IcsStatus;

  startsAt: string | Date;
  endsAt?: string | Date;
  durationMinutes?: number; // used if endsAt absent

  title?: string; // preferred
  subject?: string; // fallback
  description?: string;
  location?: string;
  url?: string;

  organizer?: IcsOrganizerDto;
  attendees?: IcsAttendeeDto[];

  // Extensibility hook for extra properties if needed
  [key: string]: any;
}
