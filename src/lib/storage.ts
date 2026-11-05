import type {
  ExternalEvent,
  Goal,
  Habit,
  LayerKey,
  NamingSystem,
  PersonalCycle,
  Reflection,
  RestBlock,
  Sprint,
  SueSettings,
  SueState,
  ThemeId,
  WeekdayNamePreset,
  WeekdayNumberPreset,
} from "./types";
import {
  emptyPeriodColorOverrides,
  isPeriodColorPreset,
  normalizePeriodColorOverrides,
} from "./period-colors";
import { addDays, sueToGregorian, todayISO } from "./sue-calendar";
import { copy } from "./copy";
import { EMPTY_CUSTOM_NAMES, migrateNaming } from "./naming";
import {
  SERGIO_WEEKDAY_NUMBERS,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
  clampWeekStart,
} from "./weekdays";
import { isThemeId } from "./themes";
import { normalizeFavorites } from "./frequency";

const STORAGE_KEY = "sue:v1";
export const APPLE_STORAGE_KEY = "sue:apple";

export const DEFAULT_LAYERS: Record<LayerKey, boolean> = {
  events: true,
  goals: true,
  habits: true,
  rest: true,
  moon: true,
  seasons: true,
  personal: false,
  sabbats: false,
  sprints: true,
};

export function defaultSettings(): SueSettings {
  return {
    naming: "roman",
    customPeriodNames: [...EMPTY_CUSTOM_NAMES],
    weekStart: 0,
    weekdayNamePreset: "long",
    weekdayNames: [...WEEKDAY_LONG],
    weekdayShortNames: [...WEEKDAY_SHORT],
    weekdayNumberPreset: "sergio",
    weekdayNumbers: [...SERGIO_WEEKDAY_NUMBERS],
    theme: "ancient-amethyst",
    periodColorPreset: "amethyst",
    periodColorOverrides: emptyPeriodColorOverrides(),
    timezone:
      typeof Intl !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : "UTC",
    layers: { ...DEFAULT_LAYERS },
    onboarded: false,
    viewYear: new Date().getFullYear(),
    selectedCalendarIds: [],
    appleCalendarIds: [],
    lastSyncedAt: null,
    frequencyFavorites: [],
  };
}

function uid(): string {
  return crypto.randomUUID();
}

export function demoEvents(year: number): ExternalEvent[] {
  const samples: [number, number, string, string, boolean][] = [
    [2, 4, "Project review", "work", false],
    [3, 11, "Walk", "personal", true],
    [5, 2, "Delivery", "work", false],
    [7, 8, "Scheduled rest", "rest", true],
    [9, 15, "Client call", "work", false],
    [11, 6, "Family dinner", "family", false],
    [13, 20, "Year close", "personal", true],
  ];
  const mappedSamples = samples.map(([period, day, title, cal, allDay], i) => {
    const start = sueToGregorian(year, period, day);
    return eventFromDemo(year, i, start, title, cal, allDay);
  });

  const today = todayISO();
  const todayYear = Number(today.slice(0, 4));
  if (todayYear !== year) return mappedSamples;

  const aroundToday: ExternalEvent[] = [
    eventFromDemo(year, 90, today, "Morning focus", "work", false),
    eventFromDemo(year, 91, addDays(today, 2), "Walk", "personal", true),
  ];
  return [...mappedSamples, ...aroundToday];
}

function eventFromDemo(
  year: number,
  index: number,
  start: string,
  title: string,
  cal: string,
  allDay: boolean,
): ExternalEvent {
  return {
    id: `demo-${year}-${index}`,
    source: "demo",
    sourceEventId: `demo-${index}`,
    calendarId: cal,
    calendarName:
      cal === "work"
        ? "Work"
        : cal === "family"
          ? "Family"
          : cal === "rest"
            ? "Rest"
            : "Personal",
    title,
    description: "Sample event so the overlay is visible. Replace it by importing a .ics or connecting a calendar.",
    start: allDay ? start : `${start}T10:00:00`,
    end: allDay ? addDays(start, 1) : `${start}T11:00:00`,
    timezone: "local",
    allDay,
    location: "",
    color:
      cal === "work" ? "var(--brass)" : cal === "rest" ? "var(--rest)" : "var(--lunar)",
  };
}

export function emptyState(): SueState {
  const year = new Date().getFullYear();
  return {
    settings: defaultSettings(),
    goals: [],
    habits: [],
    events: demoEvents(year),
    restBlocks: [],
    personalCycles: [],
    reflections: [],
    sprints: [],
  };
}

