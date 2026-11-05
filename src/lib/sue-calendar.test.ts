import {
  datesInPeriod,
  datesInWeek,
  gregorianToSue,
  isLeapYear,
  leapDayISO,
  nextPeriodRef,
  periodName,
  sueToGregorian,
  yearDayISO,
} from "./sue-calendar";
import "./naming.test";
import "./weekdays.test";
import "./sprints.test";
import "./period-colors.test";
import "./wheel-scrub.test";
import "./frequency.test";
import "./spring.test";
import "./caldav.test";
import "./entry.test";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function run(): void {
  const p1 = gregorianToSue("2026-01-01", "roman");
  assert(p1.suePeriod === 1 && p1.sueDayInPeriod === 1, "2026-01-01 should be P1 D1");
  assert(p1.suePeriodName === "I", "Roman name for period 1 is I");
  assert(!p1.isYearDay && !p1.isLeapDay, "Jan 1 is a regular day");

  const lastRegular = gregorianToSue("2026-12-30", "numbered");
  assert(
    lastRegular.suePeriod === 13 && lastRegular.sueDayInPeriod === 28,
    "2026-12-30 should be P13 D28",
  );
  assert(lastRegular.suePeriodName === "13", "numbered period 13");

  const yearDay = gregorianToSue("2026-12-31");
  assert(yearDay.isYearDay && yearDay.suePeriod === null, "2026-12-31 is Year Day");
  assert(yearDayISO(2026) === "2026-12-31", "Year Day ISO for 2026");
  assert(periodName(null, "roman", "year-day") === "Year Day", "Year Day periodName");

  assert(!isLeapYear(2026) && isLeapYear(2024) && isLeapYear(2000) && !isLeapYear(1900), "leap years");

  const leap = leapDayISO(2024);
  assert(leap === "2024-06-17", `2024 Leap Day should be June 17, got ${leap}`);
  const leapDate = gregorianToSue("2024-06-17");
  assert(leapDate.isLeapDay, "2024-06-17 is Leap Day");

  const beforeLeap = gregorianToSue("2024-06-16");
  assert(beforeLeap.suePeriod === 6 && beforeLeap.sueDayInPeriod === 28, "day before leap is P6 D28");

  const afterLeap = gregorianToSue("2024-06-18");
  assert(afterLeap.suePeriod === 7 && afterLeap.sueDayInPeriod === 1, "day after leap is Sol/P7 D1");

  const sol = gregorianToSue("2024-06-18", "ifc");
  assert(sol.suePeriodName === "Sol", "IFC period 7 is Sol");

  assert(sueToGregorian(2026, 1, 1) === "2026-01-01", "inverse P1 D1");
  assert(sueToGregorian(2026, 13, 28) === "2026-12-30", "inverse P13 D28");
  assert(sueToGregorian(2024, 7, 1) === "2024-06-18", "inverse leap P7 D1");

  const days = datesInPeriod(2026, 1);
  assert(days.length === 28 && days[0] === "2026-01-01" && days[27] === "2026-01-28", "period 1 range");

  const week1 = datesInWeek(2026, 1, 1);
  assert(week1.length === 7 && week1[0] === "2026-01-01" && week1[6] === "2026-01-07", "week 1 of P1");
  const next = nextPeriodRef(2026, 13);
  assert(next.year === 2027 && next.period === 1, "period 13 carries into next year");

  const todayLike = gregorianToSue("2026-08-19", "roman");
  assert(todayLike.suePeriod === 9, `2026-08-19 should be period 9, got ${todayLike.suePeriod}`);
  assert(todayLike.weekday === "Wednesday", "2026-08-19 is Wednesday");

  // Round-trip every day of a leap and common year
  for (const year of [2024, 2025, 2026]) {
    let regular = 0;
    let special = 0;
    const dim = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
    const cursor = new Date(Date.UTC(year, 0, 1));
    for (let i = 0; i < dim; i += 1) {
      const iso = cursor.toISOString().slice(0, 10);
      const mapped = gregorianToSue(iso);
      if (mapped.isSpecialDay) {
        special += 1;
        assert(mapped.suePeriod === null, `${iso} special day has no period`);
      } else {
        regular += 1;
        assert(mapped.suePeriod !== null && mapped.sueDayInPeriod !== null, `${iso} missing period`);
        const back = sueToGregorian(year, mapped.suePeriod, mapped.sueDayInPeriod);
        assert(back === iso, `round-trip ${iso} -> ${back}`);
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    assert(regular === 364, `${year} should have 364 regular days, got ${regular}`);
    assert(special === dim - 364, `${year} special day count`);
  }

  console.log("sue-calendar: all checks passed");
}

run();
