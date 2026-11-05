import type { PeriodColorPreset } from "./types";

export const PERIOD_COUNT = 13;

/** Deep violet stones — low lightness, low chroma. */
export const AMETHYST_PERIOD_COLORS = [
  "#14101c",
  "#1a1424",
  "#20182c",
  "#261c34",
  "#2c203c",
  "#322444",
  "#38284c",
  "#3e2c54",
  "#44305c",
  "#4a3464",
  "#50386c",
  "#563c74",
  "#5c407c",
] as const;

export const SEASONS_PERIOD_COLORS = [
  "#141820",
  "#161c28",
  "#182030",
  "#14241c",
  "#182820",
  "#1c2c24",
  "#2a2414",
  "#302818",
  "#2c1c14",
  "#281814",
  "#20141c",
  "#1a1420",
  "#161018",
] as const;

export const MOON_PERIOD_COLORS = [
  "#0e0c12",
  "#141018",
  "#1a1620",
  "#201c28",
  "#262430",
  "#2c2a38",
  "#343240",
  "#2e2c3a",
  "#262432",
  "#201c2a",
  "#1a1622",
  "#141018",
  "#0e0c12",
] as const;

export const SPECTRUM_PERIOD_COLORS = [
  "#24141c",
  "#261418",
  "#261814",
  "#241c14",
  "#202014",
  "#182014",
  "#142018",
  "#141c20",
  "#141824",
  "#181424",
  "#1c1422",
  "#20141e",
  "#241418",
] as const;

export const PERIOD_COLOR_PRESETS: {
  id: PeriodColorPreset;
  label: string;
  origin: string;
  colors: readonly string[];
}[] = [
  {
    id: "amethyst",
    label: "Amethyst",
    origin: "Default. Deep violet stones — never pale.",
    colors: AMETHYST_PERIOD_COLORS,
  },
  {
    id: "seasons",
    label: "Seasons",
    origin: "Dark winter indigo through moss, brass, and russet.",
    colors: SEASONS_PERIOD_COLORS,
  },
  {
    id: "moon",
    label: "Moon",
    origin: "New-moon dark to a muted full, then waning back to night.",
    colors: MOON_PERIOD_COLORS,
  },
  {
    id: "spectrum",
    label: "Spectrum",
    origin: "A hue walk that stays in the dark.",
    colors: SPECTRUM_PERIOD_COLORS,
  },
];

/** Curated swatches — every chip is a dark, muted stone. */
export const PERIOD_SWATCHES = [
  "#14101c",
  "#261c34",
  "#38284c",
  "#4a3464",
  "#5c407c",
  "#0e0c12",
  "#201c28",
  "#343240",
  "#141820",
  "#182820",
  "#2a2414",
  "#2c1c14",
  "#24141c",
  "#261814",
  "#142018",
  "#141824",
  "#1c1422",
  "#2a1c24",
  "#1c1410",
  "#302818",
] as const;

const HEX = /^#([0-9a-fA-F]{6})$/;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

export function isPeriodColorPreset(value: unknown): value is PeriodColorPreset {
  return (
    value === "amethyst" ||
    value === "seasons" ||
    value === "moon" ||
    value === "spectrum"
  );
}

export function hexLuminance(hex: string): number {
  const [r, g, b] = parseHex(isHexColor(hex) ? hex : "#000000");
  const lin = (channel: number) => {
    const s = channel / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Surfaces stay dark: relative luminance under 0.16 (no pale ramps). */
export function isDarkTone(value: unknown): boolean {
  return isHexColor(value) && hexLuminance(value) <= 0.16;
}

export function presetColors(preset: PeriodColorPreset): string[] {
  const found = PERIOD_COLOR_PRESETS.find((item) => item.id === preset);
  return [...(found?.colors ?? AMETHYST_PERIOD_COLORS)];
}

export function emptyPeriodColorOverrides(): (string | null)[] {
  return Array.from({ length: PERIOD_COUNT }, () => null);
}

export function normalizePeriodColorOverrides(raw: unknown): (string | null)[] {
  const base = emptyPeriodColorOverrides();
  if (!Array.isArray(raw)) return base;
  return base.map((_, index) => {
    const value = raw[index];
    return isHexColor(value) ? value.toLowerCase() : null;
  });
}

export function resolvePeriodColors(
  preset: PeriodColorPreset = "amethyst",
  overrides: Array<string | null | undefined> = [],
): string[] {
  const colors = presetColors(isPeriodColorPreset(preset) ? preset : "amethyst");
  for (let i = 0; i < PERIOD_COUNT; i += 1) {
    const override = overrides[i];
    if (isHexColor(override)) colors[i] = override.toLowerCase();
  }
  return colors;
}

export function periodHasOverride(
  overrides: Array<string | null | undefined>,
  period: number,
): boolean {
  return isHexColor(overrides[period - 1]);
}

export function mixHex(a: string, b: string, t: number): string {
  const clampT = t < 0 ? 0 : t > 1 ? 1 : t;
  const left = parseHex(isHexColor(a) ? a : AMETHYST_PERIOD_COLORS[0]);
  const right = parseHex(isHexColor(b) ? b : AMETHYST_PERIOD_COLORS[0]);
  const hex = (n: number) =>
    Math.round(n)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(left[0] + (right[0] - left[0]) * clampT)}${hex(left[1] + (right[1] - left[1]) * clampT)}${hex(left[2] + (right[2] - left[2]) * clampT)}`;
}

export function blendPeriodColors(colors: string[], position: number): string {
  if (!colors.length) return AMETHYST_PERIOD_COLORS[0];
  const max = colors.length - 1;
  const p = position < 0 ? 0 : position > max ? max : position;
  const i = Math.min(Math.floor(p), max);
  const j = Math.min(i + 1, max);
  return mixHex(colors[i], colors[j], p - i);
}

/** Page wash: keep the period hue, crush it into the night paper. */
export function mutePageTone(hex: string, paper = "#100c16"): string {
  return mixHex(paper, isHexColor(hex) ? hex : paper, 0.28);
}

function parseHex(value: string): [number, number, number] {
  const n = Number.parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function applyPeriodColorVars(
  colors: string[],
  target: CSSStyleDeclaration | null = typeof document === "undefined"
    ? null
    : document.documentElement.style,
): void {
  if (!target) return;
  colors.forEach((hex, index) => {
    target.setProperty(`--period-${index + 1}`, hex);
  });
}
