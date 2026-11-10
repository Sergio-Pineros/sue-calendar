import type {
  Chronotype,
  DayPlan,
  DaySlice,
  DayTask,
  EnergyCheckIn,
  EnergyProfile,
  EnergyState,
  EnergyTier,
  ExternalEvent,
} from "./types";

export const ENERGY_TIERS: EnergyTier[] = ["deep", "steady", "low"];
export const ENERGY_STATES: EnergyState[] = ["sharp", "steady", "fried"];

export const TIER_LABEL: Record<EnergyTier, string> = {
  deep: "Deep work",
  steady: "Steady work",
  low: "Low drain",
};

export const STATE_LABEL: Record<EnergyState, string> = {
  sharp: "Sharp",
  steady: "Steady",
  fried: "Fried",
};

const STATE_TIER: Record<EnergyState, EnergyTier> = {
  sharp: "deep",
  steady: "steady",
  fried: "low",
};

const TIER_RANK: Record<EnergyTier, number> = { deep: 2, steady: 1, low: 0 };

const TIER_PREFERENCE: Record<EnergyState, EnergyTier[]> = {
  sharp: ["deep", "steady", "low"],
  steady: ["steady", "low", "deep"],
  fried: ["low", "steady", "deep"],
};

const SLICE_PREFERENCE: Record<EnergyTier, EnergyState[]> = {
  deep: ["sharp", "steady", "fried"],
  steady: ["steady", "sharp", "fried"],
  low: ["fried", "steady", "sharp"],
};

const CHECK_IN_TTL_MINUTES = 240;
const DEFAULT_TASK_MINUTES = 30;
export const MINUTES_IN_DAY = 1_440;

export function emptyDayPlan(): DayPlan {
  return { slices: [], tasks: [], checkIn: null };
}

export function defaultEnergyProfile(): EnergyProfile {
  return {
    saved: false,
    chronotype: null,
    ...CHRONOTYPE_PRESETS["third-bird"],
  };
}

export const CHRONOTYPE_PRESETS: Record<
  Chronotype,
  Omit<EnergyProfile, "saved" | "chronotype">
> = {
  lark: {
    dayStart: 6 * 60,
    dayEnd: 21 * 60 + 30,
    peakStart: 7 * 60 + 30,
    peakEnd: 11 * 60,
    dipStart: 13 * 60,
    dipEnd: 15 * 60,
    secondWindStart: 16 * 60,
    secondWindEnd: 18 * 60,
  },
  "third-bird": {
    dayStart: 7 * 60,
    dayEnd: 22 * 60,
    peakStart: 9 * 60,
    peakEnd: 12 * 60,
    dipStart: 13 * 60 + 30,
    dipEnd: 15 * 60 + 30,
    secondWindStart: 16 * 60 + 30,
    secondWindEnd: 18 * 60 + 30,
  },
  owl: {
    dayStart: 8 * 60 + 30,
    dayEnd: 24 * 60,
    peakStart: 11 * 60,
    peakEnd: 14 * 60,
    dipStart: 15 * 60,
    dipEnd: 17 * 60,
    secondWindStart: 20 * 60,
    secondWindEnd: 23 * 60,
  },
};

export const CHRONOTYPE_LABEL: Record<Chronotype, string> = {
  lark: "Early",
  "third-bird": "Middle",
  owl: "Late",
};

function isMinute(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= MINUTES_IN_DAY;
}

