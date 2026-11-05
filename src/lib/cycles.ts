import type { PersonalCycle } from "./types";
import { parseISODate } from "./iso-date";

export function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO);
  const b = parseISODate(toISO);
  const ms =
    Date.UTC(b.year, b.month - 1, b.day) -
    Date.UTC(a.year, a.month - 1, a.day);
  return Math.round(ms / 86_400_000);
}

export function cyclePosition(cycle: PersonalCycle, iso: string): {
  dayInCycle: number;
  phase: string;
} {
  const delta = daysBetween(cycle.startDate, iso);
  const length = Math.max(1, cycle.length);
  const pos = ((delta % length) + length) % length;
  let acc = 0;
  let phase = cycle.phases[0]?.name ?? "ciclo";
  for (const item of cycle.phases) {
    acc += item.days;
    if (pos < acc) {
      phase = item.name;
      break;
    }
  }
  return { dayInCycle: pos + 1, phase };
}
