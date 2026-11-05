import type { NamingContext, NamingSystem } from "./types";

export const ROMAN_PERIOD_NAMES = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
] as const;

export const NUMBERED_PERIOD_NAMES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
] as const;

export const IFC_PERIOD_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "Sol",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Auguste Comte, Positivist Calendar, 1849. */
export const COMTE_PERIOD_NAMES = [
  "Moses",
  "Homer",
  "Aristotle",
  "Archimedes",
  "Caesar",
  "St. Paul",
  "Charlemagne",
  "Dante",
  "Gutenberg",
  "Shakespeare",
  "Descartes",
  "Frederick",
  "Bichat",
] as const;

/** Robert Graves, The White Goddess, 1948 — a modern poetic tree-month scheme. */
export const CELTIC_PERIOD_NAMES = [
  "Birch",
  "Rowan",
  "Ash",
  "Alder",
  "Willow",
  "Hawthorn",
  "Oak",
  "Holly",
  "Hazel",
  "Vine",
  "Ivy",
  "Reed",
  "Elder",
] as const;

/** Traditional North American / European folk full-moon names, plus Blue Moon as the 13th. */
export const FOLK_PERIOD_NAMES = [
  "Wolf",
  "Snow",
  "Worm",
  "Pink",
  "Flower",
  "Strawberry",
  "Buck",
  "Sturgeon",
  "Harvest",
  "Hunter's",
  "Beaver",
  "Cold",
  "Blue Moon",
] as const;

export type PeriodPreset = {
  id: NamingSystem;
  label: string;
  origin: string;
  names: readonly string[];
};

export const PERIOD_PRESETS: PeriodPreset[] = [
  {
    id: "roman",
    label: "Roman numerals",
    origin: "Neutral default: I–XIII. No invented ancient month list.",
    names: ROMAN_PERIOD_NAMES,
  },
  {
    id: "numbered",
    label: "Plain numbers",
    origin: "Just 1–13. The four-week rhythm without extra names.",
    names: NUMBERED_PERIOD_NAMES,
  },
  {
    id: "ifc",
    label: "International Fixed Calendar",
    origin: "Moses B. Cotsworth, 1902: January–June, Sol, July–December.",
    names: IFC_PERIOD_NAMES,
  },
  {
    id: "comte",
    label: "Positivist calendar",
    origin: "Auguste Comte, 1849. A 13-month reform named for historical figures.",
    names: COMTE_PERIOD_NAMES,
  },
  {
    id: "celtic",
    label: "Celtic Tree",
    origin: "Robert Graves, The White Goddess, 1948 — a modern poetic scheme, not a recovered ancient calendar.",
    names: CELTIC_PERIOD_NAMES,
  },
  {
    id: "folk",
    label: "Folk full moons",
    origin: "Traditional almanac full-moon names (Wolf, Snow…). Blue Moon is the 13th; lists vary by place.",
    names: FOLK_PERIOD_NAMES,
  },
  {
    id: "custom",
    label: "Custom",
    origin: "Your own 13 names, stored only on this device.",
    names: ROMAN_PERIOD_NAMES,
  },
];

export const EMPTY_CUSTOM_NAMES = [...ROMAN_PERIOD_NAMES];

export function isNamingSystem(value: unknown): value is NamingSystem {
  return (
    value === "roman" ||
    value === "numbered" ||
    value === "ifc" ||
    value === "comte" ||
    value === "celtic" ||
    value === "folk" ||
    value === "custom"
  );
}

/** Map leftover prototype values (Spanish SÚE names) onto the Roman default. */
export function migrateNaming(value: unknown): NamingSystem {
  if (isNamingSystem(value)) return value;
  return "roman";
}

export function resolveNaming(
  input: NamingSystem | NamingContext | undefined,
): NamingContext {
  if (!input) return { preset: "roman" };
  if (typeof input === "string") return { preset: migrateNaming(input) };
  return {
    preset: migrateNaming(input.preset),
    customNames: input.customNames,
  };
}

export function periodNamesFor(
  preset: NamingSystem,
  customNames?: string[],
): string[] {
  if (preset === "custom") {
    const names = customNames ?? [];
    return ROMAN_PERIOD_NAMES.map((fallback, index) => {
      const next = names[index]?.trim();
      return next ? next : fallback;
    });
  }
  const found = PERIOD_PRESETS.find((item) => item.id === preset);
  return [...(found?.names ?? ROMAN_PERIOD_NAMES)];
}

export function periodNameFromContext(
  period: number | null,
  naming: NamingSystem | NamingContext,
  special: "year-day" | "leap-day" | null = null,
): string {
  if (special === "year-day") return "Year Day";
  if (special === "leap-day") return "Leap Day";
  if (!period) return "—";
  const ctx = resolveNaming(naming);
  return periodNamesFor(ctx.preset, ctx.customNames)[period - 1] ?? `Period ${period}`;
}

export function namingPresetMeta(preset: NamingSystem): PeriodPreset {
  return PERIOD_PRESETS.find((item) => item.id === preset) ?? PERIOD_PRESETS[0];
}