export function normalizeEnergyProfile(raw: Partial<EnergyProfile> | undefined): EnergyProfile {
  const base = defaultEnergyProfile();
  if (!raw || typeof raw !== "object") return base;
  const pick = (key: keyof EnergyProfile, fallback: number) =>
    isMinute(raw[key]) ? (raw[key] as number) : fallback;
  const profile: EnergyProfile = {
    saved: raw.saved === true,
    chronotype:
      raw.chronotype === "lark" || raw.chronotype === "third-bird" || raw.chronotype === "owl"
        ? raw.chronotype
        : null,
    dayStart: pick("dayStart", base.dayStart),
    dayEnd: pick("dayEnd", base.dayEnd),
    peakStart: pick("peakStart", base.peakStart),
    peakEnd: pick("peakEnd", base.peakEnd),
    dipStart: pick("dipStart", base.dipStart),
    dipEnd: pick("dipEnd", base.dipEnd),
    secondWindStart: isMinute(raw.secondWindStart) ? raw.secondWindStart : null,
    secondWindEnd: isMinute(raw.secondWindEnd) ? raw.secondWindEnd : null,
  };
  if (profile.dayEnd <= profile.dayStart) {
    profile.dayStart = base.dayStart;
    profile.dayEnd = base.dayEnd;
  }
  if (profile.peakEnd <= profile.peakStart) {
    profile.peakStart = base.peakStart;
    profile.peakEnd = base.peakEnd;
  }
  if (profile.dipEnd <= profile.dipStart) {
    profile.dipStart = base.dipStart;
    profile.dipEnd = base.dipEnd;
  }
  if (
    profile.secondWindStart === null ||
    profile.secondWindEnd === null ||
    profile.secondWindEnd <= profile.secondWindStart
  ) {
    profile.secondWindStart = null;
    profile.secondWindEnd = null;
  }
  return profile;
}

export function normalizeDayPlans(raw: unknown): Record<string, DayPlan> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, DayPlan> = {};
  for (const [iso, value] of Object.entries(raw as Record<string, Partial<DayPlan>>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || !value || typeof value !== "object") continue;
    out[iso] = {
      slices: Array.isArray(value.slices)
        ? value.slices.filter((slice) => isMinute(slice?.start) && isMinute(slice?.end) && slice.end > slice.start)
        : [],
      tasks: Array.isArray(value.tasks)
        ? value.tasks.filter((task) => typeof task?.title === "string" && typeof task?.id === "string")
        : [],
      checkIn:
        value.checkIn && ENERGY_STATES.includes(value.checkIn.state) && typeof value.checkIn.at === "string"
          ? value.checkIn
          : null,
    };
  }
  return out;
}

const DEEP_WORDS = [
  "write", "draft", "strategy", "strategic", "design", "architect", "rfc", "proposal",
  "research", "solve", "decide", "decision", "think", "create", "build", "prototype",
  "essay", "pitch", "spec", "chapter", "compose", "model", "invent", "study", "learn",
];
const STEADY_WORDS = [
  "review", "edit", "reply", "respond", "email", "plan", "analy", "update", "prepare",
  "prep", "fix", "test", "refactor", "read", "revise", "notes", "meeting", "call",
  "outline", "summar", "report", "migrate", "check", "follow up", "follow-up",
];
const LOW_WORDS = [
  "schedule", "book", "file", "expense", "receipt", "invoice", "pay", "submit", "clean",
  "organi", "tidy", "inbox", "confirm", "quick", "order", "buy", "grocer", "laundry",
  "rsvp", "headcount", "renew", "upload", "backup", "back up", "sort", "print", "sign",
  "cancel", "remind", "water", "dishes", "errand", "tag", "rename", "archive",
];

function countMatches(text: string, words: string[]): number {
  let count = 0;
  for (const word of words) {
    const pattern = new RegExp(`(^|[^a-z])${word.replace(/[-\s]/g, "[-\\s]")}`);
    if (pattern.test(text)) count += 1;
  }
  return count;
}

/**
 * Provisional tier from the task wording. Deep and low words are stronger
 * signals than the generic steady verbs; ties lean toward the lighter tier.
 */
export function classifyTask(title: string): EnergyTier {
  const text = title.toLowerCase();
  const scores: Record<EnergyTier, number> = {
    deep: countMatches(text, DEEP_WORDS) * 2,
    steady: countMatches(text, STEADY_WORDS),
    low: countMatches(text, LOW_WORDS) * 2,
  };
  if (scores.deep === 0 && scores.steady === 0 && scores.low === 0) return "steady";
  let best: EnergyTier = "low";
  for (const tier of ["low", "steady", "deep"] as EnergyTier[]) {
    if (scores[tier] > scores[best]) best = tier;
  }
  return best;
}

