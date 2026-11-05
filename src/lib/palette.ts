export const PERIOD_COLORS = [
  "#2a1848",
  "#351e58",
  "#3f2468",
  "#4a2d78",
  "#563888",
  "#64449a",
  "#7354ac",
  "#8666be",
  "#9b7cd0",
  "#b396e0",
  "#c9b0ec",
  "#dcc6f4",
  "#efe0fa",
] as const;

export function periodColor(period: number): string {
  return PERIOD_COLORS[(period - 1 + 13) % 13];
}
