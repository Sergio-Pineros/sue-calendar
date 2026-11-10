import {
  CHRONOTYPE_PRESETS,
  classifyTask,
  defaultEnergyProfile,
  energyAtMinutes,
  fitTasksToSlices,
  formatClock,
  inferEnergy,
  joinWithNext,
  minutesFromTitle,
  normalizeDayPlans,
  normalizeEnergyProfile,
  reattachTasks,
  recommend,
  sliceAt,
  slicesByEnergy,
  splitEvenly,
  splitSlice,
} from "./energy";
import type { DaySlice, DayTask, EnergyProfile, EnergyState, ExternalEvent } from "./types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function task(id: string, title: string, extra: Partial<DayTask> = {}): DayTask {
  return {
    id,
    title,
    tier: classifyTask(title),
    tierConfirmed: false,
    minutes: minutesFromTitle(title),
    dueToday: false,
    sliceId: null,
    done: false,
    ...extra,
  };
}

function meeting(iso: string, start: string, end: string): ExternalEvent {
  return {
    id: `${iso}-${start}`,
    source: "local",
    sourceEventId: start,
    calendarId: "work",
    calendarName: "Work",
    title: "Meeting",
    description: "",
    start: `${iso}T${start}:00`,
    end: `${iso}T${end}:00`,
    timezone: "local",
    allDay: false,
    location: "",
    color: "",
  };
}

assert(classifyTask("Write the board strategy memo") === "deep", "writing strategy is deep work");
assert(classifyTask("Review teammate's PR") === "steady", "reviewing is steady work");
assert(classifyTask("Submit travel expenses") === "low", "expenses are low drain");
assert(classifyTask("Reply to the venue coordinator about lunch headcount") === "low", "a headcount reply is low drain");
assert(classifyTask("Draft Q3 plan") === "deep", "drafting a plan stays deep");
assert(classifyTask("Something vague") === "steady", "unknown wording defaults to steady");
assert(minutesFromTitle("Inbox sweep 10 min") === 10, "minutes are read from the title");
assert(minutesFromTitle("Deep block 2h") === 120, "hours are read from the title");
assert(formatClock(14 * 60 + 15) === "2:15 PM" && formatClock(9 * 60) === "9 AM", "clock reads like a person");

const heuristic = defaultEnergyProfile();
assert(!heuristic.saved, "no profile is saved until you save one");
assert(energyAtMinutes(9 * 60, 2, heuristic).state === "sharp", "mornings read sharp");
assert(energyAtMinutes(14 * 60 + 15, 2, heuristic).state === "steady", "post-lunch reads steady");
assert(energyAtMinutes(16 * 60, 5, heuristic).state === "fried", "late Friday reads low drain");

const saved: EnergyProfile = { ...heuristic, saved: true, ...CHRONOTYPE_PRESETS.owl, chronotype: "owl" };
assert(energyAtMinutes(8 * 60, 2, saved).state === "fried", "an owl's 8 AM is before the usual day");
assert(energyAtMinutes(12 * 60, 2, saved).state === "sharp", "a saved peak beats the morning heuristic");
assert(energyAtMinutes(16 * 60, 2, saved).state === "fried", "a saved dip reads fried");

const iso = "2026-11-10";
const at = (h: number, m: number) => new Date(2026, 10, 10, h, m);
const dip = inferEnergy({
  now: at(14, 15),
  iso,
  checkIn: null,
  profile: heuristic,
  events: [meeting(iso, "12:00", "13:00"), meeting(iso, "13:00", "14:00")],
});
assert(dip.state === "fried", "the dip plus back-to-back meetings reads fried");
assert(dip.source === "heuristic", "no profile means heuristics");
assert(dip.reason.startsWith("It's 2:15 PM") && dip.reason.includes("2 back-to-back meetings"), "the reason says how it was read");

const told = inferEnergy({
  now: at(14, 15),
  iso,
  checkIn: { state: "sharp", at: at(14, 0).toISOString() },
  profile: saved,
  events: [],
});
assert(told.state === "sharp" && told.source === "check-in", "what you said beats the profile");
const sameMinute = inferEnergy({
  now: at(14, 15),
  iso,
  checkIn: { state: "fried", at: new Date(at(14, 15).getTime() + 40_000).toISOString() },
  profile: heuristic,
  events: [],
});
assert(sameMinute.source === "check-in" && sameMinute.reason.includes("just now"), "a check-in within the current minute counts");
const stale = inferEnergy({
  now: at(19, 30),
  iso,
  checkIn: { state: "sharp", at: at(9, 0).toISOString() },
  profile: saved,
  events: [],
});
assert(stale.source === "profile", "an old check-in expires");

