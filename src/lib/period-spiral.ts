/**
 * Rolling 28-day spiral. Today is the outermost section and its middle sits
 * at 12 o'clock; each later day sits one section further clockwise and inward.
 * One full turn is one week, so the same weekday lines up on every ring.
 * Today's band is thicker, and the extra grows outward. Days 0–26 are band
 * sections; day 27 (the farthest) is the center disc.
 */
export const SPIRAL_WINDOW_DAYS = 28;
export const SPIRAL_SEGMENTS = SPIRAL_WINDOW_DAYS - 1;
export const DAYS_PER_TURN = 7;
export const SPIRAL_CENTER = 400;
export const SPIRAL_DAY_TURN = 360 / DAYS_PER_TURN;

const VIEW_MARGIN = 8;
const TODAY_STROKE = 1.8;
const MAX_TODAY_RADIUS = SPIRAL_CENTER - VIEW_MARGIN - TODAY_STROKE / 2;
const BASE_OUTER_RADIUS = 394;
const BASE_OUTER_WIDTH = 72;
const BASE_INNER_WIDTH = 54;
const BASE_RING_GAP = 10;
const BASE_HUB_RADIUS = 50;
const BASE_SEGMENT_GAP = 7;
const BASE_CORNER = 10;
const TODAY_WIDTH_RATIO = 1.35;
const TODAY_LABEL_SCALE = 1.25;
const WIDTH_SPAN_TURNS = 4;
const EDGE_STEPS = 18;

/**
 * The whole spiral shrinks by one factor so today's thicker band still
 * leaves VIEW_MARGIN inside the 800 view box. Gap, corners and the center
 * disc shrink with it, which keeps the ring clearance.
 */
const SPIRAL_SCALE =
  MAX_TODAY_RADIUS / (BASE_OUTER_RADIUS + (TODAY_WIDTH_RATIO - 1) * BASE_OUTER_WIDTH);

const OUTER_RADIUS = BASE_OUTER_RADIUS * SPIRAL_SCALE;
const OUTER_WIDTH = BASE_OUTER_WIDTH * SPIRAL_SCALE;
const INNER_WIDTH = BASE_INNER_WIDTH * SPIRAL_SCALE;
const RING_GAP = BASE_RING_GAP * SPIRAL_SCALE;
const SEGMENT_GAP = BASE_SEGMENT_GAP * SPIRAL_SCALE;
const CORNER = BASE_CORNER * SPIRAL_SCALE;
export const SPIRAL_HUB_RADIUS = BASE_HUB_RADIUS * SPIRAL_SCALE;

const TODAY_TURNS = 1 / DAYS_PER_TURN;
const TODAY_EXTRA = OUTER_WIDTH * (TODAY_WIDTH_RATIO - 1);

function structuralBandWidth(turns: number): number {
  return OUTER_WIDTH + ((INNER_WIDTH - OUTER_WIDTH) * turns) / WIDTH_SPAN_TURNS;
}

function structuralOuterRadius(turns: number): number {
  return (
    OUTER_RADIUS -
    (OUTER_WIDTH + RING_GAP) * turns -
    ((INNER_WIDTH - OUTER_WIDTH) * turns * turns) / (2 * WIDTH_SPAN_TURNS)
  );
}

/** Today's band is thicker. The extra is only on its outer edge. */
function todayBulge(turns: number): number {
  return turns < TODAY_TURNS ? TODAY_EXTRA : 0;
}

export function bandWidth(turns: number): number {
  return structuralBandWidth(turns) + todayBulge(turns);
}

/** Outer edge radius after `turns` revolutions; the inner edge is this minus bandWidth. */
export function outerRadius(turns: number): number {
  return structuralOuterRadius(turns) + todayBulge(turns);
}

export function innerRadius(turns: number): number {
  return outerRadius(turns) - bandWidth(turns);
}

/** Half a section back, so the middle of every section lines up and today is centered at 12 o'clock. */
function screenAngle(turns: number): number {
  return -Math.PI / 2 + (turns - 0.5 / DAYS_PER_TURN) * Math.PI * 2;
}

export function spiralPoint(turns: number, radius: number): [number, number] {
  const angle = screenAngle(turns);
  return [SPIRAL_CENTER + Math.cos(angle) * radius, SPIRAL_CENTER + Math.sin(angle) * radius];
}

function fmt([x, y]: [number, number]): string {
  return `${x.toFixed(2)} ${y.toFixed(2)}`;
}

function turnsForLength(length: number, radius: number): number {
  return length / (Math.PI * 2 * Math.max(radius, 1));
}

