import {
  dayLightProgress,
  periodSpiralGlow,
  periodSpiralPoint,
  periodSpiralPoints,
} from "./period-spiral";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const current = periodSpiralPoint(28, 28);
const first = periodSpiralPoint(1, 28);
const next = periodSpiralPoint(3, 2);
const previous = periodSpiralPoint(1, 2);
const nearCenter = periodSpiralPoint(7, 6);
const farFuture = periodSpiralPoint(28, 14);
const fadingPast = periodSpiralPoint(5, 6);
const outerPast = periodSpiralPoint(1, 6);

assert(current.relative === 0 && current.radius === 0, "current day stays at the spiral center");
assert(first.relative === -27, "period day 1 is the outer past day at day 28");
assert(first.radius > next.radius && first.radius > previous.radius, "outer days sit farther out");
assert(next.relative === 1 && previous.relative === -1, "adjacent days straddle the current day");
assert(nearCenter.radius > 100, "the nearest day clears the center disc");
assert(farFuture.radius > nearCenter.radius, "the spiral fills outward across a middle period");
assert(fadingPast.opacity < outerPast.opacity, "past days fade as they approach the center");
for (let currentDay = 1; currentDay <= 28; currentDay += 1) {
  const positions = periodSpiralPoints(currentDay);
  const center = positions.find((point) => point.day === currentDay);
  const nearest = Math.min(
    ...positions
      .filter((point) => point.day !== currentDay)
      .map((point) => point.radius),
  );
  assert(center?.radius === 0 && nearest > 100, `day ${currentDay} keeps a clear hub halo`);
}
assert(
  periodSpiralPoints(2).length === 28 &&
    periodSpiralPoints(2).find((point) => point.day === 2)?.radius === 0,
  "every regular period day gets one spiral position",
);

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
