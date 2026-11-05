import type { ExternalEvent } from "./types";
import { addDays, parseISODate, toISODate } from "./iso-date";

function unfold(value: string): string {
  return value.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
}

function unescapeText(value: string): string {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function icsDate(raw: string): { iso: string; allDay: boolean } {
  const cleaned = raw.replace(/^[A-Z0-9-]+=/g, "");
  if (/^\d{8}$/.test(cleaned)) {
    return {
      iso: `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`,
      allDay: true,
    };
  }
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(cleaned);
  if (m) {
    return {
      iso: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`,
      allDay: false,
    };
  }
  return { iso: cleaned.slice(0, 10), allDay: true };
}

function param(line: string, key: string): string | null {
  const match = new RegExp(`${key}=([^;:]+)`, "i").exec(line);
  return match ? match[1] : null;
}

const WEEKDAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function parseRRule(raw: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const part of raw.split(";")) {
    const [key, value] = part.split("=");
    if (key && value) map[key.toUpperCase()] = value;
  }
  return map;
}

function untilISO(value: string): string {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  }
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return value.slice(0, 10);
}

function datePart(iso: string): string {
  return iso.slice(0, 10);
}

function withDate(original: string, nextDate: string): string {
  if (original.length <= 10) return nextDate;
  return `${nextDate}${original.slice(10)}`;
}

function addMonths(iso: string, months: number): string {
  const { year, month, day } = parseISODate(datePart(iso));
  const utc = new Date(Date.UTC(year, month - 1 + months, 1));
  const last = new Date(
    Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return toISODate(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    Math.min(day, last),
  );
}

function expandRRule(
  start: { iso: string; allDay: boolean },
  end: { iso: string; allDay: boolean },
  rrule: string,
  rangeStart: string,
  rangeEnd: string,
): { start: string; end: string }[] {
  const rule = parseRRule(rrule);
  const freq = rule.FREQ;
  const interval = Math.max(1, Number(rule.INTERVAL || 1));
  const count = rule.COUNT ? Number(rule.COUNT) : 400;
  const until = rule.UNTIL ? untilISO(rule.UNTIL) : rangeEnd;
  const byDay = rule.BYDAY
    ? rule.BYDAY.split(",").map((code) => WEEKDAY_CODES.indexOf(code.slice(-2)))
    : [];

  const occurrences: { start: string; end: string }[] = [];
  const durationDays = Math.max(
    0,
    Math.round(
      (Date.parse(datePart(end.iso) || end.iso) -
        Date.parse(datePart(start.iso))) /
        86_400_000,
    ),
  );

  const pushIfInRange = (nextStartDate: string) => {
    if (nextStartDate < rangeStart || nextStartDate > rangeEnd) return;
    if (nextStartDate > until) return;
    occurrences.push({
      start: withDate(start.iso, nextStartDate),
      end: withDate(end.iso, addDays(nextStartDate, durationDays || (end.allDay ? 1 : 0))),
    });
  };

  if (!freq || freq === "YEARLY") {
    pushIfInRange(datePart(start.iso));
    return occurrences;
  }

  if (freq === "WEEKLY" && byDay.length > 0) {
    let cursor = datePart(start.iso);
    let guard = 0;
    while (occurrences.length < count && cursor <= until && guard < 800) {
      const weekday = new Date(`${cursor}T00:00:00Z`).getUTCDay();
      const daysFromStart = Math.round(
        (Date.parse(`${cursor}T00:00:00Z`) -
          Date.parse(`${datePart(start.iso)}T00:00:00Z`)) /
          86_400_000,
      );
      const weeksFromStart = Math.floor(Math.max(0, daysFromStart) / 7);
      if (
        daysFromStart >= 0 &&
        weeksFromStart % interval === 0 &&
        byDay.includes(weekday)
      ) {
        pushIfInRange(cursor);
      }
      cursor = addDays(cursor, 1);
      guard += 1;
    }
    return occurrences.slice(0, count);
  }

  let cursor = datePart(start.iso);
  let n = 0;
  while (n < count && cursor <= until && n < 400) {
    pushIfInRange(cursor);
    n += 1;
    if (freq === "DAILY") cursor = addDays(cursor, interval);
    else if (freq === "WEEKLY") cursor = addDays(cursor, 7 * interval);
    else if (freq === "MONTHLY") cursor = addMonths(cursor, interval);
    else break;
  }
  return occurrences;
}

/**
 * ICS reader for Apple Calendar / Google Calendar exports.
 * Expands DAILY / WEEKLY / MONTHLY RRULE inside the requested year.
 */
export function parseIcs(
  text: string,
  calendarName = "Importado",
  rangeYear = new Date().getFullYear(),
): ExternalEvent[] {
  const unfolded = unfold(text.replace(/\r\n/g, "\n"));
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1);
  const rangeStart = `${rangeYear}-01-01`;
  const rangeEnd = `${rangeYear}-12-31`;
  const events: ExternalEvent[] = [];

  blocks.forEach((block, index) => {
    const body = block.split("END:VEVENT")[0] ?? block;
    const lines = body.split("\n").filter(Boolean);
    const get = (name: string) => {
      const line = lines.find(
        (item) => item.startsWith(`${name}`) || item.startsWith(`${name};`),
      );
      if (!line) return "";
      return unescapeText(line.slice(line.indexOf(":") + 1).trim());
    };
    const start = icsDate(get("DTSTART"));
    const startLine = lines.find((line) => line.startsWith("DTSTART")) ?? "";
    const allDay = start.allDay || startLine.includes("VALUE=DATE");
    let end = get("DTEND") ? icsDate(get("DTEND")) : start;
    if (allDay && datePart(end.iso) <= datePart(start.iso)) {
      end = { iso: addDays(datePart(start.iso), 1), allDay: true };
    }
    const tz = param(startLine, "TZID") ?? "UTC";
    const uid = get("UID") || `ics-${index}`;
    const rrule = get("RRULE");
    const occurrences = rrule
      ? expandRRule(start, end, rrule, rangeStart, rangeEnd)
      : [{ start: start.iso, end: end.iso }];

    occurrences.forEach((occurrence, occIndex) => {
      if (datePart(occurrence.start) < rangeStart || datePart(occurrence.start) > rangeEnd) {
        return;
      }
      events.push({
        id: `ics-${uid}-${occIndex}`,
        source: "ics",
        sourceEventId: uid,
        calendarId: calendarName,
        calendarName,
        title: get("SUMMARY") || "Sin título",
        description: get("DESCRIPTION"),
        start: occurrence.start,
        end: occurrence.end,
        timezone: tz,
        allDay,
        location: get("LOCATION"),
        color: "#D4B8F0",
      });
    });
  });

  return events;
}