const none: DaySlice[] = [];
const flat = () => "steady" as EnergyState;
const base = { slices: none, sliceEnergy: flat, nowMinutes: 14 * 60 + 15, profile: heuristic };

const cold = recommend({ ...base, tasks: [], energy: "steady" });
assert(cold.coldStart && cold.doNow === null, "no tasks means ask, never invent");

const plate = [
  task("memo", "Write the board strategy memo"),
  task("pr", "Review teammate's PR"),
  task("exp", "Submit travel expenses"),
  task("reply", "Reply to the venue coordinator about lunch headcount"),
];
const fried = recommend({ ...base, tasks: plate, energy: "fried" });
assert(fried.doNow?.task.id === "exp", "fried picks a low-drain task first");
assert(fried.quickWin?.id === "reply", "a second light task becomes the quick win");
assert(fried.later.map((g) => g.tier).join() === "deep,steady", "the rest is saved by tier");
assert(fried.later[0].when.includes("peak"), "deep work waits for a peak");

const sharp = recommend({ ...base, tasks: plate, energy: "sharp" });
assert(sharp.doNow?.task.id === "memo" && sharp.doNow.starter === null, "sharp goes straight to deep work");

const due = recommend({
  ...base,
  tasks: plate.map((t) => (t.id === "memo" ? { ...t, dueToday: true } : t)),
  energy: "fried",
});
assert(due.doNow?.task.id === "memo", "a deep task due today wins even when fried");
assert(Boolean(due.doNow?.starter), "and it comes with a small starter step");

const deepOnly = recommend({ ...base, tasks: [task("memo", "Write the memo")], energy: "fried" });
assert(deepOnly.doNow?.task.id === "memo" && deepOnly.doNow.starter, "only deep left: start small");

const done = recommend({ ...base, tasks: plate.map((t) => ({ ...t, done: true })), energy: "sharp" });
assert(done.allDone && !done.coldStart, "everything done is not a cold start");

const even = splitEvenly(7 * 60, 22 * 60, 3);
assert(even.length === 3 && even[0].start === 420 && even[2].end === 1320, "three even slices cover the day");
assert(even.every((s) => s.start % 15 === 0 && s.end % 15 === 0), "slice edges land on quarter hours");
const split = splitSlice(even, even[0].id);
assert(split.length === 4 && split[0].end === split[1].start, "splitting halves one slice");
const joined = joinWithNext(split, split[0].id);
assert(joined.length === 3 && joined[0].start === 420 && joined[0].end === even[0].end, "joining restores it");

const rhythm = slicesByEnergy(heuristic);
assert(rhythm[0].start === heuristic.dayStart && rhythm[rhythm.length - 1].end === heuristic.dayEnd, "rhythm slices span the day");
assert(rhythm.some((s) => s.start === heuristic.peakStart && s.end === heuristic.peakEnd), "the peak gets its own slice");
for (let i = 1; i < rhythm.length; i += 1) assert(rhythm[i].start === rhythm[i - 1].end, "rhythm slices are contiguous");
assert(sliceAt(rhythm, 10 * 60)?.start === heuristic.peakStart, "10 AM sits in the peak slice");

const energyOf = (slice: DaySlice) => energyAtMinutes((slice.start + slice.end) / 2, 2, heuristic).state;
const fitted = fitTasksToSlices({ tasks: plate, slices: rhythm, sliceEnergy: energyOf, fromMinutes: 8 * 60 });
const memoSlice = rhythm.find((s) => s.id === fitted.find((t) => t.id === "memo")?.sliceId);
assert(memoSlice && energyOf(memoSlice) === "sharp", "deep work lands in a sharp slice");
assert(fitted.every((t) => t.sliceId !== null), "every open task gets a slice");
const late = fitTasksToSlices({ tasks: plate, slices: rhythm, sliceEnergy: energyOf, fromMinutes: 20 * 60 });
assert(late.every((t) => rhythm.find((s) => s.id === t.sliceId)!.end > 20 * 60), "no task is placed in a slice already gone");

const moved = reattachTasks(
  [{ ...plate[0], sliceId: split[1].id }],
  split,
  joined,
);
assert(moved[0].sliceId === joined[0].id, "tasks follow their slice when slices join");

assert(normalizeEnergyProfile({ peakStart: 900, peakEnd: 600 }).peakStart === heuristic.peakStart, "broken windows fall back");
const plans = normalizeDayPlans({ "2026-11-10": { tasks: [plate[0]], slices: [{ id: "x", start: 5, end: 2 }] }, nope: {} });
assert(Object.keys(plans).join() === "2026-11-10" && plans["2026-11-10"].slices.length === 0, "stored plans are cleaned");

console.log("energy: all checks passed");
