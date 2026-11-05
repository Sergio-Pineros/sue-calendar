import type { MoonPhaseName, SprintIntensity } from "./types";

export type Waveform = "sine" | "square" | "triangle" | "sawtooth";

export const FREQ_MIN = 1;
export const FREQ_MAX = 20000;
export const DIAL_MIN = 20;
export const DIAL_MAX = 2000;
export const DEFAULT_HZ = 432;
export const DEFAULT_VOLUME = 0.18;
export const MAX_VOLUME = 0.42;
export const FADE_SECONDS = 0.09;
export const SCHUMANN_HZ = 7.83;
export const SCHUMANN_CARRIER = 200;
export const FAVORITE_LIMIT = 16;

export type FrequencyPreset = {
  id: string;
  hz: number;
  label: string;
  group: "concert" | "solfeggio" | "earth";
  meaning: string;
  binaural?: boolean;
};

export const WAVEFORMS: { id: Waveform; glyph: string; label: string }[] = [
  { id: "sine", glyph: "~-~", label: "Sine" },
  { id: "triangle", glyph: "/\\", label: "Triangle" },
  { id: "square", glyph: "_|¯", label: "Square" },
  { id: "sawtooth", glyph: "/|/", label: "Saw" },
];

export const FREQUENCY_PRESETS: FrequencyPreset[] = [
  {
    id: "432",
    hz: 432,
    label: "432 Hz",
    group: "concert",
    meaning: "A modern alternative concert pitch. Preference, not a proven healing frequency.",
  },
  {
    id: "440",
    hz: 440,
    label: "440 Hz",
    group: "concert",
    meaning: "ISO concert A. The usual tuning reference for orchestras.",
  },
  {
    id: "174",
    hz: 174,
    label: "174",
    group: "solfeggio",
    meaning: "Solfeggio tradition: foundation / ease. Interpretation, not science.",
  },
  {
    id: "285",
    hz: 285,
    label: "285",
    group: "solfeggio",
    meaning: "Solfeggio tradition: renewal. Interpretation, not science.",
  },
  {
    id: "396",
    hz: 396,
    label: "396",
    group: "solfeggio",
    meaning: "Solfeggio tradition: release. Interpretation, not science.",
  },
  {
    id: "417",
    hz: 417,
    label: "417",
    group: "solfeggio",
    meaning: "Solfeggio tradition: change. Interpretation, not science.",
  },
  {
    id: "528",
    hz: 528,
    label: "528",
    group: "solfeggio",
    meaning: "Solfeggio tradition: repair / 'miracle' tone. Interpretation, not science.",
  },
  {
    id: "639",
    hz: 639,
    label: "639",
    group: "solfeggio",
    meaning: "Solfeggio tradition: connection. Interpretation, not science.",
  },
  {
    id: "741",
    hz: 741,
    label: "741",
    group: "solfeggio",
    meaning: "Solfeggio tradition: expression. Interpretation, not science.",
  },
  {
    id: "852",
    hz: 852,
    label: "852",
    group: "solfeggio",
    meaning: "Solfeggio tradition: intuition. Interpretation, not science.",
  },
  {
    id: "963",
    hz: 963,
    label: "963",
    group: "solfeggio",
    meaning: "Solfeggio tradition: unity. Interpretation, not science.",
  },
  {
    id: "schumann",
    hz: SCHUMANN_HZ,
    label: "7.83 Hz",
    group: "earth",
    binaural: true,
    meaning:
      "Schumann resonance is a real Earth-ionosphere frequency. Hearing it as a binaural beat is a modern practice, not a therapy.",
  },
];

const PERIOD_TONES = [174, 285, 396, 417, 528, 639, 741, 852, 963, 432, 440, 396, 528];

const MOON_TONES: Record<MoonPhaseName, number> = {
  new: 396,
  "waxing-crescent": 417,
  "first-quarter": 528,
  "waxing-gibbous": 639,
  full: 852,
  "waning-gibbous": 741,
  "last-quarter": 285,
  "waning-crescent": 174,
};

export function clampHz(hz: number): number {
  if (!Number.isFinite(hz)) return DEFAULT_HZ;
  return Math.min(FREQ_MAX, Math.max(FREQ_MIN, hz));
}

