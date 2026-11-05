import {
  AMETHYST_PERIOD_COLORS,
  blendPeriodColors,
  emptyPeriodColorOverrides,
  isHexColor,
  isPeriodColorPreset,
  mixHex,
  normalizePeriodColorOverrides,
  PERIOD_COUNT,
  PERIOD_SWATCHES,
  presetColors,
  resolvePeriodColors,
} from "./period-colors";
import { defaultSettings, normalizeSettingsForTest } from "./storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runPeriodColorTests(): void {
  assert(isPeriodColorPreset("amethyst"), "amethyst is a preset");
  assert(isPeriodColorPreset("seasons"), "seasons is a preset");
  assert(isPeriodColorPreset("moon"), "moon is a preset");
  assert(isPeriodColorPreset("spectrum"), "spectrum is a preset");
  assert(!isPeriodColorPreset("custom"), "custom is not an auto preset");
  assert(!isPeriodColorPreset("neon"), "unknown preset rejected");

  assert(presetColors("amethyst").length === PERIOD_COUNT, "amethyst has 13");
  assert(presetColors("seasons").length === PERIOD_COUNT, "seasons has 13");
  assert(presetColors("moon").length === PERIOD_COUNT, "moon has 13");
  assert(presetColors("spectrum").length === PERIOD_COUNT, "spectrum has 13");
  assert(presetColors("amethyst")[0] === AMETHYST_PERIOD_COLORS[0], "amethyst starts at deep violet");
  assert(PERIOD_SWATCHES.length >= 12, "swatch palette is curated, not empty");
  assert(PERIOD_SWATCHES.every(isHexColor), "every swatch is a hex color");

  const plain = resolvePeriodColors("amethyst");
  assert(plain[3] === AMETHYST_PERIOD_COLORS[3], "no overrides keeps the preset");

  const one = resolvePeriodColors("amethyst", [null, null, "#c4a034"]);
  assert(one[2] === "#c4a034", "override replaces that period");
  assert(one[0] === AMETHYST_PERIOD_COLORS[0], "other periods stay on the preset");

  const messy = normalizePeriodColorOverrides(["#FF00AA", "nope", 12, "#abc", "#112233"]);
  assert(messy.length === 13, "overrides always 13 long");
  assert(messy[0] === "#ff00aa", "hex is lowercased");
  assert(messy[1] === null, "junk is dropped");
  assert(messy[4] === "#112233", "valid hex kept");
  assert(emptyPeriodColorOverrides().every((slot) => slot === null), "empty overrides are nulls");

  assert(mixHex("#000000", "#ffffff", 0) === "#000000", "mix t=0 is left");
  assert(mixHex("#000000", "#ffffff", 1) === "#ffffff", "mix t=1 is right");
  assert(mixHex("#000000", "#ffffff", 0.5) === "#808080", "mix t=0.5 is mid grey");

  const blended = blendPeriodColors(["#000000", "#ffffff"], 0.25);
  assert(blended === "#404040", "blend at 0.25 is a quarter toward white");
  assert(blendPeriodColors(["#2a1848"], 9) === "#2a1848", "single color clamps");

  const settings = normalizeSettingsForTest({
    naming: "roman",
    periodColorPreset: "moon",
    periodColorOverrides: ["#c4a034"],
  });
  assert(settings.periodColorPreset === "moon", "preset persists through storage normalize");
  assert(settings.periodColorOverrides[0] === "#c4a034", "override persists");
  assert(settings.periodColorOverrides[1] === null, "missing overrides stay null");

  const fallback = normalizeSettingsForTest({});
  assert(fallback.periodColorPreset === "amethyst", "default preset is amethyst");
  assert(
    resolvePeriodColors(fallback.periodColorPreset, fallback.periodColorOverrides)[0] ===
      AMETHYST_PERIOD_COLORS[0],
    "default resolve is the current purple ramp",
  );

  const defaults = defaultSettings();
  assert(defaults.periodColorPreset === "amethyst", "new settings default to amethyst");
  assert(defaults.periodColorOverrides.length === 13, "new settings have 13 override slots");

  const bad = normalizeSettingsForTest({
    periodColorPreset: "neon" as never,
    periodColorOverrides: "nope" as never,
  });
  assert(bad.periodColorPreset === "amethyst", "bad preset falls back");
  assert(bad.periodColorOverrides.every((slot) => slot === null), "bad overrides fall back");

  console.log("period-colors: all checks passed");
}

runPeriodColorTests();
