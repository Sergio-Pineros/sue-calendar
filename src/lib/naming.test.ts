import {
  migrateNaming,
  periodNameFromContext,
  periodNamesFor,
  ROMAN_PERIOD_NAMES,
  COMTE_PERIOD_NAMES,
  CELTIC_PERIOD_NAMES,
  FOLK_PERIOD_NAMES,
} from "./naming";
import { gregorianToSue } from "./sue-calendar";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runNamingTests(): void {
  assert(migrateNaming("sue") === "roman", "legacy Spanish preset maps to roman");
  assert(migrateNaming("roman") === "roman", "roman stays roman");
  assert(migrateNaming("ifc") === "ifc", "ifc stays ifc");
  assert(periodNamesFor("roman")[0] === "I", "period 1 is I");
  assert(periodNamesFor("roman")[12] === "XIII", "period 13 is XIII");
  assert(periodNameFromContext(1, "roman") === "I", "name helper I");
  assert(periodNameFromContext(7, "ifc") === "Sol", "IFC period 7 is Sol");
  assert(periodNameFromContext(1, "comte") === "Moses", "Comte period 1");
  assert(periodNameFromContext(13, "comte") === "Bichat", "Comte period 13");
  assert(COMTE_PERIOD_NAMES.length === 13, "Comte has 13 names");
  assert(CELTIC_PERIOD_NAMES[0] === "Birch", "Graves tree starts at Birch");
  assert(CELTIC_PERIOD_NAMES[6] === "Oak", "Oak is period 7");
  assert(FOLK_PERIOD_NAMES[12] === "Blue Moon", "13th folk name is Blue Moon");
  assert(
    periodNameFromContext(2, { preset: "custom", customNames: ["", "River"] }) ===
      "River",
    "custom names win when provided",
  );
  assert(
    periodNameFromContext(1, { preset: "custom", customNames: ["", "River"] }) ===
      "I",
    "empty custom name falls back to Roman",
  );
  assert(periodNameFromContext(null, "roman", "year-day") === "Year Day", "Year Day label");
  assert(periodNameFromContext(null, "roman", "leap-day") === "Leap Day", "Leap Day label");

  const p1 = gregorianToSue("2026-01-01", "roman");
  assert(p1.suePeriodName === "I", "default mapping uses Roman I");
  const folk = gregorianToSue("2026-01-01", "folk");
  assert(folk.suePeriodName === "Wolf", "folk period 1 is Wolf");
  assert(ROMAN_PERIOD_NAMES.length === 13, "thirteen roman numerals");
  console.log("naming: all checks passed");
}

runNamingTests();