export function minutesFromTitle(title: string): number | null {
  const match = title.toLowerCase().match(/(\d{1,3})\s*(m|min|mins|minutes|h|hr|hrs|hour|hours)\b/);
  if (!match) return null;
  const value = Number(match[1]);
  return match[2].startsWith("h") ? value * 60 : value;
}

export function formatClock(minutes: number): string {
  const total = ((Math.round(minutes) % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  const suffix = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return mins === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(mins).padStart(2, "0")} ${suffix}`;
}

export function formatRange(start: number, end: number): string {
  return `${formatClock(start)}–${formatClock(end)}`;
}

function within(minutes: number, start: number | null, end: number | null): boolean {
  return start !== null && end !== null && minutes >= start && minutes < end;
}

type WindowRead = { state: EnergyState; phrase: string };

/** Energy expected at a clock time from the saved profile, or plain time-of-day heuristics. */
export function energyAtMinutes(
  minutes: number,
  weekdayIndex: number,
  profile: EnergyProfile,
): WindowRead {
  if (profile.saved) {
    if (within(minutes, profile.peakStart, profile.peakEnd)) {
      return { state: "sharp", phrase: "inside your peak hours" };
    }
    if (within(minutes, profile.dipStart, profile.dipEnd)) {
      return { state: "fried", phrase: "in your dip window" };
    }
    if (within(minutes, profile.secondWindStart, profile.secondWindEnd)) {
      return { state: "steady", phrase: "in your second wind" };
    }
    if (minutes < profile.dayStart || minutes >= profile.dayEnd) {
      return { state: "fried", phrase: "outside your usual day" };
    }
    return { state: "steady", phrase: "between your peak and your dip" };
  }
  if (weekdayIndex === 5 && minutes >= 15 * 60) {
    return { state: "fried", phrase: "late Friday afternoon" };
  }
  if (minutes < 5 * 60 || minutes >= 21 * 60) {
    return { state: "fried", phrase: "late in the day" };
  }
  if (minutes < 12 * 60) {
    return { state: "sharp", phrase: "morning, usually a sharp stretch" };
  }
  if (minutes >= 13 * 60 + 30 && minutes < 15 * 60 + 30) {
    return { state: "steady", phrase: "the post-lunch dip" };
  }
  return { state: "steady", phrase: "a steady part of the day" };
}

function eventMinutes(stamp: string): number | null {
  const match = stamp.match(/T(\d{2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

/** Timed events on `iso` that touched the last three hours. */
export function recentMeetingCount(events: ExternalEvent[], iso: string, nowMinutes: number): number {
  return events.filter((event) => {
    if (event.allDay || !event.start.startsWith(iso)) return false;
    const start = eventMinutes(event.start);
    const end = event.end.startsWith(iso) ? eventMinutes(event.end) : MINUTES_IN_DAY;
    if (start === null || end === null) return false;
    return start < nowMinutes && end > nowMinutes - 180;
  }).length;
}

export type EnergySource = "check-in" | "profile" | "heuristic";

export type EnergyRead = {
  state: EnergyState;
  source: EnergySource;
  reason: string;
};

function lowerOne(state: EnergyState): EnergyState {
  return state === "sharp" ? "steady" : "fried";
}

function ago(minutes: number): string {
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${Math.round(minutes)} min ago`;
  const hours = Math.round(minutes / 60);
  return hours === 1 ? "an hour ago" : `${hours} hours ago`;
}

/**
 * Precedence: what you said in the last few hours, then your saved rhythm,
 * then time-of-day. Recent back-to-back meetings pull the read down one step.
 */
export function inferEnergy(input: {
  now: Date;
  iso: string;
  checkIn: EnergyCheckIn | null;
  profile: EnergyProfile;
  events: ExternalEvent[];
}): EnergyRead {
  const { now, iso, checkIn, profile, events } = input;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (checkIn) {
    const elapsed = Math.max(0, (now.getTime() - new Date(checkIn.at).getTime()) / 60_000);
    const fromFuture = new Date(checkIn.at).getTime() - now.getTime() > 120_000;
    if (!fromFuture && elapsed <= CHECK_IN_TTL_MINUTES) {
      return {
        state: checkIn.state,
        source: "check-in",
        reason: `You checked in as ${STATE_LABEL[checkIn.state]} ${ago(elapsed)}.`,
      };
    }
  }
  const window = energyAtMinutes(nowMinutes, now.getDay(), profile);
  const meetings = recentMeetingCount(events, iso, nowMinutes);
  const loaded = meetings >= 2 && window.state !== "fried";
  const state = loaded ? lowerOne(window.state) : window.state;
  const load = meetings >= 2 ? `, after ${meetings} back-to-back meetings` : "";
  return {
    state,
    source: profile.saved ? "profile" : "heuristic",
    reason: `It's ${formatClock(nowMinutes)}, ${window.phrase}${load} — reading that as ${STATE_LABEL[state]}.`,
  };
}

export function starterStep(task: DayTask): string {
  const text = task.title.toLowerCase();
  if (/(write|draft|memo|essay|proposal|rfc|spec|chapter|post)/.test(text)) {
    return "Open a blank page and write the rough first paragraph. Ten minutes, then decide.";
  }
  if (/(review|pr\b|edit|read|revise)/.test(text)) {
    return "Read only the first section and note three questions. Fifteen minutes.";
  }
  if (/(deck|slides|presentation|prep|prepare)/.test(text)) {
    return "Outline the first three slides as bullets. Fifteen minutes.";
  }
  if (/(plan|strategy|design|decide|decision)/.test(text)) {
    return "List the three decisions this needs, nothing more. Ten minutes.";
  }
  return "Set a 15-minute timer and do only the first visible step.";
}

export type Recommendation = {
  doNow: { task: DayTask; why: string; starter: string | null } | null;
  quickWin: DayTask | null;
  later: { tier: EnergyTier; when: string; tasks: DayTask[] }[];
  coldStart: boolean;
  allDone: boolean;
};

function dueFirst(tasks: DayTask[]): DayTask[] {
  return tasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => Number(b.task.dueToday) - Number(a.task.dueToday) || a.index - b.index)
    .map((item) => item.task);
}

