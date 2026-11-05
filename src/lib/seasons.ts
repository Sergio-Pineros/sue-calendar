import type { SeasonName } from "./types";
import { gregorianDayOfYear, parseISODate } from "./iso-date";

export const SEASON_LABELS_ES: Record<SeasonName, string> = {
  winter: "Invierno",
  spring: "Primavera",
  summer: "Verano",
  autumn: "Otoño",
};

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
    { iso: `${year}-03-20`, kind: "equinox", name: "Equinoccio de marzo" },
    { iso: `${year}-06-21`, kind: "solstice", name: "Solsticio de junio" },
    { iso: `${year}-09-22`, kind: "equinox", name: "Equinoccio de septiembre" },
    { iso: `${year}-12-21`, kind: "solstice", name: "Solsticio de diciembre" },
  ];
}
