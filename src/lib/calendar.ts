// src/lib/calendar.ts
//
// Generates .ics file content and "Add to Calendar" URLs
// for Google Calendar, Apple Calendar, and Outlook.

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startUtc: Date;
  endUtc: Date;
  organizerName?: string;
  organizerEmail?: string;
}

/**
 * Format a Date to ICS timestamp: 20260312T140000Z
 */
function toICSDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Escape special characters for ICS text fields
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate a .ics file as a string
 */
export function generateICS(event: CalendarEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@bookbetter.app`;
  const now = toICSDate(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookBetter//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${toICSDate(event.startUtc)}`,
    `DTEND:${toICSDate(event.endUtc)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    'STATUS:CONFIRMED',
  ];

  if (event.organizerEmail) {
    lines.push(
      `ORGANIZER;CN=${escapeICS(event.organizerName || 'BookBetter')}:mailto:${event.organizerEmail}`
    );
  }

  lines.push(
    // Reminder 1 hour before
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(event.title)} starts in 1 hour`,
    'END:VALARM',
    // Reminder 15 min before
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeICS(event.title)} starts in 15 minutes`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );

  return lines.join('\r\n');
}

/**
 * Generate a Google Calendar "Add Event" URL
 */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toICSDate(event.startUtc)}/${toICSDate(event.endUtc)}`,
    details: event.description,
    location: event.location,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate an Outlook.com calendar URL
 */
export function outlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    startdt: event.startUtc.toISOString(),
    enddt: event.endUtc.toISOString(),
    location: event.location,
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}
