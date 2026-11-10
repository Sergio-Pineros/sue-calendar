import {
  bangladeshBengaliDateForGregorian,
  formatCompanionDate,
  julianDateForGregorian,
  mayaLongCountForDate,
} from "./companion-calendars";
import { applySkippedOnboarding, defaultSettings, normalizeSettings } from "./storage";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const gregorian = formatCompanionDate("2026-11-10", "gregorian");
assert(gregorian.label.includes("November 10, 2026"), "Gregorian 2026 example");

const buddhist = formatCompanionDate("2026-11-10", "buddhist");
assert(buddhist.label.includes("2569"), "Thai Buddhist year 2569");

const japanese = formatCompanionDate("2026-11-10", "japanese");
assert(japanese.label.includes("Reiwa") && japanese.label.includes("8"), "Japanese Reiwa 8");

const persian = formatCompanionDate("2026-11-10", "persian");
assert(persian.label.includes("1405"), "Persian year 1405");

const hebrew = formatCompanionDate("2026-11-10", "hebrew");
assert(hebrew.label.includes("5787"), "Hebrew year 5787");

const islamic = formatCompanionDate("2026-11-10", "islamic");
assert(islamic.label.includes("1448"), "Islamic civil year 1448");

const julian = julianDateForGregorian("2026-11-10");
assert(
  julian.year === 2026 && julian.month === 10 && julian.day === 28,
  "Julian date is 13 days behind in November 2026",
);

const bengaliStart = bangladeshBengaliDateForGregorian("2026-04-14");
assert(
  bengaliStart.year === 1433 && bengaliStart.month === "Boishakh" && bengaliStart.day === 1,
  "Bangladesh Bengali new year 1433",
);
const bengaliBoundary = bangladeshBengaliDateForGregorian("2026-04-13");
assert(
  bengaliBoundary.year === 1432 &&
    bengaliBoundary.month === "Choitro" &&
    bengaliBoundary.day === 30,
  "Bangladesh Bengali year boundary",
);
const bengaliNow = bangladeshBengaliDateForGregorian("2026-11-10");
assert(
  bengaliNow.year === 1433 && bengaliNow.month === "Kartik" && bengaliNow.day === 25,
  "Bangladesh Bengali 2026 example",
);

const malayalamBeforeNewYear = formatCompanionDate("2026-08-16", "malayalam");
assert(
  malayalamBeforeNewYear.label.includes("Karkidakam") &&
    malayalamBeforeNewYear.label.includes("1201"),
  "Malayalam boundary remains in the previous Kollam year before 17 August",
);
const malayalamNewYear = formatCompanionDate("2026-08-17", "malayalam");
assert(
  malayalamNewYear.label.includes("Chingam") &&
    malayalamNewYear.label.includes("1202"),
  "Malayalam year boundary starts on 17 August in the regional approximation",
);

assert(mayaLongCountForDate("2026-11-10") === "13.0.14.1.12", "Maya GMT example");

const leapDay = formatCompanionDate("2024-06-17", "international-fixed");
assert(leapDay.label === "Leap Day", "International Fixed Leap Day");
const yearDay = formatCompanionDate("2026-12-31", "international-fixed");
assert(yearDay.label === "Year Day", "International Fixed Year Day");

const french = formatCompanionDate("2026-11-10", "french-republican");
assert(french.label === "20 Brumaire, Year 235", "French Republican 2026 approximation");

const unsupported = formatCompanionDate("2026-11-10", "babylonian");
assert(
  unsupported.support === "not-a-calendar" &&
    unsupported.label === "Babylonian",
  "Babylonian conversion is explicitly unsupported",
);

const defaults = defaultSettings();
assert(defaults.companionCalendar === "gregorian", "Gregorian is the default companion");
assert(defaults.companionMode === "companion", "28-day companion mode is the default");

const normalized = normalizeSettings({
  companionCalendar: "coptic",
  companionMode: "follow",
} as never);
assert(
  normalized.companionCalendar === "coptic" && normalized.companionMode === "follow",
  "companion preferences persist through normalization",
);
const invalid = normalizeSettings({
  companionCalendar: "not-real",
  companionMode: "not-real",
} as never);
assert(
  invalid.companionCalendar === "gregorian" && invalid.companionMode === "companion",
  "invalid companion preferences fall back to defaults",
);

const skipped = applySkippedOnboarding(normalized);
assert(
  skipped.companionCalendar === "coptic" && skipped.companionMode === "follow",
  "skipping onboarding preserves companion preferences",
);

console.log("companion-calendars: all checks passed");
