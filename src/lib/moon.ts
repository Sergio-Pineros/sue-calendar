import type { MoonPhaseName } from "./types";
import { parseISODate } from "./iso-date";

/** Mean synodic month in days. Source: USNO / astronomical convention. */
export const SYNODIC_MONTH = 29.530588853;

/** Known new moon near J2000, used as a calculation epoch. */
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

const PHASES: { name: MoonPhaseName; from: number }[] = [
  { name: "new", from: 0 },
  { name: "waxing-crescent", from: 1.8455 },
  { name: "first-quarter", from: 7.3826 },
  { name: "waxing-gibbous", from: 9.2282 },
  { name: "full", from: 13.7653 },
  { name: "waning-gibbous", from: 16.4564 },
  { name: "last-quarter", from: 21.9935 },
  { name: "waning-crescent", from: 24.6846 },
];

export const MOON_LABELS_ES: Record<MoonPhaseName, string> = {
  new: "Luna nueva",
  "waxing-crescent": "Creciente",
  "first-quarter": "Cuarto creciente",
  "waxing-gibbous": "Gibosa creciente",
  full: "Luna llena",
  "waning-gibbous": "Gibosa menguante",
  "last-quarter": "Cuarto menguante",
  "waning-crescent": "Menguante",
};

export function moonForDate(iso: string): {
  name: MoonPhaseName;
  age: number;
  illumination: number;
} {
  const { year, month, day } = parseISODate(iso);
  const t = Date.UTC(year, month - 1, day, 12, 0, 0);
  const diffDays = (t - KNOWN_NEW_MOON) / 86_400_000;
  const age = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
  const phase = [...PHASES].reverse().find((p) => age >= p.from) ?? PHASES[0];
  return {
    name: phase.name,
    age: Math.round(age * 10) / 10,
    illumination: Math.round(illumination * 100),
  };
}

export function isMajorMoonPhase(name: MoonPhaseName): boolean {
  return (
    name === "new" ||
    name === "full" ||
    name === "first-quarter" ||
    name === "last-quarter"
  );
}
