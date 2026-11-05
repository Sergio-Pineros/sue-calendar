import type { ExternalEvent, RestBlock } from "./types";
import { copy } from "./copy";

export const BUSY_DAY = 4;
export const BUSY_WEEK = 10;

export function eventsOnDate(
  events: ExternalEvent[],
  iso: string,
): ExternalEvent[] {
  return events.filter((event) => {
    const start = event.start.slice(0, 10);
    const end = event.end.slice(0, 10);
    if (event.allDay) {
      return iso >= start && iso < end;
    }
    return iso >= start && iso <= end;
  });
}

export function weekLoad(
  events: ExternalEvent[],
  dates: string[],
  restBlocks: RestBlock[],
) {
  const perDay = dates.map((iso) => ({
    iso,
    count: eventsOnDate(events, iso).length,
    rest: restBlocks.some((block) => block.date === iso),
  }));
  const total = perDay.reduce((sum, day) => sum + day.count, 0);
  const busyDays = perDay.filter((day) => day.count >= BUSY_DAY).length;
  const restDays = perDay.filter((day) => day.rest).length;
  return {
    perDay,
    total,
    busyDays,
    restDays,
    overloaded: total >= BUSY_WEEK || busyDays >= 2,
  };
}

export function hasLiveCalendar(events: ExternalEvent[]): boolean {
  return events.some(
    (event) =>
      event.source === "google" ||
      event.source === "ics" ||
      event.source === "apple" ||
      event.source === "local",
  );
}

export function eventTimeLabel(event: ExternalEvent): string {
  if (event.allDay) return copy.day.allDay;
  const stamp = event.start.slice(11, 16);
  return stamp || copy.day.timed;
}
