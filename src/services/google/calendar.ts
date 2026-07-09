import { google } from 'googleapis';
import { getAuthenticatedClient, isGoogleConfigured } from './oauth.js';

export interface CalendarEvent {
  id: string;
  summary: string;
  start?: string;
  end?: string;
  location?: string;
}

export class CalendarNotConnectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalendarNotConnectedError';
  }
}

async function getCalendar() {
  if (!isGoogleConfigured()) {
    throw new CalendarNotConnectedError(
      'Google Calendar não configurado (faltam credenciais no .env).'
    );
  }
  const auth = await getAuthenticatedClient();
  if (!auth) {
    throw new CalendarNotConnectedError(
      'Google Calendar não conectado. Autorize em /auth/google.'
    );
  }
  return google.calendar({ version: 'v3', auth });
}

/** Lista os eventos de um dia (padrão: hoje). */
export async function listEventsForDay(date = new Date()): Promise<CalendarEvent[]> {
  const calendar = await getCalendar();

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  return (res.data.items ?? []).map((e) => ({
    id: e.id ?? '',
    summary: e.summary ?? '(sem título)',
    start: e.start?.dateTime ?? e.start?.date ?? undefined,
    end: e.end?.dateTime ?? e.end?.date ?? undefined,
    location: e.location ?? undefined,
  }));
}

export interface CreateEventInput {
  summary: string;
  startDateTime: string; // ISO 8601
  endDateTime?: string; // ISO 8601 (padrão: +1h)
  description?: string;
  location?: string;
}

/** Cria um evento no calendário primário. */
export async function createEvent(input: CreateEventInput): Promise<CalendarEvent> {
  const calendar = await getCalendar();

  const start = new Date(input.startDateTime);
  const end = input.endDateTime
    ? new Date(input.endDateTime)
    : new Date(start.getTime() + 60 * 60 * 1000);

  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  const e = res.data;
  return {
    id: e.id ?? '',
    summary: e.summary ?? input.summary,
    start: e.start?.dateTime ?? undefined,
    end: e.end?.dateTime ?? undefined,
    location: e.location ?? undefined,
  };
}
