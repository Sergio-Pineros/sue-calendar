import { daysInGregorianYear, isLeapYear } from "./iso-date";

/** Clamps into lo..hi. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/** Angle of each name on the ring, degrees clockwise from the top, centred. */
export function ringAngles(n: number, gap = 22, maxSpan = 200): number[] {
  if (n < 2) return n === 1 ? [0] : [];
  const step = Math.min(gap, maxSpan / (n - 1));
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * step);
}

/** startOffset (%) on a circle path that begins at 9 o'clock and runs clockwise. */
export function pathOffset(angle: number): number {
  return ((((angle + 90) % 360) + 360) % 360) / 3.6;
}

/** Continuous slide position (0..n-1) for a scroll progress (0-1). */
export function positionAt(progress: number, n: number): number {
  return clamp(progress, 0, 1) * Math.max(0, n - 1);
}

/** Linear blend between two neighbours of a list at a continuous position. */
export function lerpAt(values: number[], p: number): number {
  if (!values.length) return 0;
  const i = clamp(Math.floor(p), 0, values.length - 1);
  const j = Math.min(i + 1, values.length - 1);
  return values[i] + (values[j] - values[i]) * (p - i);
}

/** Scroll offset that rests on slide i. */
export function scrollFor(i: number, n: number, start: number, end: number): number {
  return n > 1 ? start + ((end - start) * i) / (n - 1) : start;
}

export function periodStartDayOfYear(year: number, period: number): number {
  const p = clamp(Math.round(period), 1, 13);
  const base = (p - 1) * 28 + 1;
  return isLeapYear(year) && p >= 7 ? base + 1 : base;
}

export function yearTravelRange(year: number): { startDoy: number; endDoy: number } {
  return {
    startDoy: periodStartDayOfYear(year, 1),
    endDoy: periodStartDayOfYear(year, 13) + 27,
  };
}

export function progressFromDoy(doy: number, year: number): number {
  const { startDoy, endDoy } = yearTravelRange(year);
  return clamp((doy - startDoy) / Math.max(1, endDoy - startDoy), 0, 1);
}

export function doyFromProgress(progress: number, year: number): number {
  const { startDoy, endDoy } = yearTravelRange(year);
  return Math.round(startDoy + clamp(progress, 0, 1) * (endDoy - startDoy));
}

export function periodIndexFromDoy(doy: number, year: number): number {
  const leap = isLeapYear(year) && doy >= 169 ? 1 : 0;
  const regular = Math.min(doy - leap, 364);
  return clamp(Math.floor((regular - 1) / 28), 0, 12);
}

export function snapProgressToNearestDay(progress: number, year: number): number {
  return progressFromDoy(doyFromProgress(progress, year), year);
}

export function offsetFromDoy(doy: number, todayDoy: number, dim: number): number {
  const degreesPerDay = 360 / dim;
  return (todayDoy - clamp(doy, 1, dim)) * degreesPerDay;
}

export function dimOf(year: number): number {
  return daysInGregorianYear(year);
}
