import {
  SERGIO_WEEKDAY_NUMBERS,
  clampWeekStart,
  formatWeekdayNumber,
  orderedWeekdayIndexes,
  weekdayNumber,
  weekdayNumbersFor,
  weekdayShortLabel,
} from "./weekdays";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runWeekdayTests(): void {
  assert(SERGIO_WEEKDAY_NUMBERS[0] === -1, "Sunday is -1");
  assert(SERGIO_WEEKDAY_NUMBERS[1] === 0, "Monday is 0");
  assert(SERGIO_WEEKDAY_NUMBERS[6] === 5, "Saturday is 5");
  assert(
    weekdayNumbersFor("sergio")?.join(",") === "-1,0,1,2,3,4,5",
    "Sergio preset expands to -1…5",
  );
  assert(weekdayNumbersFor("one")?.join(",") === "1,2,3,4,5,6,7", "1–7 preset");
  assert(weekdayNumbersFor("none") === null, "none has no numbers");
  assert(
    weekdayNumber(0, { weekdayNumberPreset: "sergio", weekdayNumbers: [] }) === -1,
    "Sunday number via helper",
  );
  assert(
    weekdayNumbersFor("custom", [9, 8, 7, 6, 5, 4, 3])?.[0] === 9,
    "custom numbers are kept",
  );
  assert(clampWeekStart(1) === 1, "Monday start");
  assert(clampWeekStart(7) === 0, "7 wraps to Sunday");
  assert(clampWeekStart(-1) === 6, "negative wraps");
  assert(
    orderedWeekdayIndexes(1).join(",") === "1,2,3,4,5,6,0",
    "week starting Monday",
  );
  assert(
    weekdayShortLabel(0, {
      weekdayNamePreset: "custom",
      weekdayNames: ["Sol", "Lun", "Mar", "Mer", "Jov", "Ven", "Sat"],
      weekdayShortNames: ["So", "", "", "", "", "", ""],
    }) === "So",
    "custom short name",
  );
  assert(formatWeekdayNumber(-1) === "−1", "minus sign for negative");
  console.log("weekdays: all checks passed");
}

runWeekdayTests();
