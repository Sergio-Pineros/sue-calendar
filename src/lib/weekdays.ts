import type { Weekday, WeekdayNamePreset, WeekdayNumberPreset } from "./types";

export const WEEKDAYS: Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const WEEKDAY_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const WEEKDAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/** Sergio's personal default: Sunday = -1, Monday = 0 … Saturday = 5. */
export const SERGIO_WEEKDAY_NUMBERS = [-1, 0, 1, 2, 3, 4, 5] as const;

export const ONE_BASED_WEEKDAY_NUMBERS = [1, 2, 3, 4, 5, 6, 7] as const;

export type WeekdayNamePresetMeta = {
  id: WeekdayNamePreset;
  label: string;
  origin: string;
};

export type WeekdayNumberPresetMeta = {
  id: WeekdayNumberPreset;
  label: string;
  origin: string;
  numbers: readonly number[] | null;
};

export const WEEKDAY_NAME_PRESETS: WeekdayNamePresetMeta[] = [
  {
    id: "long",
    label: "Full names",
    origin: "English weekday names: Sunday–Saturday.",
  },
  {
    id: "short",
    label: "Short names",
    origin: "Three-letter English abbreviations.",
  },
  {
    id: "custom",
    label: "Custom names",
    origin: "Type your own seven labels. Stored only on this device.",
  },
];

export const WEEKDAY_NUMBER_PRESETS: WeekdayNumberPresetMeta[] = [
  {
    id: "none",
    label: "No numbers",
    origin: "Show names only.",
    numbers: null,
  },
  {
    id: "one",
    label: "1–7",
    origin: "Sunday = 1 through Saturday = 7, matching JavaScript's weekday index + 1.",
    numbers: ONE_BASED_WEEKDAY_NUMBERS,
  },
  {
    id: "sergio",
    label: "−1…5",
    origin: "Sergio's default: Sunday = −1, Monday = 0, … Saturday = 5.",
    numbers: SERGIO_WEEKDAY_NUMBERS,
  },
  {
    id: "custom",
    label: "Custom numbers",
    origin: "Assign any number to each weekday.",
    numbers: SERGIO_WEEKDAY_NUMBERS,
  },
];

export type WeekdaySettingsInput = {
  weekStart: number;
  weekdayNamePreset: WeekdayNamePreset;
  weekdayNames: string[];
  weekdayShortNames: string[];
  weekdayNumberPreset: WeekdayNumberPreset;
  weekdayNumbers: number[];
};

export function clampWeekStart(value: unknown): number {
  const n = Number(value);
  if (!Number.isInteger(n)) return 0;
  return ((n % 7) + 7) % 7;
}

export function weekdayNamesFor(
  preset: WeekdayNamePreset,
  customNames?: string[],
  short = false,
): string[] {
  const fallback = short ? [...WEEKDAY_SHORT] : [...WEEKDAY_LONG];
  if (preset !== "custom") {
    return short || preset === "short" ? [...WEEKDAY_SHORT] : [...WEEKDAY_LONG];
  }
  const source = short ? customNames : customNames;
  return fallback.map((name, index) => {
    const next = source?.[index]?.trim();
    return next ? next : name;
  });
}

export function weekdayNumbersFor(
  preset: WeekdayNumberPreset,
  customNumbers?: number[],
): number[] | null {
  if (preset === "none") return null;
  if (preset === "one") return [...ONE_BASED_WEEKDAY_NUMBERS];
  if (preset === "sergio") return [...SERGIO_WEEKDAY_NUMBERS];
  return WEEKDAYS.map((_, index) => {
    const value = customNumbers?.[index];
    return typeof value === "number" && Number.isFinite(value) ? value : SERGIO_WEEKDAY_NUMBERS[index];
  });
}

export function weekdayLabel(
  weekdayIndex: number,
  settings: Pick<WeekdaySettingsInput, "weekdayNamePreset" | "weekdayNames">,
  short = false,
): string {
  const names = weekdayNamesFor(
    settings.weekdayNamePreset,
    short ? undefined : settings.weekdayNames,
    short,
  );
  if (short && settings.weekdayNamePreset === "custom") {
    return weekdayNamesFor("custom", settings.weekdayNames, true)[weekdayIndex] ?? WEEKDAY_SHORT[weekdayIndex];
  }
  if (short && settings.weekdayNamePreset === "custom") {
    return settings.weekdayNames[weekdayIndex]?.slice(0, 3) || WEEKDAY_SHORT[weekdayIndex];
  }
  return names[weekdayIndex] ?? WEEKDAY_LONG[weekdayIndex];
}

export function weekdayShortLabel(
  weekdayIndex: number,
  settings: Pick<
    WeekdaySettingsInput,
    "weekdayNamePreset" | "weekdayNames" | "weekdayShortNames"
  >,
): string {
  if (settings.weekdayNamePreset === "custom") {
    const custom = settings.weekdayShortNames[weekdayIndex]?.trim();
    if (custom) return custom;
    const long = settings.weekdayNames[weekdayIndex]?.trim();
    if (long) return long.slice(0, 3);
  }
  if (settings.weekdayNamePreset === "short") return WEEKDAY_SHORT[weekdayIndex];
  return WEEKDAY_SHORT[weekdayIndex];
}

export function weekdayNumber(
  weekdayIndex: number,
  settings: Pick<WeekdaySettingsInput, "weekdayNumberPreset" | "weekdayNumbers">,
): number | null {
  const numbers = weekdayNumbersFor(
    settings.weekdayNumberPreset,
    settings.weekdayNumbers,
  );
  return numbers ? numbers[weekdayIndex] : null;
}

export function orderedWeekdayIndexes(weekStart: number): number[] {
  const start = clampWeekStart(weekStart);
  return Array.from({ length: 7 }, (_, i) => (start + i) % 7);
}

export function formatWeekdayNumber(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : String(value);
}
