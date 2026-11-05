"use client";

import Link from "next/link";
import { useState } from "react";
import { YearWheel } from "@/components/YearWheel";
import { LayerToggles } from "@/components/LayerToggles";
import { useSueStore } from "@/components/StoreProvider";
import {
  datesInPeriod,
  gregorianToSue,
  periodName,
  periodRangeLabel,
  todayISO,
} from "@/lib/sue-calendar";
import { eventsOnDate } from "@/lib/planning";

export function YearHome() {
  const { state, setPeriodFocus } = useSueStore();
  const year = state.settings.viewYear;
  const today = gregorianToSue(todayISO(), state.settings.naming);
  const [goalTitle, setGoalTitle] = useState("");
  const currentPeriod = today.sueYear === year ? today.suePeriod : 1;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            Mapa del año
          </p>
          <h1 className="display text-4xl">{year}</h1>
        </div>
        <LayerToggles />
      </div>
      <p className="mb-6 max-w-xl text-sm text-ink-soft">
        28 días no son un mes lunar. Las fases de la Luna van encima, como
        cálculo, no como nombre del periodo.
      </p>
      <YearWheel />

      <section className="mt-12 grid gap-3 md:grid-cols-2">
        {Array.from({ length: 13 }, (_, i) => {
          const period = i + 1;
          const range = periodRangeLabel(year, period);
          const dates = datesInPeriod(year, period);
          const count = dates.reduce(
            (n, iso) => n + eventsOnDate(state.events, iso).length,
            0,
          );
          const goal = state.goals.find(
            (g) => g.sueYear === year && g.suePeriod === period && g.status !== "complete",
          );
          const active = currentPeriod === period;
          return (
            <Link
              key={period}
              href={`/period/${period}`}
              className={`rounded-2xl border px-4 py-3 ${
                active ? "border-ink bg-ink text-paper" : "border-line bg-card/70"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <p className="display text-2xl">
                  {periodName(period, state.settings.naming)}
                </p>
                <span className="font-mono text-xs opacity-70">{period}/13</span>
              </div>
              <p className={`text-sm ${active ? "text-paper/70" : "text-ink-soft"}`}>
                {range.start.slice(5)} → {range.end.slice(5)} · {count} eventos
                {goal ? ` · ${goal.title}` : ""}
              </p>
            </Link>
          );
        })}
      </section>

      {currentPeriod && (
        <form
          className="mt-10 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!goalTitle.trim()) return;
            setPeriodFocus(year, currentPeriod, goalTitle.trim());
            setGoalTitle("");
          }}
        >
          <input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder={`Foco para ${periodName(currentPeriod, state.settings.naming)}`}
            className="flex-1 rounded-full border border-line bg-card px-4 py-2 text-sm outline-none focus:border-ink"
          />
          <button className="rounded-full bg-ink px-4 py-2 text-sm text-paper">
            Fijar meta del periodo
          </button>
        </form>
      )}
    </div>
  );
}
