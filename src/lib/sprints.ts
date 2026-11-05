import { addDays, daysInGregorianYear, gregorianDayOfYear, parseISODate } from "./iso-date";
import { moonForDate, SYNODIC_MONTH } from "./moon";
import { seasonForDate } from "./seasons";
import { gregorianToSue, sueToGregorian, yearDayISO } from "./sue-calendar";
import type {
  MoonPhaseName,
  Sprint,
  SprintDay,
  SprintIntensity,
  SprintStyle,
} from "./types";

export const SPRINT_STYLES: {
  id: SprintStyle;
  label: string;
  origin: string;
}[] = [
  {
    id: "lunar-full",
    label: "Full Lunar Sprint",
    origin: "New moon to new moon — about one synodic month.",
  },
  {
    id: "lunar-waxing",
    label: "Half-Moon Sprint (waxing)",
    origin: "New moon to full moon. Build and push.",
  },
  {
    id: "lunar-waning",
    label: "Half-Moon Sprint (waning)",
    origin: "Full moon to new moon. Finish, clean up, rest.",
  },
  {
    id: "period",
    label: "Period Sprint",
    origin: "One 28-day SÚE period. Four weeks, one focus.",
  },
  {
    id: "seasonal",
    label: "Seasonal Sprint",
    origin: "Solstice or equinox to the next marker. A quarter of the solar year.",
  },
  {
    id: "custom",
    label: "Custom",
    origin: "You pick the start and a deadline or length.",
  },
];

const MAJOR_NEW: MoonPhaseName[] = ["new"];
const WAXING: MoonPhaseName[] = [
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
];
const WANING_FINISH: MoonPhaseName[] = ["waning-gibbous"];
const WANING_REST: MoonPhaseName[] = ["last-quarter", "waning-crescent"];

export function intensityFromMoon(phase: MoonPhaseName): SprintIntensity {
  if (MAJOR_NEW.includes(phase)) return "light";
  if (WAXING.includes(phase)) return "push";
  if (phase === "full") return "push";
  if (WANING_FINISH.includes(phase)) return "light";
  if (WANING_REST.includes(phase)) return "rest";
  return "light";
}

export function intensityNote(phase: MoonPhaseName, intensity: SprintIntensity): string {
  if (phase === "new") return "New moon — plan and set intention.";
  if (WAXING.includes(phase)) return "Waxing moon — build and push.";
  if (phase === "full") return "Full moon — peak, review, or ship.";
  if (phase === "waning-gibbous") return "Waning moon — finish and tidy.";
  if (WANING_REST.includes(phase)) return "Late waning moon — rest and close.";
  return intensity === "rest" ? "Rest day." : intensity === "push" ? "Push day." : "Light day.";
}

function eachDate(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor <= end && guard < 400) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
    guard += 1;
  }
  return dates;
}

function phaseScore(iso: string, target: "new" | "full"): number {
  const age = moonForDate(iso).age;
  if (target === "new") return Math.min(age, SYNODIC_MONTH - age);
  return Math.abs(age - SYNODIC_MONTH / 2);
}

function nearestPhase(
  from: string,
  target: "new" | "full",
  direction: "forward" | "back" = "forward",
  limit = 40,
): string {
  let cursor = from;
  let best = from;
  let bestScore = phaseScore(from, target);
  for (let i = 0; i < limit; i += 1) {
    const moon = moonForDate(cursor);
    if (moon.name === target) return cursor;
    const score = phaseScore(cursor, target);
    if (score < bestScore) {
      best = cursor;
      bestScore = score;
    }
    cursor = addDays(cursor, direction === "forward" ? 1 : -1);
  }
  return best;
}