function whyFor(state: EnergyState, tier: EnergyTier): string {
  if (STATE_TIER[state] === tier) {
    if (tier === "deep") return "Your head is sharp. Spend it on the hardest thing.";
    if (tier === "steady") return "Steady energy suits structured work like this.";
    return "Low drain fits this stretch: momentum without strain.";
  }
  if (state === "sharp") return "Nothing deep on the plate, so take the most demanding one left.";
  if (tier === "low") return "A light one keeps you moving while energy is middling.";
  if (tier === "steady") return "Nothing light is left. This one is steady, so start small.";
  return "Only deep work is left. Take a short first pass and stop there if it drags.";
}

export function laterWindow(input: {
  tier: EnergyTier;
  slices: DaySlice[];
  sliceEnergy: (slice: DaySlice) => EnergyState;
  nowMinutes: number;
  profile: EnergyProfile;
}): string {
  const { tier, slices, sliceEnergy, nowMinutes, profile } = input;
  const next = slices.find(
    (slice) => slice.start >= nowMinutes && STATE_TIER[sliceEnergy(slice)] === tier,
  );
  if (next) return `the ${formatRange(next.start, next.end)} slice`;
  if (tier === "deep") {
    const peak = formatRange(profile.peakStart, profile.peakEnd);
    return nowMinutes < profile.peakStart ? `your ${peak} peak today` : `tomorrow's ${peak} peak`;
  }
  if (tier === "steady") return "after a short break";
  return "your next dip, or the end of the day";
}

