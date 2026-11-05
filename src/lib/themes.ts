import type { ThemeId } from "./types";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  origin: string;
  scheme: "dark";
};

export const THEMES: ThemeMeta[] = [
  {
    id: "ancient-amethyst",
    label: "Ancient Amethyst",
    origin: "Default. Deep violet stone — the original SÚE purple, kept in the dark.",
    scheme: "dark",
  },
  {
    id: "ancient-wood",
    label: "Ancient Wood",
    origin: "Carved slab, warm grain, muted brass engraving.",
    scheme: "dark",
  },
  {
    id: "solarpunk-mecha",
    label: "Solarpunk Mecha",
    origin: "Night greenhouse HUD: moss, muted brass, technical hairlines.",
    scheme: "dark",
  },
  {
    id: "night-ritual",
    label: "Night Ritual",
    origin: "Darker starfield, quiet night observatory.",
    scheme: "dark",
  },
  {
    id: "moss-circuit",
    label: "Moss Circuit",
    origin: "Forest phosphor: deep green chassis with living circuit traces.",
    scheme: "dark",
  },
];

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((theme) => theme.id === value);
}

export function themeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
