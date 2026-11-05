export const PERIOD_COLORS = [
  "var(--period-1)",
  "var(--period-2)",
  "var(--period-3)",
  "var(--period-4)",
  "var(--period-5)",
  "var(--period-6)",
  "var(--period-7)",
  "var(--period-8)",
  "var(--period-9)",
  "var(--period-10)",
  "var(--period-11)",
  "var(--period-12)",
  "var(--period-13)",
] as const;

export function periodColor(period: number): string {
  return PERIOD_COLORS[(period - 1 + 13) % 13];
}
