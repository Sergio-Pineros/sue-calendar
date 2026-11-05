import type { CalendarDate, NamingSystem, Weekday } from "./types";
import { moonForDate } from "./moon";
import { seasonForDate } from "./seasons";
import {
  addDays,
  dateFromDayOfYear,
  daysInGregorianYear,
  gregorianDayOfYear,
  isLeapYear,
  parseISODate,
  toISODate,
  todayISO,
  weekdayIndex,
} from "./iso-date";

export {
  addDays,
  dateFromDayOfYear,
  daysInGregorianYear,
  gregorianDayOfYear,
  isLeapYear,
  parseISODate,
  toISODate,
  todayISO,
  weekdayIndex,
};

export const PERIODS_PER_YEAR = 13;
export const DAYS_PER_PERIOD = 28;
export const WEEKS_PER_PERIOD = 4;
export const REGULAR_DAYS = PERIODS_PER_YEAR * DAYS_PER_PERIOD;

export const IFC_PERIOD_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "Sol",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const SUE_PERIOD_NAMES = [
  "Alba",
  "Nieve",
  "Brote",
  "Lluvia",
  "Fronda",
  "Estío",
  "Umbral",
  "Calor",
  "Cosecha",
  "Ocre",
  "Niebla",
  "Ceniza",
  "Víspera",
] as const;

export const WEEKDAYS: Weekday[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const WEEKDAY_SHORT_ES = ["D", "L", "M", "X", "J", "V", "S"];
export const WEEKDAY_LONG_ES = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

export function periodName(
  period: number | null,
  naming: NamingSystem,
  special: "year-day" | "leap-day" | null = null,
): string {
  if (special === "year-day") return "Year Day";
  if (special === "leap-day") return "Leap Day";
  if (!period) return "—";
  if (naming === "ifc") return IFC_PERIOD_NAMES[period - 1];
  if (naming === "sue") return SUE_PERIOD_NAMES[period - 1];
  return `Periodo ${period}`;
}

/**
 * International Fixed Calendar overlay.
 *
 * Common year: days 1–364 are 13 × 28; day 365 is Year Day.
 * Leap year: Leap Day is inserted after period 6 (day-of-year 169),
 * then periods 7–13 occupy days 170–365, and day 366 is Year Day.
 *
 * Period 1 always begins on Gregorian 1 January.
 */
export function gregorianToSue(
  iso: string,
  naming: NamingSystem = "sue",
): CalendarDate {
  const { year, month, day } = parseISODate(iso);
  const doy = gregorianDayOfYear(year, month, day);
  const leap = isLeapYear(year);

  let suePeriod: number | null = null;
  let sueDayInPeriod: number | null = null;
  let isYearDay = false;
  let isLeapDay = false;

  if (leap) {
    if (doy === 169) {
      isLeapDay = true;
    } else if (doy === 366) {
      isYearDay = true;
    } else if (doy < 169) {
      suePeriod = Math.ceil(doy / DAYS_PER_PERIOD);
      sueDayInPeriod = ((doy - 1) % DAYS_PER_PERIOD) + 1;
    } else {
      const shifted = doy - 1;
      suePeriod = Math.ceil(shifted / DAYS_PER_PERIOD);
      sueDayInPeriod = ((shifted - 1) % DAYS_PER_PERIOD) + 1;
    }
  } else if (doy === 365) {
    isYearDay = true;
  } else {
    suePeriod = Math.ceil(doy / DAYS_PER_PERIOD);
    sueDayInPeriod = ((doy - 1) % DAYS_PER_PERIOD) + 1;
  }

  const wd = weekdayIndex(iso);
  const season = seasonForDate(iso);
  const special = isYearDay ? "year-day" : isLeapDay ? "leap-day" : null;

  return {
    gregorianDate: iso,
    gregorianYear: year,
    gregorianMonth: month,
    gregorianDay: day,
    weekday: WEEKDAYS[wd],
    weekdayIndex: wd,
    dayOfYear: doy,
    sueYear: year,
    suePeriod,
    suePeriodName: periodName(suePeriod, naming, special),
    sueWeekInPeriod: sueDayInPeriod
      ? Math.ceil(sueDayInPeriod / 7)
      : null,
    sueDayInPeriod,
    isYearDay,
    isLeapDay,
    isSpecialDay: isYearDay || isLeapDay,
    season: season.season,
    seasonMarker: season.marker,
    moon: moonForDate(iso),
  };
}

export function sueToGregorian(
  year: number,
  period: number,
  dayInPeriod: number,
): string {
  if (period < 1 || period > 13) {
    throw new Error("Period must be 1–13");
  }
  if (dayInPeriod < 1 || dayInPeriod > 28) {
    throw new Error("Day in period must be 1–28");
  }
  let doy = (period - 1) * DAYS_PER_PERIOD + dayInPeriod;
  if (isLeapYear(year) && period >= 7) {
    doy += 1;
  }
  return dateFromDayOfYear(year, doy);
}

export function leapDayISO(year: number): string | null {
  if (!isLeapYear(year)) return null;
  return dateFromDayOfYear(year, 169);
}

export function yearDayISO(year: number): string {
  return dateFromDayOfYear(year, daysInGregorianYear(year));
}

export function datesInPeriod(year: number, period: number): string[] {
  return Array.from({ length: DAYS_PER_PERIOD }, (_, i) =>
    sueToGregorian(year, period, i + 1),
  );
}

export function datesInWeek(
  year: number,
  period: number,
  week: number,
): string[] {
  const start = (Math.min(4, Math.max(1, week)) - 1) * 7 + 1;
  return Array.from({ length: 7 }, (_, i) =>
    sueToGregorian(year, period, start + i),
  );
}

export function nextPeriodRef(
  year: number,
  period: number,
): { year: number; period: number } {
  if (period >= 13) return { year: year + 1, period: 1 };
  return { year, period: period + 1 };
}

export function datesInYear(year: number): string[] {
  const count = daysInGregorianYear(year);
  return Array.from({ length: count }, (_, i) => dateFromDayOfYear(year, i + 1));
}

export function periodRangeLabel(year: number, period: number): {
  start: string;
  end: string;
} {
  return {
    start: sueToGregorian(year, period, 1),
    end: sueToGregorian(year, period, 28),
  };
}

export function formatSueLabel(date: CalendarDate): string {
  if (date.isYearDay) return `${date.sueYear} · Year Day`;
  if (date.isLeapDay) return `${date.sueYear} · Leap Day`;
  return `${date.sueYear} · ${date.suePeriodName} · día ${date.sueDayInPeriod} · semana ${date.sueWeekInPeriod}`;
}

export function formatGregorianLong(iso: string, locale = "es"): string {
  const { year, month, day } = parseISODate(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatGregorianShort(iso: string, locale = "es"): string {
  const { year, month, day } = parseISODate(iso);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
