"use client";

import Link from "next/link";
import { useState } from "react";
import { TodayStrip } from "@/components/TodayStrip";
import { YearWheel } from "@/components/YearWheel";
import { useSueStore } from "@/components/StoreProvider";
import {
  datesInWeek,
  gregorianToSue,
  todayISO,
} from "@/lib/sue-calendar";
import { eventsOnDate, weekLoad } from "@/lib/planning";
import { newHabit, newRest } from "@/lib/storage";
import { MoonGlyph } from "@/components/MoonGlyph";
import { isMajorMoonPhase } from "@/lib/moon";
import { weekdayShortLabel } from "@/lib/weekdays";
import { copy } from "@/lib/copy";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { suggestedTone } from "@/lib/frequency";

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
  const restToday = state.restBlocks.find((block) => block.date === today);
  const sprintToday = activeSprintsOn(state.sprints, today)[0];
  const intensity = sprintToday
    ? sprintIntensityOn(sprintToday, today)
    : null;
  const tone = suggestedTone({
    moon: mapped.moon.name,
    period: mapped.suePeriod,
    intensity,
    rest: Boolean(restToday),
  });

  return (
    <div className="space-y-10">
      <YearWheel compact hideChrome />
      <TodayStrip />

      {intensity && sprintToday && (
        <p className={`display text-3xl intensity-${intensity}`}>
          {copy.intensity[intensity]} · {sprintToday.title}
        </p>
      )}

      <section>
        {focus ? (
          <p className="display text-4xl">{focus.title}</p>
        ) : null}
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
            className="ghost-input flex-1"
          />
          <button className="ghost-action">{copy.today.save}</button>
        </form>
      </section>

      <div className="flex flex-wrap items-baseline gap-6">
        <Link href={`/tune?hz=${tone.hz}`} className="display text-3xl">
          {tone.label}
        </Link>
        {state.settings.layers.rest && (
          restToday ? (
            <button type="button" className="ghost-action" onClick={() => removeRest(restToday.id)}>
              {copy.today.unmarkRest}
            </button>
          ) : (
            <button type="button" className="ghost-action" onClick={() => addRest(newRest(today))}>
              {copy.today.markRest}
            </button>
          )
        )}
        {load.restDays > 0 && (
          <span className="text-sm text-ink-soft">{copy.today.restCount(load.restDays)}</span>
        )}
      </div>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="display text-3xl">
            {mapped.isSpecialDay ? mapped.suePeriodName : copy.today.weekOf(week)}
          </h2>
          <Link href={`/period/${period}`} className="text-sm text-ink-soft">
            {copy.today.fullPeriod}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-7">
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
                className={`day-cell ${
                  isToday ? "is-today" : rest || dayIntensity === "rest" ? "is-rest" : ""
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-ink-soft">
                  <span>{weekdayShortLabel(day.weekdayIndex, state.settings)}</span>
                  {state.settings.layers.moon &&
                    isMajorMoonPhase(day.moon.name) && (
                      <MoonGlyph name={day.moon.name} size={14} />
                    )}
                </div>
                <p className="mt-2 display text-2xl">{iso.slice(8)}</p>
                <p className="mt-2 text-[11px] opacity-70">
                  {count === 0 ? copy.today.free : copy.year.events(count)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {state.settings.layers.events && todayEvents.length > 0 && (
        <section>
          <p className="kicker">{copy.today.eventsToday}</p>
          <ul className="mt-3 space-y-3">
            {todayEvents.map((event) => (
              <li key={event.id} className="flex items-baseline justify-between gap-3">
                <p>{event.title}</p>
                <span className="text-sm text-ink-soft">{event.calendarName}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {state.settings.layers.habits && (
        <section>
          <p className="kicker">{copy.today.habits}</p>
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
              className="ghost-input flex-1"
            />
            <button className="ghost-action">{copy.today.add}</button>
          </form>
        </section>
      )}

      {week === 4 && !mapped.isSpecialDay && (
        <Link href="/reflect" className="display text-2xl">
          {copy.today.closePrompt}
        </Link>
      )}
    </div>
  );
}
