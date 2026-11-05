import {
  applySprintOverride,
  buildSprint,
  cycleSprintIntensity,
  intensityFromMoon,
  planSprintDays,
  recommendRange,
  sprintCounts,
  sprintIntensityOn,
} from "./sprints";
import { moonForDate } from "./moon";
import { gregorianToSue } from "./sue-calendar";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runSprintTests(): void {
  assert(intensityFromMoon("new") === "light", "new moon is plan/light");
  assert(intensityFromMoon("waxing-crescent") === "push", "waxing is push");
  assert(intensityFromMoon("first-quarter") === "push", "first quarter is push");
  assert(intensityFromMoon("waxing-gibbous") === "push", "gibbous waxing is push");
  assert(intensityFromMoon("full") === "push", "full is peak/push");
  assert(intensityFromMoon("waning-gibbous") === "light", "early waning is light");
  assert(intensityFromMoon("last-quarter") === "rest", "last quarter is rest");
  assert(intensityFromMoon("waning-crescent") === "rest", "late waning is rest");

  const period = recommendRange("period", "2026-01-10");
  assert(period.startDate === "2026-01-01", "period sprint starts on P1 D1");
  assert(period.endDate === "2026-01-28", "period sprint ends on P1 D28");

  const days = planSprintDays("2026-01-01", "2026-01-28");
  assert(days.length === 28, "period plan is 28 days");
  const last = days[27];
  assert(last.recommended === "rest", "day 28 is rest");
  const yearDay = planSprintDays("2026-12-31", "2026-12-31")[0];
  assert(yearDay.recommended === "rest", "Year Day is rest");

  const leap = planSprintDays("2024-06-17", "2024-06-17")[0];
  assert(leap.recommended === "rest", "Leap Day is rest");

  const built = buildSprint({
    title: "Launch my book",
    style: "period",
    startDate: "2026-02-03",
  });
  assert(built.title === "Launch my book", "title kept");
  assert(built.startDate === "2026-01-29", "snaps to period 2 start");
  assert(built.days.length === 28, "built period length");

  const custom = recommendRange("custom", "2026-03-01", { lengthDays: 10 });
  assert(custom.endDate === "2026-03-10", "custom length is inclusive");
  const deadline = recommendRange("custom", "2026-03-01", {
    deadline: "2026-03-05",
  });
  assert(deadline.endDate === "2026-03-05", "deadline wins for custom");

  const seasonal = recommendRange("seasonal", "2026-07-01");
  assert(seasonal.startDate === "2026-06-21", "summer sprint starts at June solstice");
  assert(seasonal.endDate === "2026-09-21", "summer sprint ends the day before September equinox");

  const lunar = recommendRange("lunar-full", "2026-01-15");
  assert(lunar.startDate <= "2026-01-15" && lunar.endDate >= "2026-01-15", "full lunar covers the seed date");
  assert(moonForDate(lunar.startDate).name === "new", "full lunar starts near a new moon");

  const waxing = recommendRange("lunar-waxing", "2026-01-15");
  assert(moonForDate(waxing.startDate).name === "new", "waxing starts at new");
  assert(moonForDate(waxing.endDate).name === "full", "waxing ends at full");

  const sprint = {
    id: "s1",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...built,
  };
  const overridden = applySprintOverride(sprint, sprint.days[0].date, "rest");
  assert(
    sprintIntensityOn(overridden, sprint.days[0].date) === "rest",
    "manual override wins",
  );
  const cleared = applySprintOverride(overridden, sprint.days[0].date, undefined);
  assert(
    sprintIntensityOn(cleared, sprint.days[0].date) === sprint.days[0].recommended,
    "clearing override restores recommendation",
  );
  const counts = sprintCounts(sprint);
  assert(counts.push + counts.light + counts.rest === 28, "counts cover every day");
  const seed = { date: "2026-01-01", recommended: "push" as const, note: "" };
  assert(cycleSprintIntensity(seed) === "light", "push cycles to light");
  assert(cycleSprintIntensity({ ...seed, override: "light" }) === "rest", "light cycles to rest");
  assert(cycleSprintIntensity({ ...seed, override: "rest" }) === undefined, "rest returns to recommendation");

  const mapped = gregorianToSue("2026-01-28");
  assert(mapped.sueDayInPeriod === 28, "fixture is last day of period");
  console.log("sprints: all checks passed");
}

runSprintTests();
