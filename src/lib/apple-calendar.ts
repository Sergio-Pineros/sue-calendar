import type { ExternalEvent } from "./types";
import type { CalDavCalendar, CalDavDraft } from "./caldav-server";

export type { CalDavCalendar, CalDavDraft };

type CalDavAction =
  | { action: "list" }
  | { action: "events"; year: number; calendars: CalDavCalendar[] }
  | { action: "create"; calendar: CalDavCalendar; draft: CalDavDraft };

async function call<T>(
  appleId: string,
  appPassword: string,
  payload: CalDavAction,
): Promise<T> {
  const res = await fetch("/api/caldav", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ appleId, appPassword, ...payload }),
  });
  const data = (await res.json()) as { error?: string } & T;
  if (!res.ok) {
    throw new Error(data.error || `Apple CalDAV failed (${res.status})`);
  }
  return data;
}

export async function listAppleCalendars(
  appleId: string,
  appPassword: string,
): Promise<CalDavCalendar[]> {
  const data = await call<{ calendars: CalDavCalendar[] }>(appleId, appPassword, {
    action: "list",
  });
  return data.calendars;
}

export async function fetchAppleEvents(
  appleId: string,
  appPassword: string,
  calendars: CalDavCalendar[],
  year: number,
): Promise<ExternalEvent[]> {
  const data = await call<{ events: ExternalEvent[] }>(appleId, appPassword, {
    action: "events",
    year,
    calendars,
  });
  return data.events;
}

export async function createAppleEvent(
  appleId: string,
  appPassword: string,
  calendar: CalDavCalendar,
  draft: CalDavDraft,
): Promise<ExternalEvent> {
  const data = await call<{ event: ExternalEvent }>(appleId, appPassword, {
    action: "create",
    calendar,
    draft,
  });
  return data.event;
}
