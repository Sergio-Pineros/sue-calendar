import type { SeasonName } from "./types";
import { gregorianDayOfYear, parseISODate } from "./iso-date";
import { copy } from "./copy";

export const SEASON_LABELS = copy.seasons;

export function seasonLabel(name: SeasonName): string {
  return SEASON_LABELS[name];
}

export function seasonForDate(iso: string): {
  season: SeasonName;
  marker: "solstice" | "equinox" | null;
} {
  const { year, month, day } = parseISODate(iso);
  const doy = gregorianDayOfYear(year, month, day);
  const spring = gregorianDayOfYear(year, 3, 20);
  const summer = gregorianDayOfYear(year, 6, 21);
  const autumn = gregorianDayOfYear(year, 9, 22);
  const winter = gregorianDayOfYear(year, 12, 21);

  let marker: "solstice" | "equinox" | null = null;
  if ((month === 3 && day === 20) || (month === 9 && day === 22)) {
    marker = "equinox";
  }
  if ((month === 6 && day === 21) || (month === 12 && day === 21)) {
    marker = "solstice";
  }

  let season: SeasonName = "winter";
  if (doy >= spring && doy < summer) season = "spring";
  else if (doy >= summer && doy < autumn) season = "summer";
  else if (doy >= autumn && doy < winter) season = "autumn";

  return { season, marker };
}

export function seasonMarkers(year: number): {
  iso: string;
  kind: "solstice" | "equinox";
  name: string;
}[] {
  return [
    { iso: `${year}-03-20`, kind: "equinox", name: copy.seasons.marchEquinox },
    { iso: `${year}-06-21`, kind: "solstice", name: copy.seasons.juneSolstice },
    { iso: `${year}-09-22`, kind: "equinox", name: copy.seasons.septemberEquinox },
    { iso: `${year}-12-21`, kind: "solstice", name: copy.seasons.decemberSolstice },
  ];
}
