import { normalizeSettingsForTest } from "./storage";
import {
  beatFor,
  carrierFor,
  clampHz,
  DEFAULT_HZ,
  dialToHz,
  FREQUENCY_PRESETS,
  formatHz,
  hzToDial,
  isFavorite,
  parseHz,
  periodTone,
  SCHUMANN_HZ,
  snapHz,
  suggestedTone,
  toggleFavorite,
  WAVEFORMS,
} from "./frequency";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runFrequencyTests(): void {
  assert(clampHz(440) === 440, "440 stays");
  assert(clampHz(0) === 1, "zero clamps to 1");
  assert(clampHz(99999) === 20000, "high clamps to 20k");
  assert(clampHz(Number.NaN) === DEFAULT_HZ, "NaN falls back");
  assert(parseHz("432") === 432, "parse 432");
  assert(parseHz("7,83") === 7.83, "parse comma decimal");
  assert(parseHz("nope") === null, "junk rejected");
  assert(formatHz(7.83) === "7.83", "schumann formats");
  assert(formatHz(10) === "10", "ten stays ten");
  assert(formatHz(440.2) === "440", "concert rounds");
  assert(snapHz(441.4) === 441, "snap above 100");
  assert(snapHz(32.16) === 32.2, "snap tenths under 100");

  assert(Math.abs(dialToHz(hzToDial(432)) - 432) <= 1, "dial round-trips 432");
  assert(dialToHz(0) === 20, "dial start is 20");
  assert(dialToHz(1) === 2000, "dial end is 2000");

  const ids = FREQUENCY_PRESETS.map((item) => item.id);
  assert(ids.includes("432") && ids.includes("440"), "concert presets");
  for (const hz of [174, 285, 396, 417, 528, 639, 741, 852, 963]) {
    assert(
      FREQUENCY_PRESETS.some((item) => item.hz === hz),
      `solfeggio ${hz}`,
    );
  }
  const earth = FREQUENCY_PRESETS.find((item) => item.id === "schumann");
  assert(earth?.hz === SCHUMANN_HZ && earth.binaural, "Schumann is binaural");
  assert(WAVEFORMS[0].id === "sine", "sine is the default waveform");

  const rest = suggestedTone({ moon: "full", period: 1, rest: true });
  assert(rest.hz === 432, "rest day suggests 432");
  const sprintRest = suggestedTone({ moon: "full", period: 3, intensity: "rest" });
  assert(sprintRest.hz === 432, "sprint rest suggests 432");
  const neu = suggestedTone({ moon: "new", period: 2 });
  assert(neu.hz === 396, "new moon suggests 396");
  const full = suggestedTone({ moon: "full", period: 8 });
  assert(full.hz === 852, "full moon suggests 852");
  assert(periodTone(1) === 174, "period I maps to 174");
  assert(periodTone(5) === 528, "period V maps to 528");

  assert(carrierFor(7.83, true) === 200, "sub-audible uses a carrier");
  assert(beatFor(7.83, true, 0) === 7.83, "Schumann beat is 7.83");
  assert(beatFor(440, true, 4) === 4, "audible binaural uses the offset");
  assert(beatFor(440, false, 4) === 0, "mono has no beat");

  const added = toggleFavorite([], 432);
  assert(isFavorite(added, 432), "favorite saved");
  const removed = toggleFavorite(added, 432);
  assert(!isFavorite(removed, 432), "favorite toggles off");
  const many = toggleFavorite(Array.from({ length: 20 }, (_, i) => 200 + i), 440);
  assert(many.length <= 16, "favorites cap");

  assert(
    FREQUENCY_PRESETS.filter((item) => item.group === "solfeggio").every((item) =>
      /interpretation|not science/i.test(item.meaning),
    ),
    "solfeggio meanings stay honest",
  );

  const stored = normalizeSettingsForTest({
    frequencyFavorites: [432, 432, "528", 0, "nope"] as never,
  });
  assert(stored.frequencyFavorites[0] === 432, "favorite 432 kept");
  assert(stored.frequencyFavorites.includes(528), "string 528 kept");
  assert(
    stored.frequencyFavorites.filter((item) => item === 432).length === 1,
    "duplicate favorites collapse",
  );
  assert(!stored.frequencyFavorites.includes(0), "zero is not a favorite");

  console.log("frequency: all checks passed");
}

runFrequencyTests();
