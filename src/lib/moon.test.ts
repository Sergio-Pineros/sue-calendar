import {
  SYNODIC_MONTH,
  isMoonLit,
  moonAge,
  moonForDate,
  moonLitPath,
  moonPhaseModel,
} from "./moon";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runMoonTests(): void {
  const newMoon = moonPhaseModel(0);
  assert(newMoon.shape === "new", "age 0 is new");
  assert(newMoon.illumination < 0.02, "new moon is dark");
  assert(moonLitPath(50, 0) === "", "new moon has no lit path");
  assert(!isMoonLit(0, 0, 50, 0), "disc centre is unlit at new");

  const first = moonPhaseModel(SYNODIC_MONTH / 4);
  assert(first.shape === "quarter", "first quarter shape");
  assert(first.waxing && first.light === "right", "first quarter lights the right");
  assert(Math.abs(first.illumination - 0.5) < 0.02, "first quarter is half lit");
  assert(isMoonLit(20, 0, 50, SYNODIC_MONTH / 4), "right of disc is lit at first quarter");
  assert(!isMoonLit(-20, 0, 50, SYNODIC_MONTH / 4), "left of disc is dark at first quarter");
  assert(moonLitPath(50, SYNODIC_MONTH / 4).includes("A 50 50 0 0 1"), "waxing outer arc sweeps right");

  const full = moonPhaseModel(SYNODIC_MONTH / 2);
  assert(full.shape === "full", "half synodic is full");
  assert(full.illumination > 0.98, "full moon is bright");
  assert(isMoonLit(0, 0, 50, SYNODIC_MONTH / 2), "disc centre is lit at full");
  assert(moonLitPath(50, SYNODIC_MONTH / 2).includes("A 50 50 0 1 1"), "full moon is a closed disc");

  const last = moonPhaseModel((3 * SYNODIC_MONTH) / 4);
  assert(last.shape === "quarter", "last quarter shape");
  assert(!last.waxing && last.light === "left", "last quarter lights the left");
  assert(isMoonLit(-20, 0, 50, (3 * SYNODIC_MONTH) / 4), "left of disc is lit at last quarter");
  assert(!isMoonLit(20, 0, 50, (3 * SYNODIC_MONTH) / 4), "right of disc is dark at last quarter");
  assert(moonLitPath(50, (3 * SYNODIC_MONTH) / 4).includes("A 50 50 0 0 0"), "waning outer arc sweeps left");

  const waxingCrescent = moonPhaseModel(3);
  assert(waxingCrescent.shape === "crescent", "day 3 is a crescent");
  assert(waxingCrescent.waxing && waxingCrescent.light === "right", "waxing crescent is right-lit");
  assert(waxingCrescent.illumination < 0.35, "waxing crescent is a sliver");
  assert(isMoonLit(48, 0, 50, 3), "far right limb is lit on a waxing crescent");
  assert(!isMoonLit(0, 0, 50, 3), "centre stays dark on a waxing crescent");
  assert(!isMoonLit(-10, 0, 50, 3), "left stays dark on a waxing crescent");
  assert(moonLitPath(50, 3).length > 0, "crescent has a lit path");

  const waningCrescent = moonPhaseModel(SYNODIC_MONTH - 3);
  assert(waningCrescent.shape === "crescent", "three days before new is a crescent");
  assert(!waningCrescent.waxing && waningCrescent.light === "left", "waning crescent is left-lit");
  assert(isMoonLit(-48, 0, 50, SYNODIC_MONTH - 3), "far left limb is lit on a waning crescent");
  assert(!isMoonLit(0, 0, 50, SYNODIC_MONTH - 3), "centre stays dark on a waning crescent");
  assert(!isMoonLit(10, 0, 50, SYNODIC_MONTH - 3), "right stays dark on a waning crescent");

  const waxingGibbous = moonPhaseModel(11);
  assert(waxingGibbous.shape === "gibbous" && waxingGibbous.waxing, "day 11 is waxing gibbous");
  assert(waxingGibbous.illumination > 0.6, "gibbous is more than half");

  const waningGibbous = moonPhaseModel(18);
  assert(waningGibbous.shape === "gibbous" && !waningGibbous.waxing, "day 18 is waning gibbous");

  const named = moonForDate("2000-01-07");
  assert(typeof named.age === "number", "moonForDate returns an age");
  const modelFromDate = moonPhaseModel(moonAge("2000-01-07"));
  assert(
    Math.abs(modelFromDate.illumination * 100 - named.illumination) < 1.5,
    "date illumination matches the spherical model",
  );

  console.log("moon: all checks passed");
}

runMoonTests();
