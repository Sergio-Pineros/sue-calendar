import type { PeriodColorPreset } from "./types";

export const PERIOD_COUNT = 13;

/** Soft period gradients — each day has a quiet place in the year. */
export const AMETHYST_PERIOD_COLORS = [
  "#f1e8e3",
  "#e8e5ef",
  "#dedff0",
  "#d9e8ef",
  "#d9eee8",
  "#e1eee0",
  "#eef0d7",
  "#f4edcf",
  "#f5e3cf",
  "#f2dcd5",
  "#eadce7",
  "#e3e0ed",
  "#eee8e1",
] as const;

export const SEASONS_PERIOD_COLORS = [
  "#e5e9ef",
  "#dfe9ec",
  "#dcece5",
  "#e0edd9",
  "#e9eed2",
  "#f0ead1",
  "#f2e1cf",
  "#efd9cf",
  "#ead7db",
  "#e5dceb",
  "#e1e4ef",
  "#e5e9ed",
  "#e8ebe7",
] as const;

export const MOON_PERIOD_COLORS = [
  "#e7e6ef",
  "#e2e4f0",
  "#dfe7f1",
  "#dbe9ef",
  "#dcece9",
  "#e2eee1",
  "#ecefd9",
  "#f1ead8",
  "#efe2dc",
  "#eadde8",
  "#e5e0ed",
  "#e4e5ef",
  "#e8e6ed",
] as const;

export const SPECTRUM_PERIOD_COLORS = [
  "#f0ded9",
  "#f0e3d5",
  "#eee9d5",
  "#e3edd9",
  "#d8eee2",
  "#d7e9eb",
  "#dbe3ef",
  "#e3dded",
  "#eadbed",
  "#efdbdf",
  "#f1ded6",
  "#eee5d9",
  "#ebe8d9",
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
    origin: "Default. Warm pearl, lavender, moss, and peach in a soft arc.",
    colors: AMETHYST_PERIOD_COLORS,
  },
  {
    id: "seasons",
    label: "Seasons",
    origin: "A quiet walk through winter air, moss, honey, and russet.",
    colors: SEASONS_PERIOD_COLORS,
  },
  {
    id: "moon",
    label: "Moon",
    origin: "A pearl-blue pass from new moon to muted full, then back again.",
    colors: MOON_PERIOD_COLORS,
  },
  {
    id: "spectrum",
    label: "Spectrum",
    origin: "A gentle hue walk that stays soft enough for reading.",
    colors: SPECTRUM_PERIOD_COLORS,
  },
];

/** Curated swatches — light enough for the pearl surface, restrained enough for text. */
export const PERIOD_SWATCHES = [
  "#f1e8e3",
  "#dedff0",
  "#d9eee8",
  "#eef0d7",
  "#f5e3cf",
  "#eadce7",
  "#e5e9ef",
  "#dcece5",
  "#f0ead1",
  "#ead7db",
  "#dbe9ef",
  "#e2eee1",
  "#f1ead8",
  "#e3dded",
  "#efdbdf",
  "#e8e5ef",
  "#e1eee0",
  "#f2dcd5",
  "#e3e0ed",
  "#d8eee2",
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

/** Page wash: keep a hint of period hue without overpowering the surface. */
export function mutePageTone(hex: string, paper = "#f5f0e8"): string {
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