export function normalizeSettings(raw: Partial<SueSettings> | undefined): SueSettings {
  const base = defaultSettings();
  if (!raw) return base;
  const naming = migrateNaming(raw.naming as NamingSystem | undefined);
  const theme: ThemeId = isThemeId(raw.theme) ? raw.theme : base.theme;
  const weekdayNamePreset: WeekdayNamePreset =
    raw.weekdayNamePreset === "short" || raw.weekdayNamePreset === "custom"
      ? raw.weekdayNamePreset
      : "long";
  const weekdayNumberPreset: WeekdayNumberPreset =
    raw.weekdayNumberPreset === "one" ||
    raw.weekdayNumberPreset === "custom" ||
    raw.weekdayNumberPreset === "none"
      ? raw.weekdayNumberPreset
      : "sergio";
  return {
    ...base,
    ...raw,
    naming,
    theme,
    customPeriodNames:
      raw.customPeriodNames?.length === 13
        ? raw.customPeriodNames
        : base.customPeriodNames,
    weekStart: clampWeekStart(raw.weekStart ?? base.weekStart),
    weekdayNamePreset,
    weekdayNames:
      raw.weekdayNames?.length === 7 ? raw.weekdayNames : base.weekdayNames,
    weekdayShortNames:
      raw.weekdayShortNames?.length === 7
        ? raw.weekdayShortNames
        : base.weekdayShortNames,
    weekdayNumberPreset,
    weekdayNumbers:
      raw.weekdayNumbers?.length === 7
        ? raw.weekdayNumbers
        : base.weekdayNumbers,
    periodColorPreset: isPeriodColorPreset(raw.periodColorPreset)
      ? raw.periodColorPreset
      : base.periodColorPreset,
    periodColorOverrides: normalizePeriodColorOverrides(raw.periodColorOverrides),
    layers: { ...base.layers, ...raw.layers },
    appleCalendarIds: raw.appleCalendarIds ?? [],
    frequencyFavorites: normalizeFavorites(raw.frequencyFavorites),
  };
}

export const normalizeSettingsForTest = normalizeSettings;

export function loadState(): SueState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as SueState;
    return {
      ...emptyState(),
      ...parsed,
      settings: normalizeSettings(parsed.settings),
      sprints: parsed.sprints ?? [],
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: SueState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export type AppleCredentials = {
  appleId: string;
  appPassword: string;
};

export function loadAppleCredentials(): AppleCredentials | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(APPLE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppleCredentials;
    if (!parsed.appleId || !parsed.appPassword) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAppleCredentials(creds: AppleCredentials | null): void {
  if (typeof window === "undefined") return;
  if (!creds) {
    localStorage.removeItem(APPLE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(APPLE_STORAGE_KEY, JSON.stringify(creds));
}

export function parseBackup(raw: string): SueState {
  const parsed = JSON.parse(raw) as Partial<SueState>;
  if (!parsed || typeof parsed !== "object") {
    throw new Error(copy.settings.notBackup);
  }
  return {
    ...emptyState(),
    ...parsed,
    settings: normalizeSettings(parsed.settings),
    goals: parsed.goals ?? [],
    habits: parsed.habits ?? [],
    events: parsed.events ?? [],
    restBlocks: parsed.restBlocks ?? [],
    personalCycles: parsed.personalCycles ?? [],
    reflections: parsed.reflections ?? [],
    sprints: parsed.sprints ?? [],
  };
}

export function newGoal(partial: Partial<Goal> & { title: string; sueYear: number; suePeriod: number }): Goal {
  const start = sueToGregorian(partial.sueYear, partial.suePeriod, 1);
  const end = sueToGregorian(partial.sueYear, partial.suePeriod, 28);
  return {
    id: uid(),
    areaOfLife: "life",
    gregorianStart: start,
    gregorianEnd: end,
    status: "active",
    linkedHabitIds: [],
    ...partial,
  };
}

export function newHabit(title: string): Habit {
  return {
    id: uid(),
    title,
    cadence: "daily",
    startDate: todayISO(),
    preferredCycle: "period",
    checkIns: {},
    restOnSpecialDays: true,
  };
}

export function newRest(date: string, note = "Rest"): RestBlock {
  return { id: uid(), date, note };
}

export function newCycle(name: string): PersonalCycle {
  return {
    id: uid(),
    name,
    startDate: todayISO(),
    length: 28,
    phases: [
      { name: "start", days: 7 },
      { name: "middle", days: 14 },
      { name: "close", days: 7 },
    ],
    notes: "",
    visibility: "private",
  };
}

export function newReflection(
  scope: Reflection["scope"],
  sueYear: number,
  suePeriod: number | null,
  sueWeek: number | null,
): Reflection {
  return {
    id: uid(),
    scope,
    sueYear,
    suePeriod,
    sueWeek,
    answers: { repeated: "", moved: "", rest: "", carry: "", data: "" },
    createdAt: new Date().toISOString(),
  };
}

export function newSprint(partial: Omit<Sprint, "id" | "createdAt">): Sprint {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function newLocalEvent(partial: {
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  description?: string;
}): ExternalEvent {
  const id = uid();
  return {
    id: `local-${id}`,
    source: "local",
    sourceEventId: id,
    calendarId: "local",
    calendarName: copy.day.local,
    title: partial.title,
    description: partial.description ?? "",
    start: partial.start,
    end: partial.end,
    timezone: "local",
    allDay: partial.allDay,
    location: "",
    color: "var(--brass)",
  };
}

export function eventDateKey(event: ExternalEvent): string {
  return event.start.slice(0, 10);
}

export { eventsOnDate } from "./planning";

export function namingLabel(naming: NamingSystem): string {
  if (naming === "ifc") return "IFC names";
  if (naming === "numbered") return "Numbered periods";
  if (naming === "comte") return "Positivist names";
  if (naming === "celtic") return "Celtic Tree names";
  if (naming === "folk") return "Folk moon names";
  if (naming === "custom") return "Custom names";
  return "Roman numerals";
}