export function recommendRange(
  style: SprintStyle,
  startDate: string,
  options: {
    lengthDays?: number;
    deadline?: string | null;
    year?: number;
    period?: number | null;
  } = {},
): { startDate: string; endDate: string } {
  if (style === "lunar-full") {
    const start = nearestPhase(startDate, "new", "back", 32);
    const next = nearestPhase(addDays(start, 3), "new", "forward", 36);
    return { startDate: start, endDate: next };
  }
  if (style === "lunar-waxing") {
    const start = nearestPhase(startDate, "new", "back", 32);
    const end = nearestPhase(addDays(start, 2), "full", "forward", 22);
    return { startDate: start, endDate: end };
  }
  if (style === "lunar-waning") {
    const start = nearestPhase(startDate, "full", "back", 32);
    const end = nearestPhase(addDays(start, 2), "new", "forward", 22);
    return { startDate: start, endDate: end };
  }
  if (style === "period") {
    const mapped = gregorianToSue(startDate);
    const year = options.year ?? mapped.sueYear;
    const period = options.period ?? mapped.suePeriod ?? 1;
    return {
      startDate: sueToGregorian(year, period, 1),
      endDate: sueToGregorian(year, period, 28),
    };
  }
  if (style === "seasonal") {
    const { year } = parseISODate(startDate);
    const markers = [
      `${year}-03-20`,
      `${year}-06-21`,
      `${year}-09-22`,
      `${year}-12-21`,
      `${year + 1}-03-20`,
    ];
    const start = [...markers].reverse().find((iso) => iso <= startDate) ?? `${year - 1}-12-21`;
    const end =
      markers.find((iso) => iso > start) ?? `${year + 1}-03-20`;
    return { startDate: start, endDate: addDays(end, -1) };
  }

  if (options.deadline && options.deadline >= startDate) {
    return { startDate, endDate: options.deadline };
  }
  const length = Math.max(1, Math.min(120, options.lengthDays ?? 28));
  return { startDate, endDate: addDays(startDate, length - 1) };
}

export function planSprintDays(startDate: string, endDate: string): SprintDay[] {
  return eachDate(startDate, endDate).map((date) => {
    const mapped = gregorianToSue(date);
    const moon = moonForDate(date);
    let recommended = intensityFromMoon(moon.name);
    if (mapped.isSpecialDay) recommended = "rest";
    if (mapped.sueDayInPeriod === 28) recommended = "rest";
    return {
      date,
      recommended,
      note: mapped.isSpecialDay
        ? mapped.isYearDay
          ? "Year Day — outside the 13 periods. Rest and review."
          : "Leap Day — outside the 13 periods. Rest."
        : intensityNote(moon.name, recommended),
    };
  });
}

export function buildSprint(input: {
  title: string;
  style: SprintStyle;
  startDate: string;
  lengthDays?: number;
  deadline?: string | null;
  year?: number;
  period?: number | null;
}): Omit<Sprint, "id" | "createdAt"> {
  const range = recommendRange(input.style, input.startDate, {
    lengthDays: input.lengthDays,
    deadline: input.deadline,
    year: input.year,
    period: input.period,
  });
  return {
    title: input.title,
    style: input.style,
    startDate: range.startDate,
    endDate: range.endDate,
    deadline: input.deadline ?? null,
    days: planSprintDays(range.startDate, range.endDate),
  };
}

export function applySprintOverride(
  sprint: Sprint,
  date: string,
  override: SprintIntensity | undefined,
): Sprint {
  return {
    ...sprint,
    days: sprint.days.map((day) =>
      day.date === date ? { ...day, override } : day,
    ),
  };
}

export function sprintIntensityOn(sprint: Sprint, date: string): SprintIntensity | null {
  const day = sprint.days.find((item) => item.date === date);
  if (!day) return null;
  return day.override ?? day.recommended;
}

export function activeSprintsOn(sprints: Sprint[], date: string): Sprint[] {
  return sprints.filter((sprint) => date >= sprint.startDate && date <= sprint.endDate);
}

export function sprintCounts(sprint: Sprint): Record<SprintIntensity, number> {
  const counts: Record<SprintIntensity, number> = { push: 0, light: 0, rest: 0 };
  for (const day of sprint.days) {
    counts[day.override ?? day.recommended] += 1;
  }
  return counts;
}

export function synodicHint(): string {
  return `A real synodic month is about ${SYNODIC_MONTH.toFixed(2)} days, not 28. Sprint days are a rhythm, not a forecast.`;
}

export function yearProgress(iso: string): number {
  const { year, month, day } = parseISODate(iso);
  return gregorianDayOfYear(year, month, day) / daysInGregorianYear(year);
}

export function seasonProgressLabel(iso: string): string {
  return seasonForDate(iso).season;
}

export function defaultSprintTitle(style: SprintStyle, startDate: string): string {
  if (style === "period") {
    const mapped = gregorianToSue(startDate);
    return mapped.suePeriod
      ? `Period ${mapped.suePeriod} sprint`
      : "Period sprint";
  }
  if (style === "seasonal") {
    return `${seasonForDate(startDate).season} sprint`;
  }
  if (style === "lunar-full") return "Full lunar sprint";
  if (style === "lunar-waxing") return "Waxing sprint";
  if (style === "lunar-waning") return "Waning sprint";
  return "Custom sprint";
}

export function yearDayAsRest(year: number): string {
  return yearDayISO(year);
}
