"use client";

import Link from "next/link";
import { PeriodGrid } from "@/components/PeriodGrid";
import { LayerToggles } from "@/components/LayerToggles";
import { useSueStore } from "@/components/StoreProvider";
import { datesInWeek, gregorianToSue, periodName, todayISO } from "@/lib/sue-calendar";
import { weekLoad } from "@/lib/planning";
import { useState } from "react";

export function PeriodPage({ period }: { period: number }) {
  const { state, setPeriodFocus } = useSueStore();
  const [title, setTitle] = useState("");
  const prev = period === 1 ? 13 : period - 1;
  const next = period === 13 ? 1 : period + 1;
  const existing = state.goals.find(
    (g) =>
      g.sueYear === state.settings.viewYear &&
      g.suePeriod === period &&
      g.status !== "complete",
  );
  const today = gregorianToSue(todayISO(), state.settings.naming);
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
          ← {periodName(prev, state.settings.naming)}
        </Link>
        <Link href={`/period/${next}`} className="font-mono text-sm text-ink-soft">
          {periodName(next, state.settings.naming)} →
        </Link>
      </div>
      <LayerToggles />
      {isCurrent && load.restDays === 0 && (
        <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm text-ink-soft">
          Esta semana no tiene descanso. Márcalo en Hoy antes de llenar el periodo.
        </p>
      )}
      {isCurrent && load.overloaded && (
        <p className="rounded-2xl border border-year-day/40 bg-year-day/10 px-4 py-3 text-sm">
          La semana actual está densa. El overlay no pide que quepa más.
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
              ? `Sustituir foco: ${existing.title}`
              : "Una meta para estas cuatro semanas"
          }
          className="flex-1 rounded-full border border-line bg-card px-4 py-2 text-sm outline-none focus:border-ink"
        />
        <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
          Guardar foco
        </button>
      </form>
      <p className="text-xs text-ink-soft">
        Un periodo es un sprint de planificación. No es un mes lunar.
      </p>
    </div>
  );
}
