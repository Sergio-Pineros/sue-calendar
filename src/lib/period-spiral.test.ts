import {
  PERIOD_SPIRAL_DAYS,
  SPIRAL_CENTER,
  SPIRAL_HIT_RADIUS,
  SPIRAL_HUB_RADIUS,
  dayLightProgress,
  periodSpiralGlow,
  periodSpiralSlots,
  spiralDayOpacity,
  spiralPaths,
  spiralTurnDegrees,
} from "./period-spiral";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const slots = periodSpiralSlots();

assert(slots.length === PERIOD_SPIRAL_DAYS, "every period day has one slot");
assert(slots[0].day === 1 && slots[27].day === 28, "slots run in calendar order");
for (let i = 1; i < slots.length; i += 1) {
  assert(slots[i].radius < slots[i - 1].radius, `day ${i + 1} sits inside day ${i}`);
  assert(slots[i].theta > slots[i - 1].theta, `day ${i + 1} continues the same clockwise path`);
  assert(slots[i].size < slots[i - 1].size, `day ${i + 1} is smaller than day ${i}`);
}
assert(slots[27].theta > Math.PI * 4, "the period winds more than two full turns");

for (const slot of slots) {
  assert(
    slot.radius - SPIRAL_HIT_RADIUS > SPIRAL_HUB_RADIUS,
    `day ${slot.day} tap target clears the center disc`,
  );
}
for (let i = 0; i < slots.length; i += 1) {
  for (let j = i + 1; j < slots.length; j += 1) {
    const gap = Math.hypot(slots[i].x - slots[j].x, slots[i].y - slots[j].y);
    assert(
      gap > SPIRAL_HIT_RADIUS * 1.9,
      `days ${i + 1} and ${j + 1} keep separate tap targets`,
    );
  }
}

for (let day = 1; day <= PERIOD_SPIRAL_DAYS; day += 1) {
  const slot = slots[day - 1];
  const screen = slot.theta + (spiralTurnDegrees(day) * Math.PI) / 180;
  const x = Math.cos(screen) * slot.radius;
  const y = Math.sin(screen) * slot.radius;
  assert(Math.abs(x) < 1e-6 && y < 0, `day ${day} is parked at 12 o'clock`);
}
for (let day = 1; day < PERIOD_SPIRAL_DAYS; day += 1) {
  const step = spiralTurnDegrees(day + 1) - spiralTurnDegrees(day);
  assert(step < 0 && step > -60, `day ${day + 1} arrives with a small counter-clockwise turn`);
}
assert(spiralTurnDegrees(null) === spiralTurnDegrees(28), "special days rest after day 28");

assert(spiralDayOpacity(5, 6) < spiralDayOpacity(7, 6), "lived days are quieter than days ahead");
assert(spiralDayOpacity(1, 6) < spiralDayOpacity(5, 6), "older lived days fade further");
assert(spiralDayOpacity(7, 6) > spiralDayOpacity(28, 6), "tomorrow is the brightest day ahead");

const sixth = spiralPaths(6);
assert(sixth.traveled.startsWith("M") && sixth.ahead.startsWith("M"), "the path splits at today");
assert(spiralPaths(null).ahead === "", "special days have no days ahead in the period");
assert(SPIRAL_CENTER === 400, "the spiral is centered in its view box");

assert(dayLightProgress(0) === 0, "midnight starts the light circuit");
assert(dayLightProgress(43_200) === 0.5, "noon is halfway through the light circuit");
assert(dayLightProgress(100_000) === 1, "late values clamp at the day boundary");

const dawn = periodSpiralGlow(0);
const dusk = periodSpiralGlow(0.9);
const end = periodSpiralGlow(1);
assert(dawn.opacity > 0 && dawn.y < 0, "dawn light begins above the center");
assert(dusk.opacity < dawn.opacity && dusk.x < 0, "late light fades and drifts left");
assert(end.opacity === 0, "the center light is gone at the day boundary");

console.log("period-spiral: all checks passed");