/** Rounded band section between two spiral positions (in turns). */
export function bandPath(fromTurns: number, toTurns: number): string {
  const midRadius = (r: number) => outerRadius(r) - bandWidth(r) / 2;
  const a = fromTurns + turnsForLength(SEGMENT_GAP / 2, midRadius(fromTurns));
  const b = toTurns - turnsForLength(SEGMENT_GAP / 2, midRadius(toTurns));
  if (b <= a) return "";
  const corner = Math.min(CORNER, bandWidth(a) / 3, (b - a) * Math.PI * innerRadius(b));
  const outerA = a + turnsForLength(corner, outerRadius(a));
  const outerB = b - turnsForLength(corner, outerRadius(b));
  const innerA = a + turnsForLength(corner, innerRadius(a));
  const innerB = b - turnsForLength(corner, innerRadius(b));

  const parts: string[] = [`M${fmt(spiralPoint(outerA, outerRadius(outerA)))}`];
  for (let i = 1; i <= EDGE_STEPS; i += 1) {
    const t = outerA + ((outerB - outerA) * i) / EDGE_STEPS;
    parts.push(`L${fmt(spiralPoint(t, outerRadius(t)))}`);
  }
  parts.push(`Q${fmt(spiralPoint(b, outerRadius(b)))} ${fmt(spiralPoint(b, outerRadius(b) - corner))}`);
  parts.push(`L${fmt(spiralPoint(b, innerRadius(b) + corner))}`);
  parts.push(`Q${fmt(spiralPoint(b, innerRadius(b)))} ${fmt(spiralPoint(innerB, innerRadius(innerB)))}`);
  for (let i = 1; i <= EDGE_STEPS; i += 1) {
    const t = innerB - ((innerB - innerA) * i) / EDGE_STEPS;
    parts.push(`L${fmt(spiralPoint(t, innerRadius(t)))}`);
  }
  parts.push(`Q${fmt(spiralPoint(a, innerRadius(a)))} ${fmt(spiralPoint(a, innerRadius(a) + corner))}`);
  parts.push(`L${fmt(spiralPoint(a, outerRadius(a) - corner))}`);
  parts.push(`Q${fmt(spiralPoint(a, outerRadius(a)))} ${fmt(spiralPoint(outerA, outerRadius(outerA)))}`);
  parts.push("Z");
  return parts.join(" ");
}

export type SpiralSegment = {
  offset: number;
  fromTurns: number;
  toTurns: number;
  ring: number;
  width: number;
  path: string;
  labelX: number;
  labelY: number;
  labelSize: number;
  edge: { x1: number; y1: number; x2: number; y2: number };
};

let cached: SpiralSegment[] | null = null;

export function spiralSegments(): SpiralSegment[] {
  if (cached) return cached;
  cached = Array.from({ length: SPIRAL_SEGMENTS }, (_, offset) => {
    const fromTurns = offset / DAYS_PER_TURN;
    const toTurns = (offset + 1) / DAYS_PER_TURN;
    const mid = (fromTurns + toTurns) / 2;
    const width = bandWidth(mid);
    const labelSize = structuralBandWidth(mid) * 0.44 * (offset === 0 ? TODAY_LABEL_SCALE : 1);
    const [labelX, labelY] = spiralPoint(mid, outerRadius(mid) - width / 2);
    const [x1, y1] = spiralPoint(fromTurns, innerRadius(fromTurns) + 6);
    const [x2, y2] = spiralPoint(fromTurns, outerRadius(fromTurns) - 6);
    return {
      offset,
      fromTurns,
      toTurns,
      ring: Math.floor(offset / DAYS_PER_TURN),
      width,
      path: bandPath(fromTurns, toTurns),
      labelX,
      labelY,
      labelSize,
      edge: { x1, y1, x2, y2 },
    };
  });
  return cached;
}

/** Elapsed part of today's section, ending in a rounded edge at the current time. */
export function todayLightPath(progress: number): string {
  const p = Math.min(1, Math.max(0, progress));
  if (p < 0.03) return "";
  return bandPath(0, p / DAYS_PER_TURN);
}

/** Time marker on the outer rim, so it never sits on the day number. */
export function todayNowPoint(progress: number): [number, number] {
  const p = Math.min(1, Math.max(0, progress));
  const turns = p / DAYS_PER_TURN;
  return spiralPoint(turns, outerRadius(turns) - 8);
}

export function dayLightProgress(secondsSinceMidnight: number): number {
  return Math.min(1, Math.max(0, secondsSinceMidnight / 86_400));
}

/** Today stays bright until early evening, then quietly hands over to tomorrow. */
export function todayOpacity(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return 1 - 0.4 * Math.max(0, (p - 0.75) / 0.25);
}

/** Days further out are quieter, so the eye lands on the outside first. */
export function aheadOpacity(offset: number): number {
  const t = Math.min(1, Math.max(0, offset / (SPIRAL_WINDOW_DAYS - 1)));
  return 1 - t * 0.38;
}
