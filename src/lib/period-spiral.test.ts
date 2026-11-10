import {
  DAYS_PER_TURN,
  SPIRAL_CENTER,
  SPIRAL_HUB_RADIUS,
  SPIRAL_SEGMENTS,
  SPIRAL_WINDOW_DAYS,
  aheadOpacity,
  bandWidth,
  dayLightProgress,
  innerRadius,
  outerRadius,
  spiralSegments,
  todayLightPath,
  todayNowPoint,
  todayOpacity,
} from "./period-spiral";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const segments = spiralSegments();

assert(SPIRAL_WINDOW_DAYS === 28, "the spiral shows a rolling 28-day window");
assert(segments.length === SPIRAL_SEGMENTS && SPIRAL_SEGMENTS === 27, "27 sections plus the center day");
assert(segments[0].offset === 0 && segments[0].fromTurns === 0, "today is the first, outermost section");
for (let i = 1; i < segments.length; i += 1) {
  assert(segments[i].fromTurns === segments[i - 1].toTurns, `section ${i} continues the same path`);
  assert(segments[i].width <= segments[i - 1].width, `section ${i} is no thicker than the one before`);
  assert(segments[i].labelSize <= segments[i - 1].labelSize, `section ${i} label shrinks inward`);
  const r = Math.hypot(segments[i].labelX - SPIRAL_CENTER, segments[i].labelY - SPIRAL_CENTER);
  const rPrev = Math.hypot(segments[i - 1].labelX - SPIRAL_CENTER, segments[i - 1].labelY - SPIRAL_CENTER);
  assert(r < rPrev, `section ${i} sits closer to the center than section ${i - 1}`);
  assert(segments[i].path.startsWith("M") && segments[i].path.endsWith("Z"), `section ${i} is a closed shape`);
}
assert(
  Math.abs(segments[0].labelX - SPIRAL_CENTER) < 1 && segments[0].labelY < SPIRAL_CENTER,
  "today's number sits on the vertical center, above the hub",
);
assert(segments[0].toTurns - segments[0].fromTurns === 1 / DAYS_PER_TURN, "today keeps a one-seventh arc");
assert(segments[0].width > segments[1].width * 1.25, "today's band is thicker than the next section");
assert(
  segments[0].labelSize > segments[1].labelSize * 1.2 && segments[0].labelSize < segments[1].labelSize * 1.35,
  "today's number is about a quarter larger than the next",
);

for (let offset = 0; offset < SPIRAL_SEGMENTS; offset += 1) {
  assert(segments[offset].ring === Math.floor(offset / DAYS_PER_TURN), `day ${offset} is on week ring ${Math.floor(offset / 7)}`);
}
const angle = (s: (typeof segments)[number]) =>
  Math.atan2(s.labelY - SPIRAL_CENTER, s.labelX - SPIRAL_CENTER);
assert(Math.abs(angle(segments[0]) - angle(segments[7])) < 1e-9, "the same weekday lines up a week later");

for (let t = 0; t + 1 <= SPIRAL_SEGMENTS / DAYS_PER_TURN; t += 0.01) {
  const gap = innerRadius(t) - outerRadius(t + 1);
  assert(gap > 4, `rings never touch (turn ${t.toFixed(2)}, gap ${gap.toFixed(1)})`);
}
const end = SPIRAL_SEGMENTS / DAYS_PER_TURN;
assert(innerRadius(end) - SPIRAL_HUB_RADIUS > 4, "the last section clears the center day");
assert(SPIRAL_CENTER - (outerRadius(0) + 0.9) >= 8 - 1e-6, "today's outer edge keeps 8px inside the view box");
assert(bandWidth(0) > bandWidth(end), "the band narrows toward the center");

assert(todayLightPath(0) === "", "no light before the day has started");
assert(todayLightPath(0.5).startsWith("M"), "light fills the elapsed part of today");
const pointAngle = ([x, y]: [number, number]) => Math.atan2(y - SPIRAL_CENTER, x - SPIRAL_CENTER);
const noon = todayNowPoint(0.5);
const startAngle = pointAngle(todayNowPoint(0));
const endAngle = pointAngle(todayNowPoint(1));
assert(Math.abs(noon[0] - SPIRAL_CENTER) < 1 && noon[1] < SPIRAL_CENTER, "noon sits at 12 o'clock on today");
assert(
  Math.abs(Math.abs(startAngle + Math.PI / 2) - Math.abs(endAngle + Math.PI / 2)) < 1e-6,
  "today extends the same angle left and right of 12 o'clock",
);
assert(todayOpacity(0.5) === 1 && todayOpacity(1) < todayOpacity(0.8), "today fades only late in the day");
assert(aheadOpacity(1) > aheadOpacity(20), "far days are quieter than tomorrow");

assert(dayLightProgress(0) === 0, "midnight starts the day");
assert(dayLightProgress(43_200) === 0.5, "noon is halfway");
assert(dayLightProgress(100_000) === 1, "late values clamp at the day boundary");

console.log("period-spiral: all checks passed");
