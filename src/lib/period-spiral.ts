import { clamp } from "./wheel-scrub";

export const PERIOD_SPIRAL_DAYS = 28;
export const SPIRAL_CENTER = 400;
export const SPIRAL_HUB_RADIUS = 82;
export const SPIRAL_HIT_RADIUS = 48;

const OUTER_RADIUS = 368;
const INNER_RADIUS = 152;
const TURNS = 2.3;
const SWEEP = TURNS * Math.PI * 2;
const RADIUS_PER_RADIAN = (OUTER_RADIUS - INNER_RADIUS) / SWEEP;
const TAIL_RADIUS = 98;
const TAIL_SWEEP = (INNER_RADIUS - TAIL_RADIUS) / RADIUS_PER_RADIAN;

export type SpiralSlot = {
  day: number;
  theta: number;
  radius: number;
  x: number;
  y: number;
  size: number;
};

function radiusAt(theta: number): number {
  return OUTER_RADIUS - RADIUS_PER_RADIAN * theta;
}

function pointAt(theta: number) {
  const radius = radiusAt(theta);
  return {
    x: SPIRAL_CENTER + Math.cos(theta) * radius,
    y: SPIRAL_CENTER + Math.sin(theta) * radius,
  };
}

/**
 * One Archimedean spiral for the whole period: day 1 rides the outer edge and
 * the days wind clockwise toward day 28 beside the hub. Slots sit at equal arc
 * length so the outer days do not drift apart while the inner ones crowd.
 */
function buildSlots(): SpiralSlot[] {
  const steps = 2_400;
  const h = SWEEP / steps;
  const thetas = [0];
  const lengths = [0];
  let length = 0;
  for (let i = 1; i <= steps; i += 1) {
    const mid = (i - 0.5) * h;
    length += Math.hypot(radiusAt(mid), RADIUS_PER_RADIAN) * h;
    thetas.push(i * h);
    lengths.push(length);
  }

  let cursor = 0;
  return Array.from({ length: PERIOD_SPIRAL_DAYS }, (_, index) => {
    const target = (length * index) / (PERIOD_SPIRAL_DAYS - 1);
    while (cursor < steps && lengths[cursor + 1] < target) cursor += 1;
    const span = lengths[Math.min(cursor + 1, steps)] - lengths[cursor] || 1;
    const theta =
      index === PERIOD_SPIRAL_DAYS - 1
        ? SWEEP
        : thetas[cursor] + ((target - lengths[cursor]) / span) * h;
    const radius = radiusAt(theta);
    const t = (radius - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS);
    return {
      day: index + 1,
      theta,
      radius,
      ...pointAt(theta),
      size: 24 + t * 22,
    };
  });
}

const SLOTS = buildSlots();

export function periodSpiralSlots(): SpiralSlot[] {
  return SLOTS;
}

function safeDay(day: number | null): number {
  return day === null ? PERIOD_SPIRAL_DAYS : clamp(Math.round(day), 1, PERIOD_SPIRAL_DAYS);
}

/** Rotation that parks the given day's slot at 12 o'clock. */
export function spiralTurnDegrees(currentDay: number | null): number {
  return -90 - (SLOTS[safeDay(currentDay) - 1].theta * 180) / Math.PI;
}

export function spiralPath(from: number, to: number): string {
  if (to <= from) return "";
  const steps = Math.max(2, Math.ceil(((to - from) / SWEEP) * 220));
  const parts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const { x, y } = pointAt(from + ((to - from) * i) / steps);
    parts.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return parts.join(" ");
}

export function spiralPaths(currentDay: number | null) {
  const nowTheta =
    currentDay === null ? SWEEP : SLOTS[safeDay(currentDay) - 1].theta;
  return {
    traveled: spiralPath(0, nowTheta),
    ahead: spiralPath(nowTheta, SWEEP),
    tail: spiralPath(SWEEP, SWEEP + TAIL_SWEEP),
  };
}

/** Lived days fade the further back they are; the days ahead stay readable. */
export function spiralDayOpacity(day: number, currentDay: number | null): number {
  if (currentDay === null) return 0.42;
  const today = safeDay(currentDay);
  if (day < today) return 0.22 + (day / today) * 0.2;
  const ahead = day - today;
  return 0.94 - (ahead / (PERIOD_SPIRAL_DAYS - 1)) * 0.3;
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
