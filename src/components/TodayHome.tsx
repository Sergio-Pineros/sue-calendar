"use client";

import Link from "next/link";
import { useState } from "react";
import { YearWheel } from "@/components/YearWheel";
import { useSueStore } from "@/components/StoreProvider";
import {
  datesInWeek,
  formatGregorianLong,
  formatSueLabel,
  gregorianToSue,
  todayISO,
} from "@/lib/sue-calendar";
import { eventsOnDate } from "@/lib/planning";
import { newHabit, newRest } from "@/lib/storage";
import { MoonGlyph } from "@/components/MoonGlyph";
import { isMajorMoonPhase } from "@/lib/moon";
import { moonLabel } from "@/lib/moon";
import { seasonLabel } from "@/lib/seasons";
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
  const [open, setOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
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
    <div className="home">
      <YearWheel compact hideChrome />

      <button
        type="button"
        className="home-date display"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {formatGregorianLong(today)}
      </button>

      {open && (
        <div className="home-detail">
          <p>{formatSueLabel(mapped)}</p>
          <p>
            {state.settings.layers.moon && (
              <span className="mr-3 inline-flex items-center gap-2">
                <MoonGlyph name={mapped.moon.name} size={14} />
                {moonLabel(mapped.moon.name)}
              </span>
            )}
            {state.settings.layers.seasons && (
              <span className="mr-3">{seasonLabel(mapped.season)}</span>
            )}
            {mapped.suePeriod && (
              <Link href={`/period/${mapped.suePeriod}`}>{mapped.suePeriodName}</Link>
            )}
          </p>

          {intensity && sprintToday && (
            <p className={`display text-2xl intensity-${intensity}`}>
              {copy.intensity[intensity]} · {sprintToday.title}
            </p>
          )}

          {focus && <p className="display text-3xl text-ink">{focus.title}</p>}

          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="display text-2xl text-ink">
                {mapped.isSpecialDay ? mapped.suePeriodName : copy.today.weekOf(week)}
              </h2>
              <Link href={`/period/${period}`}>{copy.today.fullPeriod}</Link>
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
                    href={`/day?iso=${iso}`}
                    className={`day-cell ${
                      isToday ? "is-today" : rest || dayIntensity === "rest" ? "is-rest" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{weekdayShortLabel(day.weekdayIndex, state.settings)}</span>
                      {state.settings.layers.moon &&
                        isMajorMoonPhase(day.moon.name) && (
                          <MoonGlyph name={day.moon.name} size={14} />
                        )}
                    </div>
                    <p className="mt-2 display text-2xl text-ink">{iso.slice(8)}</p>
                    <p className="mt-2 text-[11px] opacity-70">
                      {count === 0 ? copy.today.free : copy.year.events(count)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          {state.settings.layers.events && todayEvents.length > 0 && (
            <ul className="space-y-3">
              {todayEvents.map((event) => (
                <li key={event.id} className="flex items-baseline justify-between gap-3">
                  <p className="text-ink">{event.title}</p>
                  <span>{event.calendarName}</span>
                </li>
              ))}
            </ul>
          )}

          {state.settings.layers.habits && (
            <section>
              <ul className="space-y-2">
                {state.habits.map((habit) => (
                  <li key={habit.id} className="flex min-h-11 items-center gap-3">
                    <input
                      type="checkbox"
                      checked={Boolean(habit.checkIns[today])}
                      onChange={() => toggleHabit(habit.id, today)}
                      className="size-4 accent-ink"
                    />
                    <span className="text-ink">{habit.title}</span>
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
            <Link href="/reflect" className="display text-2xl text-ink">
              {copy.today.closePrompt}
            </Link>
          )}
        </div>
      )}

      {focusOpen && (
        <form
          className="home-detail"
          onSubmit={(event) => {
            event.preventDefault();
            if (!focusTitle.trim()) return;
            setPeriodFocus(mapped.sueYear, period, focusTitle.trim());
            setFocusTitle("");
            setFocusOpen(false);
          }}
        >
          <input
            value={focusTitle}
            onChange={(event) => setFocusTitle(event.target.value)}
            placeholder={focus ? copy.today.changeFocus : copy.today.focusPlaceholder}
            className="ghost-input"
            autoFocus
          />
          <button className="ghost-action">{copy.today.save}</button>
        </form>
      )}

      <nav className="home-actions" aria-label={copy.nav.today}>
        {state.settings.layers.rest && (
          restToday ? (
            <button type="button" onClick={() => removeRest(restToday.id)}>
              {copy.today.clear}
            </button>
          ) : (
            <button type="button" onClick={() => addRest(newRest(today))}>
              {copy.today.rest}
            </button>
          )
        )}
        <button type="button" onClick={() => setFocusOpen((value) => !value)}>
          {copy.today.focusAction}
        </button>
        <Link href={`/tune?hz=${tone.hz}`}>{copy.nav.tune}</Link>
      </nav>
    </div>
  );
}