export function recommend(input: {
  tasks: DayTask[];
  energy: EnergyState;
  slices: DaySlice[];
  sliceEnergy: (slice: DaySlice) => EnergyState;
  nowMinutes: number;
  profile: EnergyProfile;
}): Recommendation {
  const { tasks, energy, slices, sliceEnergy, nowMinutes, profile } = input;
  const open = dueFirst(tasks.filter((task) => !task.done));
  if (open.length === 0) {
    return { doNow: null, quickWin: null, later: [], coldStart: tasks.length === 0, allDone: tasks.length > 0 };
  }

  const match = STATE_TIER[energy];
  let doNow: Recommendation["doNow"] = null;
  const urgent = open
    .filter((task) => task.dueToday && task.tier !== "low" && TIER_RANK[task.tier] > TIER_RANK[match])
    .sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]);
  if (urgent.length > 0) {
    doNow = {
      task: urgent[0],
      why: `Due today, so it goes first even on a ${STATE_LABEL[energy].toLowerCase()} stretch. Just get it started.`,
      starter: starterStep(urgent[0]),
    };
  } else {
    for (const tier of TIER_PREFERENCE[energy]) {
      const pick = open.find((task) => task.tier === tier);
      if (!pick) continue;
      const stretch = TIER_RANK[tier] > TIER_RANK[match];
      doNow = { task: pick, why: whyFor(energy, tier), starter: stretch ? starterStep(pick) : null };
      break;
    }
  }

  const rest = open.filter((task) => task.id !== doNow?.task.id);
  const quickWin =
    rest.find((task) => task.tier === "low" && (task.minutes === null || task.minutes <= 15)) ?? null;
  const remaining = rest.filter((task) => task.id !== quickWin?.id);
  const later = ENERGY_TIERS.map((tier) => ({
    tier,
    when: laterWindow({ tier, slices, sliceEnergy, nowMinutes, profile }),
    tasks: remaining.filter((task) => task.tier === tier),
  })).filter((group) => group.tasks.length > 0);

  return { doNow, quickWin, later, coldStart: false, allDone: false };
}

export function sliceKey(start: number, end: number): string {
  return `s-${start}-${end}`;
}

