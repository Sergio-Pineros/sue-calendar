import type { PeriodColorPreset } from "./types";

export const PERIOD_COUNT = 13;

/** Near-monochrome violet-charcoal — hue is a whisper. */
export const AMETHYST_PERIOD_COLORS = [
  "#121018",
  "#14111a",
  "#16121c",
  "#18131e",
  "#1a1520",
  "#1c1722",
  "#1e1924",
  "#201b26",
  "#221d28",
  "#241f2a",
  "#26212c",
  "#28232e",
  "#2a2530",
] as const;

export const SEASONS_PERIOD_COLORS = [
  "#121418",
  "#14161a",
  "#16181c",
  "#141814",
  "#161a16",
  "#181c18",
  "#1c1a14",
  "#1e1c16",
  "#1c1814",
  "#1a1614",
  "#161418",
  "#141218",
  "#121016",
] as const;

export const MOON_PERIOD_COLORS = [
  "#100e12",
  "#121014",
  "#141216",
  "#161418",
  "#18161a",
  "#1a181c",
  "#1c1a1e",
  "#1a181c",
  "#18161a",
  "#161418",
  "#141216",
  "#121014",
  "#100e12",
] as const;

export const SPECTRUM_PERIOD_COLORS = [
  "#1a1416",
  "#1a1514",
  "#1a1614",
  "#181614",
  "#161614",
  "#141614",
  "#141616",
  "#141618",
  "#141518",
  "#161418",
  "#181416",
  "#1a1416",
  "#1a1415",
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
    origin: "Default. Near-monochrome violet-charcoal.",
    colors: AMETHYST_PERIOD_COLORS,
  },
  {
    id: "seasons",
    label: "Seasons",
    origin: "A quiet walk through winter, moss, brass, and russet.",
    colors: SEASONS_PERIOD_COLORS,
  },
  {
    id: "moon",
    label: "Moon",
    origin: "New-moon dark to a muted full, then back to night.",
    colors: MOON_PERIOD_COLORS,
  },
  {
    id: "spectrum",
    label: "Spectrum",
    origin: "A hue walk that stays almost grey.",
    colors: SPECTRUM_PERIOD_COLORS,
  },
];

/** Curated swatches — every chip is a near-mono dark stone. */
export const PERIOD_SWATCHES = [
  "#121018",
  "#18131e",
  "#201b26",
  "#2a2530",
  "#100e12",
  "#161418",
  "#1c1a1e",
  "#121418",
  "#161a16",
  "#1c1a14",
  "#1c1814",
  "#1a1416",
  "#141614",
  "#141616",
  "#141618",
  "#181416",
  "#1a1614",
  "#161416",
  "#141214",
  "#1e1c16",
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

/** Page wash: keep a hint of period hue, stay in night charcoal. */
export function mutePageTone(hex: string, paper = "#0e0d10"): string {
  return mixHex(paper, isHexColor(hex) ? hex : paper, 0.12);
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
