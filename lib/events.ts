// Utilities for chapter events: datetime-local conversion, Google Calendar URLs, ICS export.
// Used by EventFormModal (date handling, GCal URL) and EventsFeed (ICS download).

import type { Event } from "@/types/event";

// ─── datetime-local helpers ───────────────────────────────────────────────────

const pad = (n: number): string => String(n).padStart(2, "0");

/**
 * Convert a JS Date to a value string for <input type="datetime-local">.
 * Uses local-time getters so the picker shows the correct local time.
 */
export function toDatetimeLocal(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * Parse a datetime-local string back to a JS Date in local time.
 * Returns undefined if the string is empty.
 *
 * Does NOT use new Date(string) directly to avoid timezone ambiguity —
 * ECMA-262 parses "YYYY-MM-DDTHH:mm" as local time, but this is explicit.
 */
export function fromDatetimeLocal(value: string): Date | undefined {
  if (!value) return undefined;
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Local "YYYY-MM-DD" key for bucketing events into calendar day cells.
 * Uses local-time getters so events land on the correct day for the member's timezone.
 */
export function toLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// ─── Google Calendar URL ──────────────────────────────────────────────────────

function formatGCalDate(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  );
}

/**
 * Build a Google Calendar "Add to Calendar" URL for a single event.
 * Uses bare local-time datetimes (no Z suffix) so Google Calendar displays
 * the event at the correct local time regardless of the viewer's timezone.
 * Opens in a new tab — no OAuth required.
 */
export function buildGoogleCalendarUrl(event: Event): string {
  const end = event.endDate ?? new Date(event.startDate.getTime() + 60 * 60 * 1000);
  const dates = `${formatGCalDate(event.startDate)}/${formatGCalDate(end)}`;

  const details = event.link
    ? `${event.description}\n\n${event.link}`
    : event.description;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    details,
  });
  if (event.location) params.set("location", event.location);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─── ICS Export ──────────────────────────────────────────────────────────────

function formatICSDate(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

/** RFC 5545 §3.1 line folding: max 75 octets per line, continuation lines prefixed with a space. */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let offset = 0;
  let first = true;

  while (offset < bytes.length) {
    const limit = first ? 75 : 74;
    let end = offset + limit;
    if (end >= bytes.length) {
      chunks.push(new TextDecoder().decode(bytes.slice(offset)));
      break;
    }
    // Walk back to avoid splitting a UTF-8 multi-byte sequence
    while (end > offset && (bytes[end]! & 0xc0) === 0x80) end--;
    chunks.push(new TextDecoder().decode(bytes.slice(offset, end)));
    offset = end;
    first = false;
  }

  return chunks.join("\r\n ");
}

/**
 * Generate a VCALENDAR ICS string for a list of events.
 * RFC 5545 compliant: CRLF endings, 75-octet folding, UTC datetimes.
 */
export function generateICS(events: Event[]): string {
  const now = formatICSDate(new Date());

  const vevents = events.map((ev) => {
    const end = ev.endDate ?? new Date(ev.startDate.getTime() + 60 * 60 * 1000);
    const lines = [
      "BEGIN:VEVENT",
      foldLine(`UID:${ev.id}@akpsi-uw`),
      foldLine(`DTSTAMP:${now}`),
      foldLine(`DTSTART:${formatICSDate(ev.startDate)}`),
      foldLine(`DTEND:${formatICSDate(end)}`),
      foldLine(`SUMMARY:${escapeICS(ev.title)}`),
      foldLine(`DESCRIPTION:${escapeICS(ev.description)}`),
    ];
    if (ev.location) lines.push(foldLine(`LOCATION:${escapeICS(ev.location)}`));
    if (ev.link) lines.push(foldLine(`URL:${ev.link}`));
    lines.push("END:VEVENT");
    return lines.join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AKPsi UW//Chapter Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...vevents,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Trigger a browser download of all provided events as an .ics file. */
export function downloadICS(events: Event[], filename = "akpsi-events.ics"): void {
  const content = generateICS(events);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Defer revocation so the browser has time to initiate the download from the blob URL.
  // Synchronous revocation causes silent failures on Firefox and Safari.
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
