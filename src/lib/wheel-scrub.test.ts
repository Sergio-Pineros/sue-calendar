import {
  clamp,
  doyFromProgress,
  lerpAt,
  offsetFromDoy,
  pathOffset,
  periodIndexFromDoy,
  periodStartDayOfYear,
  positionAt,
  progressFromDoy,
  ringAngles,
  scrollFor,
  snapProgressToNearestDay,
} from "./wheel-scrub";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runWheelScrubTests(): void {
  assert(clamp(3, 0, 2) === 2, "clamp high");
  assert(clamp(-1, 0, 2) === 0, "clamp low");
  assert(ringAngles(1)[0] === 0, "single name sits at top");
  assert(ringAngles(0).length === 0, "empty ring");
  const thirteen = ringAngles(13);
  assert(thirteen.length === 13, "13 names");
  assert(Math.abs(thirteen[6]) < 0.001, "middle name is at the top");
  assert(thirteen[0] < 0 && thirteen[12] > 0, "names fan left to right");
  assert(Math.abs(pathOffset(0) - 25) < 0.01, "top of the ring is 25% on a 9-o'clock path");
  assert(positionAt(0, 13) === 0, "progress 0 is first period");
  assert(positionAt(1, 13) === 12, "progress 1 is last period");
  assert(lerpAt([0, 10], 0.5) === 5, "lerp midpoint");
  assert(scrollFor(0, 13, 0, 1200) === 0, "first slide scroll");
  assert(scrollFor(12, 13, 0, 1200) === 1200, "last slide scroll");

  assert(periodStartDayOfYear(2026, 1) === 1, "P1 starts on doy 1");
  assert(periodStartDayOfYear(2026, 2) === 29, "P2 starts on doy 29");
  assert(periodStartDayOfYear(2024, 7) === 170, "leap P7 starts after Leap Day");
  assert(periodStartDayOfYear(2026, 7) === 169, "common P7 starts on doy 169");

  assert(periodIndexFromDoy(1, 2026) === 0, "doy 1 is period I");
  assert(periodIndexFromDoy(29, 2026) === 1, "doy 29 is period II");
  assert(periodIndexFromDoy(170, 2024) === 6, "2024-06-18 is period VII");

  const mid = progressFromDoy(29, 2026);
  assert(doyFromProgress(mid, 2026) === 29, "progress round-trips a period start");
  assert(snapProgressToNearestDay(0.001, 2026) === 0, "near the start snaps to day 1");

  const dim = 365;
  assert(offsetFromDoy(1, 1, dim) === 0, "today at doy 1 has no offset");
  assert(offsetFromDoy(2, 1, dim) < 0, "later day needs a negative offset");

  console.log("wheel-scrub: all checks passed");
}

runWheelScrubTests();
