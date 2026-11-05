"use client";

import Link from "next/link";
import { useState } from "react";
import { TodayStrip } from "@/components/TodayStrip";
import { YearWheel } from "@/components/YearWheel";
import { useSueStore } from "@/components/StoreProvider";
import {
  datesInWeek,
  formatGregorianShort,
  gregorianToSue,
  periodName,
  todayISO,
} from "@/lib/sue-calendar";
import {
  eventTimeLabel,
  eventsOnDate,
  hasLiveCalendar,
  weekLoad,
} from "@/lib/planning";
import { newHabit, newRest } from "@/lib/storage";
import { MoonGlyph } from "@/components/MoonGlyph";
import { isMajorMoonPhase } from "@/lib/moon";
import { weekdayShortLabel } from "@/lib/weekdays";
import { copy } from "@/lib/copy";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { HudFrame } from "./Hud";

export function TodayHome() {
  const {
    state,
    setPeriodFocus,
    toggleHabit,
    addHabit,
    addRest,
    removeRest,
  } = useSueStore();
  const [focusTitle, setFocusTitle] = useState("");
  const [habitTitle, setHabitTitle] = useState("");
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = todayISO();
  const mapped = gregorianToSue(today, naming);
  const period = mapped.suePeriod ?? 1;
  const week = mapped.sueWeekInPeriod ?? 1;
  const dates = mapped.isSpecialDay
    ? [today]
    : datesInWeek(mapped.sueYear, period, week);
  const load = weekLoad(state.events, dates, state.restBlocks);
  const focus = state.goals.find(
    (goal) =>
      goal.sueYear === mapped.sueYear &&
      goal.suePeriod === period &&
      goal.status !== "complete",
  );
  const todayEvents = state.settings.layers.events
    ? eventsOnDate(state.events, today)
    : [];
  const live = hasLiveCalendar(state.events);
  const restToday = state.restBlocks.find((block) => block.date === today);
  const sprintToday = activeSprintsOn(state.sprints, today)[0];
  const intensity = sprintToday
    ? sprintIntensityOn(sprintToday, today)
    : null;

  return (
    <div className="space-y-8">
      <YearWheel compact />
      <TodayStrip />

      {!live && (
        <p className="hud-frame rounded-2xl px-4 py-3 text-sm text-ink-soft">
          {copy.today.demoBanner}{" "}
          <Link href="/settings" className="text-brass underline-offset-4 hover:underline">
            {copy.today.connect}
          </Link>
        </p>
      )}

      {intensity && sprintToday && (
        <HudFrame label={copy.sprints.active}>
          <p className={`display text-2xl intensity-${intensity}`}>
            {copy.intensity[intensity]} · {sprintToday.title}
          </p>
        </HudFrame>
      )}

      <HudFrame label={copy.today.focus}>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {periodName(period, naming)}
        </p>
        {focus ? (
          <p className="display mt-2 text-3xl">{focus.title}</p>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">{copy.today.focusHint}</p>
        )}
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!focusTitle.trim()) return;
            setPeriodFocus(mapped.sueYear, period, focusTitle.trim());
            setFocusTitle("");
          }}
        >
          <input
            value={focusTitle}
            onChange={(event) => setFocusTitle(event.target.value)}
            placeholder={focus ? copy.today.changeFocus : copy.today.focusPlaceholder}
            className="flex-1 rounded-full border border-line bg-paper px-4 text-sm outline-none focus:border-ink"
          />
          <button className="rounded-full bg-ink px-4 text-sm text-paper">
            {copy.today.save}
          </button>
        </form>
      </HudFrame>

      {state.settings.layers.rest && (
        <HudFrame label={copy.today.restFirst}>
          <p className="text-sm">
            {load.restDays === 0
              ? copy.today.noRest
              : copy.today.restCount(load.restDays)}
          </p>
          {restToday ? (
            <button
              type="button"
              className="mt-3 rounded-full border border-rest px-4 text-sm text-rest"
              onClick={() => removeRest(restToday.id)}
            >
              {copy.today.unmarkRest}
            </button>
          ) : (
            <button
              type="button"
              className="mt-3 rounded-full border border-line px-4 text-sm"
              onClick={() => addRest(newRest(today))}
            >
              {copy.today.markRest}
            </button>
          )}
        </HudFrame>
      )}

      {load.overloaded && (
        <p className="rounded-2xl border border-year-day/40 bg-year-day/10 px-4 py-3 text-sm">
          {copy.today.overloaded(load.total)}
        </p>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
              {copy.today.thisWeek}
            </p>
            <h2 className="display text-3xl">
              {mapped.isSpecialDay
                ? mapped.suePeriodName
                : copy.today.weekOf(week)}
            </h2>
          </div>
          <Link
            href={`/period/${period}`}
            className="text-sm text-brass underline-offset-4 hover:underline"
          >
            {copy.today.fullPeriod}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
          {dates.map((iso) => {
            const day = gregorianToSue(iso, naming);
            const count = eventsOnDate(state.events, iso).length;
            const rest = state.restBlocks.some((block) => block.date === iso);
            const isToday = iso === today;
            const dayIntensity = sprintToday
              ? sprintIntensityOn(sprintToday, iso)
              : null;
            return (
              <Link
                key={iso}
                href={`/day/${iso}`}
                className={`min-h-[110px] rounded-2xl border p-3 ${
                  isToday
                    ? "border-ink bg-ink text-paper"
                    : rest || dayIntensity === "rest"
                      ? "border-rest/40 bg-rest/10"
                      : "border-line bg-card/80 hover:border-ink/40"
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span>{weekdayShortLabel(day.weekdayIndex, state.settings)}</span>
                  {state.settings.layers.moon &&
                    isMajorMoonPhase(day.moon.name) && (
                      <MoonGlyph name={day.moon.name} size={14} />
                    )}
                </div>
                <p className="mt-2 text-lg">{iso.slice(8)}</p>
                <p className={`text-[11px] ${isToday ? "text-paper/70" : "text-ink-soft"}`}>
                  {formatGregorianShort(iso)}
                </p>
                <p className="mt-2 text-[11px] opacity-80">
                  {count === 0 ? copy.today.free : copy.year.events(count)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {state.settings.layers.events && (
        <section>
          <h2 className="display text-2xl">{copy.today.eventsToday}</h2>
          {todayEvents.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">{copy.today.noEvents}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {todayEvents.map((event) => (
                <li
                  key={event.id}
                  className="hud-frame rounded-2xl px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{event.title}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      {eventTimeLabel(event)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">{event.calendarName}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {state.settings.layers.habits && (
        <section>
          <h2 className="display text-2xl">{copy.today.habits}</h2>
          <ul className="mt-3 space-y-2">
            {state.habits.map((habit) => (
              <li key={habit.id} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(habit.checkIns[today])}
                  onChange={() => toggleHabit(habit.id, today)}
                  className="size-4 accent-ink"
                />
                <span>{habit.title}</span>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!habitTitle.trim()) return;
              addHabit(newHabit(habitTitle.trim()));
              setHabitTitle("");
            }}
          >
            <input
              value={habitTitle}
              onChange={(event) => setHabitTitle(event.target.value)}
              placeholder={copy.today.addHabit}
              className="flex-1 rounded-full border border-line bg-card px-4 text-sm outline-none focus:border-ink"
            />
            <button className="rounded-full bg-ink px-4 text-sm text-paper">
              {copy.today.add}
            </button>
          </form>
        </section>
      )}

      {week === 4 && !mapped.isSpecialDay && (
        <Link
          href="/reflect"
          className="block rounded-2xl border border-brass/40 px-4 py-3 text-sm"
        >
          {copy.today.closePrompt}
        </Link>
      )}

      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/year" className="text-brass underline-offset-4 hover:underline">
          {copy.today.yearMap}
        </Link>
        <Link href="/research" className="text-ink-soft underline-offset-4 hover:underline">
          {copy.today.whatIs}
        </Link>
      </div>
    </div>
  );
}
