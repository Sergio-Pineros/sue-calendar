import { shouldSkipLanding } from "./entry";
import { applySkippedOnboarding, defaultSettings } from "./storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(!shouldSkipLanding({ standalone: false, native: false, entered: false, onboarded: false }), "first visit sees landing");
assert(shouldSkipLanding({ standalone: true, native: false, entered: false, onboarded: false }), "PWA standalone skips landing");
assert(shouldSkipLanding({ standalone: false, native: true, entered: false, onboarded: false }), "native shell skips landing");
assert(shouldSkipLanding({ standalone: false, native: false, entered: true, onboarded: false }), "returning visitors skip landing");
assert(shouldSkipLanding({ standalone: false, native: false, entered: false, onboarded: true }), "onboarded users skip landing");

const dirty = defaultSettings();
dirty.naming = "celtic";
dirty.theme = "solarpunk-mecha";
dirty.weekdayNumberPreset = "one";
dirty.periodColorPreset = "spectrum";
dirty.customPeriodNames[0] = "Nope";
dirty.onboarded = false;

const skipped = applySkippedOnboarding(dirty);
assert(skipped.naming === "roman", "skip restores Roman names");
assert(skipped.theme === "ancient-amethyst", "skip restores Amethyst");
assert(skipped.weekdayNumberPreset === "sergio", "skip restores Sunday = −1");
assert(skipped.weekdayNumbers[0] === -1, "Sunday is −1");
assert(skipped.weekStart === 0, "week starts Sunday");
assert(skipped.periodColorPreset === "amethyst", "skip restores Amethyst palette");
assert(skipped.customPeriodNames[0] === "I", "custom names reset to Roman");
assert(skipped.onboarded === true, "skip marks onboarded");

console.log("entry: all checks passed");
