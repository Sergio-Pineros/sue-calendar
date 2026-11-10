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
  innerRadius?: number;
  radialStep?: number;
  angleStep?: number;
  maxRadius?: number;
};

const DEFAULT_CENTER = 400;
const DEFAULT_INNER_RADIUS = 116;
const DEFAULT_ANGLE_STEP = 0.5;
const DEFAULT_MAX_RADIUS = 360;

/**
 * A signed day distance keeps the current day at the center:
 * past days wind into the center from the left, and upcoming days wind out.
 * The first visible position leaves a quiet gap around the hub; the remaining
 * radial pitch adapts to the current day so the farthest period day fills the
 * available spiral instead of collapsing on short half-periods.
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
  const innerRadius = options.innerRadius ?? DEFAULT_INNER_RADIUS;
  const maxRadius = options.maxRadius ?? DEFAULT_MAX_RADIUS;
  const maxDistance = Math.max(safeCurrent - 1, PERIOD_SPIRAL_DAYS - safeCurrent);
  const radialStep =
    options.radialStep ??
    (maxDistance > 1
      ? (maxRadius - innerRadius) / (maxDistance - 1)
      : maxRadius - innerRadius);
  const radius =
    distance === 0
      ? 0
      : Math.min(maxRadius, innerRadius + (distance - 1) * Math.max(0, radialStep));
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
        ? 0.24 + (distance / Math.max(maxDistance, 1)) * 0.38
        : 0.42 + (distance / Math.max(maxDistance, 1)) * 0.44;

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
