const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInGregorianYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

export function parseISODate(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    throw new Error(`Invalid ISO date: ${iso}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function todayISO(now = new Date()): string {
  return toISODate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function gregorianDayOfYear(year: number, month: number, day: number): number {
  let n = day;
  for (let i = 0; i < month - 1; i += 1) {
    n += i === 1 && isLeapYear(year) ? 29 : MONTH_DAYS[i];
  }
  return n;
}

export function dateFromDayOfYear(year: number, dayOfYear: number): string {
  const dim = MONTH_DAYS.map((d, i) =>
    i === 1 && isLeapYear(year) ? 29 : d,
  );
  let remaining = dayOfYear;
  for (let month = 1; month <= 12; month += 1) {
    const days = dim[month - 1];
    if (remaining <= days) {
      return toISODate(year, month, remaining);
    }
    remaining -= days;
  }
  throw new Error(`Day ${dayOfYear} is out of range for ${year}`);
}

export function addDays(iso: string, amount: number): string {
  const { year, month, day } = parseISODate(iso);
  const utc = Date.UTC(year, month - 1, day + amount);
  const next = new Date(utc);
  return toISODate(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseISODate(fromIso);
  const b = parseISODate(toIso);
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  );
}

export function weekdayIndex(iso: string): number {
  const { year, month, day } = parseISODate(iso);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
