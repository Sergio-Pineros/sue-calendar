"use client";

import Link from "next/link";
import {
  datesInPeriod,
  formatGregorianShort,
  gregorianToSue,
  leapDayISO,
  periodRangeLabel,
  todayISO,
} from "@/lib/sue-calendar";
import { isMajorMoonPhase } from "@/lib/moon";
import { eventsOnDate } from "@/lib/planning";
import { periodColor } from "@/lib/palette";
import { useSueStore } from "./StoreProvider";
import { MoonGlyph } from "./MoonGlyph";
import { weekdayShortLabel, orderedWeekdayIndexes } from "@/lib/weekdays";
import { copy } from "@/lib/copy";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";

export function PeriodGrid({ period }: { period: number }) {
  const { state } = useSueStore();
  const year = state.settings.viewYear;
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const dates = datesInPeriod(year, period);
  const range = periodRangeLabel(year, period);
  const today = todayISO();
  const leap = leapDayISO(year);
  const weeks = [0, 1, 2, 3].map((w) => dates.slice(w * 7, w * 7 + 7));
  const labels = orderedWeekdayIndexes(gregorianToSue(dates[0], naming).weekdayIndex).map(
    (index) => weekdayShortLabel(index, state.settings),
  );
  const goal = state.goals.find(
    (g) => g.sueYear === year && g.suePeriod === period,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            {copy.period.of(period)}
          </p>
          <h1 className="display text-4xl">
            {gregorianToSue(dates[0], naming).suePeriodName}
          </h1>
          <p className="mt-1 text-ink-soft">
            {formatGregorianShort(range.start)} — {formatGregorianShort(range.end)} · {copy.period.fourWeeks}
          </p>
        </div>
        <div
          className="h-2 w-28 rounded-full"
          style={{ background: periodColor(period) }}
        />
      </div>

      {goal && state.settings.layers.goals && (
        <p className="hud-frame rounded-2xl px-4 py-3 text-sm">
          {copy.period.focus} <span className="font-medium">{goal.title}</span>
        </p>
      )}

      <div className="grid grid-cols-7 gap-2 text-center font-mono text-[11px] text-ink-soft">
        {labels.map((d, i) => (
          <div key={`${d}-${i}`}>{d}</div>
        ))}
      </div>

      <div className="space-y-3">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2">
            {week.map((iso) => {
              const mapped = gregorianToSue(iso, naming);
              const events = state.settings.layers.events
                ? eventsOnDate(state.events, iso)
                : [];
              const rest = state.settings.layers.rest
                ? state.restBlocks.some((r) => r.date === iso)
                : false;
              const isToday = iso === today;
              const sprint = activeSprintsOn(state.sprints, iso)[0];
              const intensity = sprint ? sprintIntensityOn(sprint, iso) : null;
              return (
                <Link
                  key={iso}
                  href={`/day/${iso}`}
                  className={`min-h-[92px] rounded-2xl border p-2 text-left ${
                    isToday
                      ? "border-ink bg-ink text-paper"
                      : rest || intensity === "rest"
                        ? "border-rest/40 bg-rest/10"
                        : "border-line bg-card/80 hover:border-ink/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs">{mapped.sueDayInPeriod}</span>
                    {state.settings.layers.moon && isMajorMoonPhase(mapped.moon.name) && (
                      <MoonGlyph name={mapped.moon.name} size={14} />
                    )}
                  </div>
                  <div className={`mt-1 text-[11px] ${isToday ? "text-paper/70" : "text-ink-soft"}`}>
                    {iso.slice(8)}
                  </div>
                  {events.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className="mt-1 truncate text-[10px] opacity-80"
                    >
                      {event.title}
                    </div>
                  ))}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {period === 6 && leap && (
        <Link
          href={`/day/${leap}`}
          className="block rounded-2xl border border-dashed border-brass px-4 py-3 text-sm"
        >
          {copy.period.leapAfter} · {leap}
        </Link>
      )}
    </div>
  );
}