function roundQuarter(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export function splitEvenly(start: number, end: number, count: number): DaySlice[] {
  const n = Math.max(1, Math.min(12, Math.floor(count)));
  const edges = [start];
  for (let i = 1; i < n; i += 1) edges.push(roundQuarter(start + ((end - start) * i) / n));
  edges.push(end);
  const slices: DaySlice[] = [];
  for (let i = 0; i < edges.length - 1; i += 1) {
    if (edges[i + 1] > edges[i]) slices.push({ id: sliceKey(edges[i], edges[i + 1]), start: edges[i], end: edges[i + 1] });
  }
  return slices;
}

/** Slices whose edges follow your rhythm: before peak, peak, settle, dip, after. */
export function slicesByEnergy(profile: EnergyProfile): DaySlice[] {
  const raw = [
    profile.dayStart,
    profile.peakStart,
    profile.peakEnd,
    profile.dipStart,
    profile.dipEnd,
    profile.secondWindStart,
    profile.secondWindEnd,
    profile.dayEnd,
  ].filter((value): value is number => value !== null && value > profile.dayStart && value < profile.dayEnd);
  const merged = [profile.dayStart];
  for (const edge of [...new Set(raw)].sort((a, b) => a - b)) {
    if (edge - merged[merged.length - 1] >= 30 && profile.dayEnd - edge >= 30) merged.push(edge);
  }
  merged.push(profile.dayEnd);
  const slices: DaySlice[] = [];
  for (let i = 0; i < merged.length - 1; i += 1) {
    slices.push({ id: sliceKey(merged[i], merged[i + 1]), start: merged[i], end: merged[i + 1] });
  }
  return slices;
}

export function splitSlice(slices: DaySlice[], id: string): DaySlice[] {
  return slices.flatMap((slice) => {
    if (slice.id !== id || slice.end - slice.start < 30) return [slice];
    const mid = roundQuarter((slice.start + slice.end) / 2);
    if (mid <= slice.start || mid >= slice.end) return [slice];
    return [
      { id: sliceKey(slice.start, mid), start: slice.start, end: mid },
      { id: sliceKey(mid, slice.end), start: mid, end: slice.end },
    ];
  });
}

export function joinWithNext(slices: DaySlice[], id: string): DaySlice[] {
  const index = slices.findIndex((slice) => slice.id === id);
  if (index < 0 || index === slices.length - 1) return slices;
  const a = slices[index];
  const b = slices[index + 1];
  const joined = { id: sliceKey(a.start, b.end), start: a.start, end: b.end };
  return [...slices.slice(0, index), joined, ...slices.slice(index + 2)];
}

/** Keeps tasks attached when their slice is split or joined. */
export function reattachTasks(tasks: DayTask[], before: DaySlice[], after: DaySlice[]): DayTask[] {
  return tasks.map((task) => {
    if (!task.sliceId || after.some((slice) => slice.id === task.sliceId)) return task;
    const old = before.find((slice) => slice.id === task.sliceId);
    const home = old ? after.find((slice) => slice.start <= old.start && slice.end > old.start) : undefined;
    return { ...task, sliceId: home?.id ?? null };
  });
}

export function sliceAt(slices: DaySlice[], minutes: number): DaySlice | null {
  return slices.find((slice) => minutes >= slice.start && minutes < slice.end) ?? null;
}

/**
 * Places open tasks into slices whose expected energy fits their tier:
 * due-today first, deep before steady before light, earliest slice that still has room.
 */
export function fitTasksToSlices(input: {
  tasks: DayTask[];
  slices: DaySlice[];
  sliceEnergy: (slice: DaySlice) => EnergyState;
  fromMinutes: number | null;
}): DayTask[] {
  const { tasks, slices, sliceEnergy, fromMinutes } = input;
  const from = fromMinutes ?? 0;
  const eligible = slices.filter((slice) => slice.end > from);
  if (eligible.length === 0) return tasks;
  const room = new Map(eligible.map((slice) => [slice.id, slice.end - Math.max(slice.start, from)]));
  const order = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => !task.done)
    .sort(
      (a, b) =>
        Number(b.task.dueToday) - Number(a.task.dueToday) ||
        TIER_RANK[b.task.tier] - TIER_RANK[a.task.tier] ||
        a.index - b.index,
    );
  const placed = new Map<string, string>();
  for (const { task } of order) {
    const need = task.minutes ?? DEFAULT_TASK_MINUTES;
    let chosen: DaySlice | undefined;
    for (const state of SLICE_PREFERENCE[task.tier]) {
      chosen = eligible.find(
        (slice) => sliceEnergy(slice) === state && (room.get(slice.id) ?? 0) >= need,
      );
      if (chosen) break;
    }
    chosen ??= [...eligible].sort((a, b) => (room.get(b.id) ?? 0) - (room.get(a.id) ?? 0))[0];
    room.set(chosen.id, (room.get(chosen.id) ?? 0) - need);
    placed.set(task.id, chosen.id);
  }
  return tasks.map((task) => (placed.has(task.id) ? { ...task, sliceId: placed.get(task.id)! } : task));
}

export const TASK_MINUTE_STEPS: (number | null)[] = [null, 5, 15, 30, 60, 90];

export function nextMinutes(current: number | null): number | null {
  const index = TASK_MINUTE_STEPS.indexOf(current);
  return TASK_MINUTE_STEPS[(index + 1) % TASK_MINUTE_STEPS.length];
}

export function nextTier(current: EnergyTier): EnergyTier {
  return ENERGY_TIERS[(ENERGY_TIERS.indexOf(current) + 1) % ENERGY_TIERS.length];
}

export function formatMinutes(minutes: number | null): string {
  if (minutes === null) return "Time?";
  if (minutes < 60) return `${minutes} min`;
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${(minutes / 60).toFixed(1)} h`;
}
