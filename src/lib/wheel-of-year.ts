import { gregorianDayOfYear } from "./iso-date";

export type Sabbat = {
  id: string;
  name: string;
  month: number;
  day: number;
  kind: "solstice" | "equinox" | "cross-quarter";
};

/**
 * Modern Wheel of the Year observances, Northern Hemisphere.
 * Cross-quarter dates follow the common contemporary calendar
 * (1 Feb, 1 May, 1 Aug, 1 Nov), not reconstructed Iron Age rites.
 */
export const SABBATS: Sabbat[] = [
  { id: "imbolc", name: "Imbolc", month: 2, day: 1, kind: "cross-quarter" },
  { id: "ostara", name: "Ostara", month: 3, day: 20, kind: "equinox" },
  { id: "beltane", name: "Beltane", month: 5, day: 1, kind: "cross-quarter" },
  { id: "litha", name: "Litha", month: 6, day: 21, kind: "solstice" },
  { id: "lughnasadh", name: "Lughnasadh", month: 8, day: 1, kind: "cross-quarter" },
  { id: "mabon", name: "Mabon", month: 9, day: 22, kind: "equinox" },
  { id: "samhain", name: "Samhain", month: 11, day: 1, kind: "cross-quarter" },
  { id: "yule", name: "Yule", month: 12, day: 21, kind: "solstice" },
];

export function sabbatsForYear(year: number): {
  id: string;
  name: string;
  iso: string;
  kind: Sabbat["kind"];
  dayOfYear: number;
}[] {
  return SABBATS.map((sabbat) => {
    const iso = `${year}-${String(sabbat.month).padStart(2, "0")}-${String(sabbat.day).padStart(2, "0")}`;
    return {
      id: sabbat.id,
      name: sabbat.name,
      iso,
      kind: sabbat.kind,
      dayOfYear: gregorianDayOfYear(year, sabbat.month, sabbat.day),
    };
  });
}