export function parseHz(raw: string): number | null {
  const value = Number.parseFloat(raw.replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;
  return clampHz(value);
}

export function formatHz(hz: number): string {
  const value = clampHz(hz);
  if (value < 20) {
    return value
      .toFixed(2)
      .replace(/(\.\d*?)0+$/, "$1")
      .replace(/\.$/, "");
  }
  if (value < 100) return (Math.round(value * 10) / 10).toFixed(1).replace(/\.0$/, "");
  return String(Math.round(value));
}

export function snapHz(hz: number): number {
  const value = clampHz(hz);
  if (value < 20) return Math.round(value * 100) / 100;
  if (value < 100) return Math.round(value * 10) / 10;
  return Math.round(value);
}

export function hzToDial(hz: number): number {
  const clamped = Math.min(DIAL_MAX, Math.max(DIAL_MIN, hz));
  const t =
    (Math.log(clamped) - Math.log(DIAL_MIN)) /
    (Math.log(DIAL_MAX) - Math.log(DIAL_MIN));
  return t;
}

export function dialToHz(t: number): number {
  const u = Math.min(1, Math.max(0, t));
  return snapHz(
    Math.exp(Math.log(DIAL_MIN) + u * (Math.log(DIAL_MAX) - Math.log(DIAL_MIN))),
  );
}

export function presetById(id: string): FrequencyPreset | undefined {
  return FREQUENCY_PRESETS.find((item) => item.id === id);
}

export function meaningForHz(hz: number): string | undefined {
  const found = FREQUENCY_PRESETS.find((item) => Math.abs(item.hz - hz) < 0.05);
  return found?.meaning;
}

export type ToneSuggestion = {
  hz: number;
  label: string;
  reason: string;
  binaural?: boolean;
};

export function suggestedTone(input: {
  moon: MoonPhaseName;
  period: number | null;
  intensity?: SprintIntensity | null;
  rest?: boolean;
}): ToneSuggestion {
  if (input.rest || input.intensity === "rest") {
    return {
      hz: 432,
      label: "432 Hz",
      reason: "A quiet rest-day tone. Tradition and preference, not science.",
    };
  }
  if (input.intensity === "light") {
    return {
      hz: 396,
      label: "396 Hz",
      reason: "A lighter-day suggestion from the Solfeggio set. Interpretation, not a forecast.",
    };
  }
  const hz = MOON_TONES[input.moon];
  const preset = FREQUENCY_PRESETS.find((item) => item.hz === hz);
  return {
    hz,
    label: preset?.label ?? `${formatHz(hz)} Hz`,
    reason: `Suggested from today's moon (${input.moon.replace("-", " ")}). A planning overlay, not a medical claim.`,
  };
}

export function periodTone(period: number | null): number {
  if (!period) return DEFAULT_HZ;
  return PERIOD_TONES[(period - 1 + 13) % 13];
}

export function normalizeFavorites(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const next: number[] = [];
  for (const item of raw) {
    const hz =
      typeof item === "number" && Number.isFinite(item) && item > 0
        ? clampHz(item)
        : parseHz(String(item));
    if (hz == null) continue;
    const snapped = snapHz(hz);
    if (!next.some((existing) => Math.abs(existing - snapped) < 0.05)) {
      next.push(snapped);
    }
    if (next.length >= FAVORITE_LIMIT) break;
  }
  return next;
}

export function toggleFavorite(list: number[], hz: number): number[] {
  const snapped = snapHz(hz);
  if (list.some((item) => Math.abs(item - snapped) < 0.05)) {
    return list.filter((item) => Math.abs(item - snapped) >= 0.05);
  }
  return normalizeFavorites([...list, snapped]);
}

export function isFavorite(list: number[], hz: number): boolean {
  return list.some((item) => Math.abs(item - snapHz(hz)) < 0.05);
}

export function carrierFor(hz: number, binaural: boolean): number {
  if (!binaural) return hz;
  if (hz < 20) return SCHUMANN_CARRIER;
  return hz;
}

export function beatFor(hz: number, binaural: boolean, offset: number): number {
  if (!binaural) return 0;
  if (hz < 20) return hz;
  return Math.min(40, Math.max(0, offset));
}
