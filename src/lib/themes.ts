import type { ThemeId } from "./types";

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  origin: string;
  scheme: "light" | "dark" | "system";
};

export const THEMES: ThemeMeta[] = [
  {
    id: "pearl-light",
    label: "Pearl light",
    origin: "Default. Warm cream, soft period color, and a moonlit pearl surface.",
    scheme: "light",
  },
  {
    id: "system",
    label: "Follow system",
    origin: "Light in the day, dark when your device asks for night.",
    scheme: "system",
  },
  {
    id: "ancient-amethyst",
    label: "Ancient Amethyst",
    origin: "Deep violet stone — the original SÚE purple, kept in the dark.",
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
