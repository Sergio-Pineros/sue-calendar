import type { PeriodColorPreset } from "./types";

export const PERIOD_COUNT = 13;

/** Default SÚE purple ramp — the current Ancient Amethyst period stones. */
export const AMETHYST_PERIOD_COLORS = [
  "#2a1848",
  "#351e58",
  "#3f2468",
  "#4a2d78",
  "#563888",
  "#64449a",
  "#7354ac",
  "#8666be",
  "#9b7cd0",
  "#b396e0",
  "#c9b0ec",
  "#dcc6f4",
  "#efe0fa",
] as const;

export const SEASONS_PERIOD_COLORS = [
  "#243058",
  "#2c3c68",
  "#355878",
  "#2f6a52",
  "#3d805c",
  "#4e9468",
  "#c4a034",
  "#d4b04a",
  "#e08a40",
  "#c05a32",
  "#8a3c38",
  "#5a3868",
  "#3a2c58",
] as const;

export const MOON_PERIOD_COLORS = [
  "#16101f",
  "#241c30",
  "#352848",
  "#4a3a62",
  "#6a5684",
  "#8e74a8",
  "#e8dcf2",
  "#c8b4dc",
  "#9e88b8",
  "#746090",
  "#52446c",
  "#382e50",
  "#22182e",
] as const;

export const SPECTRUM_PERIOD_COLORS = [
  "#5a2048",
  "#7a2448",
  "#a03830",
  "#c06828",
  "#c4a030",
  "#6a9840",
  "#2c8060",
  "#247488",
  "#285888",
  "#3840a0",
  "#582898",
  "#702070",
  "#881848",
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
    origin: "Default. The original SÚE purple ramp, carved like stone.",
    colors: AMETHYST_PERIOD_COLORS,
  },
  {
    id: "seasons",
    label: "Seasons",
    origin: "Winter indigo through spring moss, summer brass, autumn russet.",
    colors: SEASONS_PERIOD_COLORS,
  },
  {
    id: "moon",
    label: "Moon",
    origin: "New-moon dark to full-moon silver, then waning back to night.",
    colors: MOON_PERIOD_COLORS,
  },
  {
    id: "spectrum",
    label: "Spectrum",
    origin: "A full hue walk that still sits on the dark HUD.",
    colors: SPECTRUM_PERIOD_COLORS,
  },
];

/** Curated swatches that stay harmonious with the purple / stone themes. */
export const PERIOD_SWATCHES = [
  "#2a1848",
  "#4a2d78",
  "#7354ac",
  "#9b7cd0",
  "#dcc6f4",
  "#16101f",
  "#6a5684",
  "#e8dcf2",
  "#243058",
  "#2f6a52",
  "#c4a034",
  "#c05a32",
  "#5a2048",
  "#c06828",
  "#2c8060",
  "#285888",
  "#582898",
  "#e8a0c8",
  "#3d2410",
  "#8a6634",
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
