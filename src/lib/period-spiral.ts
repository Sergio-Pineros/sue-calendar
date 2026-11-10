import { clamp } from "./wheel-scrub";

export const PERIOD_SPIRAL_DAYS = 28;

export type PeriodSpiralPoint = {
  day: number;
  relative: number;
  radius: number;
  angle: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

export type PeriodSpiralOptions = {
  cx?: number;
  cy?: number;
  radialStep?: number;
  angleStep?: number;
  maxRadius?: number;
};

const DEFAULT_CENTER = 400;
const DEFAULT_RADIAL_STEP = 11.5;
const DEFAULT_ANGLE_STEP = 0.5;
const DEFAULT_MAX_RADIUS = 310;

/**
 * A signed day distance keeps the current day at the center:
 * past days wind into the center from the left, and upcoming days wind out.
 */
export function periodSpiralPoint(
  day: number,
  currentDay: number,
  options: PeriodSpiralOptions = {},
): PeriodSpiralPoint {
  const safeDay = clamp(Math.round(day), 1, PERIOD_SPIRAL_DAYS);
  const safeCurrent = clamp(Math.round(currentDay), 1, PERIOD_SPIRAL_DAYS);
  const relative = safeDay - safeCurrent;
  const distance = Math.abs(relative);
  const radialStep = options.radialStep ?? DEFAULT_RADIAL_STEP;
  const maxRadius = options.maxRadius ?? DEFAULT_MAX_RADIUS;
  const radius = Math.min(maxRadius, distance * radialStep);
  const angle =
    -Math.PI / 2 + relative * (options.angleStep ?? DEFAULT_ANGLE_STEP);
  const cx = options.cx ?? DEFAULT_CENTER;
  const cy = options.cy ?? DEFAULT_CENTER;
  const scale =
    distance === 0 ? 1 : 0.72 + (distance / (PERIOD_SPIRAL_DAYS - 1)) * 0.28;
  const opacity =
    distance === 0
      ? 1
      : relative < 0
        ? Math.max(0.12, 0.7 - distance * 0.02)
        : 0.42 + (distance / (PERIOD_SPIRAL_DAYS - 1)) * 0.42;

  return {
    day: safeDay,
    relative,
    radius,
    angle,
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
    scale,
    opacity,
  };
}

export function periodSpiralPoints(
  currentDay: number,
  options: PeriodSpiralOptions = {},
): PeriodSpiralPoint[] {
  return Array.from({ length: PERIOD_SPIRAL_DAYS }, (_, index) =>
    periodSpiralPoint(index + 1, currentDay, options),
  );
}

export function dayLightProgress(secondsSinceMidnight: number): number {
  return clamp(secondsSinceMidnight / 86_400, 0, 1);
}

export type SpiralGlow = {
  x: number;
  y: number;
  opacity: number;
  scale: number;
};

/**
 * The center light completes one quiet circuit per local day, then fades
 * leftward during the final quarter so the day change has somewhere to go.
 */
export function periodSpiralGlow(progress: number): SpiralGlow {
  const safeProgress = clamp(progress, 0, 1);
  const tail = clamp((safeProgress - 0.72) / 0.28, 0, 1);
  const angle = -Math.PI / 2 + safeProgress * Math.PI * 2;
  return {
    x: Math.cos(angle) * 30 - tail * 18,
    y: Math.sin(angle) * 30,
    opacity: 0.62 * (1 - tail),
    scale: 1 + safeProgress * 0.12,
  };
}
