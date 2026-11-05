"use client";

import Link from "next/link";
import { PeriodGrid } from "@/components/PeriodGrid";
import { LayerToggles } from "@/components/LayerToggles";
import { useSueStore } from "@/components/StoreProvider";
import { datesInWeek, gregorianToSue, periodName, todayISO } from "@/lib/sue-calendar";
import { weekLoad } from "@/lib/planning";
import { copy } from "@/lib/copy";
import { useState } from "react";

export function PeriodPage({ period }: { period: number }) {
  const { state, setPeriodFocus } = useSueStore();
  const [title, setTitle] = useState("");
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const prev = period === 1 ? 13 : period - 1;
  const next = period === 13 ? 1 : period + 1;
  const existing = state.goals.find(
    (g) =>
      g.sueYear === state.settings.viewYear &&
      g.suePeriod === period &&
      g.status !== "complete",
  );
  const today = gregorianToSue(todayISO(), naming);
  const isCurrent =
    today.sueYear === state.settings.viewYear && today.suePeriod === period;
  const weekDates = isCurrent && today.sueWeekInPeriod
    ? datesInWeek(today.sueYear, period, today.sueWeekInPeriod)
    : [];
  const load = weekLoad(state.events, weekDates, state.restBlocks);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/period/${prev}`} className="font-mono text-sm text-ink-soft">
          ← {periodName(prev, naming)}
        </Link>
        <Link href={`/period/${next}`} className="font-mono text-sm text-ink-soft">
          {periodName(next, naming)} →
        </Link>
      </div>
      <LayerToggles />
      {isCurrent && load.restDays === 0 && (
        <p className="hud-frame rounded-2xl px-4 py-3 text-sm text-ink-soft">
          {copy.period.noRest}
        </p>
      )}
      {isCurrent && load.overloaded && (
        <p className="rounded-2xl border border-year-day/40 bg-year-day/10 px-4 py-3 text-sm">
          {copy.period.overloaded}
        </p>
      )}
      <PeriodGrid period={period} />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setPeriodFocus(state.settings.viewYear, period, title.trim());
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            existing
              ? copy.period.replaceFocus(existing.title)
              : copy.period.placeholder
          }
          className="flex-1 rounded-full border border-line bg-card px-4 text-sm outline-none focus:border-ink"
        />
        <button className="rounded-full bg-ink px-4 text-sm text-paper">
          {copy.period.saveFocus}
        </button>
      </form>
      <p className="text-xs text-ink-soft">{copy.period.footnote}</p>
    </div>
  );
}
