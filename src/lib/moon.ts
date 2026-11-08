import type { MoonPhaseName } from "./types";
import { parseISODate } from "./iso-date";
import { copy } from "./copy";

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

export const MOON_LABELS = copy.moon;

export function moonLabel(name: MoonPhaseName): string {
  return MOON_LABELS[name];
}

export function wrapMoonAge(age: number, period = SYNODIC_MONTH): number {
  return ((age % period) + period) % period;
}

/** Precise synodic age in days at a Gregorian noon UTC. */
export function moonAge(iso: string): number {
  const { year, month, day } = parseISODate(iso);
  const t = Date.UTC(year, month - 1, day, 12, 0, 0);
  return wrapMoonAge((t - KNOWN_NEW_MOON) / 86_400_000);
}

export function moonForDate(iso: string): {
  name: MoonPhaseName;
  age: number;
  illumination: number;
} {
  const age = moonAge(iso);
  const illumination = (1 - Math.cos((2 * Math.PI * age) / SYNODIC_MONTH)) / 2;
  const phase = [...PHASES].reverse().find((p) => age >= p.from) ?? PHASES[0];
  return {
    name: phase.name,
    age: Math.round(age * 10) / 10,
    illumination: Math.round(illumination * 100),
  };
}

export type MoonPhaseShape = "new" | "crescent" | "quarter" | "gibbous" | "full";

export function moonPhaseModel(age: number, period = SYNODIC_MONTH): {
  age: number;
  t: number;
  cosine: number;
  waxing: boolean;
  illumination: number;
  ellipseRx: number;
  light: "right" | "left";
  shape: MoonPhaseShape;
} {
  const wrapped = wrapMoonAge(age, period);
  const t = wrapped / period;
  const cosine = Math.cos(2 * Math.PI * t);
  const illumination = (1 - cosine) / 2;
  const waxing = t < 0.5;
  const shape: MoonPhaseShape =
    illumination < 0.02
      ? "new"
      : illumination > 0.98
        ? "full"
        : Math.abs(illumination - 0.5) < 0.03
          ? "quarter"
          : illumination < 0.5
            ? "crescent"
            : "gibbous";
  return {
    age: wrapped,
    t,
    cosine,
    waxing,
    illumination,
    ellipseRx: Math.abs(cosine),
    light: waxing ? "right" : "left",
    shape,
  };
}

/**
 * Northern-hemisphere view: waxing lights the right, waning the left.
 * Terminator is the projected spherical limb (ellipse of rx = r |cos phase|).
 */
export function moonLitPath(r: number, age: number, period = SYNODIC_MONTH): string {
  const model = moonPhaseModel(age, period);
  if (model.shape === "new") return "";
  if (model.shape === "full") {
    return `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0 Z`;
  }
  const rx = r * model.ellipseRx;
  const outerSweep = model.waxing ? 1 : 0;
  const termSweep = model.waxing === (model.cosine < 0) ? 1 : 0;
  return `M 0 ${-r} A ${r} ${r} 0 0 ${outerSweep} 0 ${r} A ${rx} ${r} 0 0 ${termSweep} 0 ${-r} Z`;
}

/** Front-facing point on a unit sphere is lit for this synodic age. */
export function isMoonLit(
  x: number,
  y: number,
  r: number,
  age: number,
  period = SYNODIC_MONTH,
): boolean {
  const rr = x * x + y * y;
  if (rr > r * r + 1e-9) return false;
  const z = Math.sqrt(Math.max(0, r * r - rr));
  const t = wrapMoonAge(age, period) / period;
  const alpha = 2 * Math.PI * t;
  return x * Math.sin(alpha) - z * Math.cos(alpha) > 0;
}

export function isMajorMoonPhase(name: MoonPhaseName): boolean {
  return (
    name === "new" ||
    name === "full" ||
    name === "first-quarter" ||
    name === "last-quarter"
  );
}

export const ASCII_MOON: Record<MoonPhaseName, string> = {
  new: "(   )",
  "waxing-crescent": "(  |)",
  "first-quarter": "(  |)",
  "waxing-gibbous": "( '|)",
  full: "( * )",
  "waning-gibbous": "(|' )",
  "last-quarter": "(|  )",
  "waning-crescent": "(|  )",
};
