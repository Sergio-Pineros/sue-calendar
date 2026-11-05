"use client";

import Link from "next/link";
import { useState } from "react";
import {
  addDays,
  formatGregorianLong,
  formatSueLabel,
  gregorianToSue,
} from "@/lib/sue-calendar";
import { moonLabel } from "@/lib/moon";
import { seasonLabel } from "@/lib/seasons";
import { eventsOnDate, newHabit, newRest } from "@/lib/storage";
import { cyclePosition } from "@/lib/cycles";
import { useSueStore } from "./StoreProvider";
import { MoonGlyph } from "./MoonGlyph";
import { SourceBadge } from "./SourceBadge";
import { EventComposer } from "./EventComposer";
import { copy } from "@/lib/copy";
import { weekdayLabel, weekdayNumber, formatWeekdayNumber } from "@/lib/weekdays";
import { activeSprintsOn, applySprintOverride, sprintIntensityOn } from "@/lib/sprints";
import type { SprintIntensity } from "@/lib/types";

export function DayView({ iso }: { iso: string }) {
  const { state, toggleHabit, addHabit, addRest, removeRest, removeHabit, updateSprint } =
    useSueStore();
  const [habitTitle, setHabitTitle] = useState("");
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const mapped = gregorianToSue(iso, naming);
  const events = state.settings.layers.events
    ? eventsOnDate(state.events, iso)
    : [];
  const rest = state.restBlocks.find((r) => r.date === iso);
  const number = weekdayNumber(mapped.weekdayIndex, state.settings);
  const sprints = activeSprintsOn(state.sprints, iso);

  return (
    <div className="space-y-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="display text-4xl">
            {formatGregorianLong(iso)}
          </h1>
          <p className="mt-2 text-ink-soft">{formatSueLabel(mapped)}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {weekdayLabel(mapped.weekdayIndex, state.settings)}
            {number !== null ? ` · ${formatWeekdayNumber(number)}` : ""}
          </p>
        </div>
        <div className="flex gap-2 font-mono text-sm">
          <Link
            href={`/day?iso=${addDays(iso, -1)}`}
            className="ghost-action"
          >
            ←
          </Link>
          <Link
            href={`/day?iso=${addDays(iso, 1)}`}
            className="ghost-action"
          >
            →
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InfoCard label={copy.day.gregorian} badge="fact">
          {iso} · {weekdayLabel(mapped.weekdayIndex, state.settings)}
        </InfoCard>
        <InfoCard label={copy.day.sue} badge="interpretation">
          {mapped.isSpecialDay
            ? mapped.suePeriodName
            : `${mapped.suePeriodName} · d${mapped.sueDayInPeriod} · w${mapped.sueWeekInPeriod}`}
        </InfoCard>
        <InfoCard label={copy.day.sky} badge="calculation">
          <span className="inline-flex items-center gap-2">
            {state.settings.layers.moon && (
              <>
                <MoonGlyph name={mapped.moon.name} />
                {moonLabel(mapped.moon.name)}
              </>
            )}
            {state.settings.layers.seasons && (
              <span className="text-ink-soft">
                · {seasonLabel(mapped.season)}
              </span>
            )}
          </span>
        </InfoCard>
      </div>

      {mapped.isYearDay && <p className="text-sm text-ink-soft">{copy.day.yearDay}</p>}
      {mapped.isLeapDay && <p className="text-sm text-ink-soft">{copy.day.leapDay}</p>}

      {sprints.length > 0 && (
        <section>
          <h2 className="display text-2xl">{copy.day.sprint}</h2>
          {sprints.map((sprint) => {
            const intensity = sprintIntensityOn(sprint, iso);
            return (
              <div key={sprint.id} className="mt-3 space-y-2">
                <p className={`font-medium intensity-${intensity}`}>
                  {sprint.title} · {intensity ? copy.intensity[intensity] : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(["push", "light", "rest"] as SprintIntensity[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className="ghost-action text-xs"
                      onClick={() =>
                        updateSprint(applySprintOverride(sprint, iso, key))
                      }
                    >
                      {copy.intensity[key]}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="ghost-action text-xs"
                    onClick={() =>
                      updateSprint(applySprintOverride(sprint, iso, undefined))
                    }
                  >
                    {copy.sprints.clearOverride}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {state.settings.layers.events && (
        <section>
          <h2 className="display text-2xl">{copy.day.events}</h2>
          {events.length === 0 ? (
            <p className="text-sm text-ink-soft">{copy.day.noEvents}</p>
          ) : (
            <ul className="space-y-2">
              {events.map((event) => (
                <li
                  key={event.id}
                  className="py-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{event.title}</p>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      {event.source} · {event.calendarName}
                    </span>
                  </div>
                  <p className="text-sm text-ink-soft">
                    {event.allDay ? copy.day.allDay : event.start.slice(11, 16)}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <EventComposer iso={iso} />

      {state.settings.layers.habits && (
        <section>
          <h2 className="display text-2xl">{copy.day.habits}</h2>
          <ul className="mt-3 space-y-2">
            {state.habits.map((habit) => (
              <li key={habit.id} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  checked={Boolean(habit.checkIns[iso])}
                  onChange={() => toggleHabit(habit.id, iso)}
                  className="size-4 accent-ink"
                />
                <span className="flex-1">{habit.title}</span>
                <button
                  type="button"
                  className="text-xs text-ink-soft"
                  onClick={() => removeHabit(habit.id)}
                >
                  {copy.day.remove}
                </button>
              </li>
            ))}
          </ul>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!habitTitle.trim()) return;
              addHabit(newHabit(habitTitle.trim()));
              setHabitTitle("");
            }}
          >
            <input
              value={habitTitle}
              onChange={(e) => setHabitTitle(e.target.value)}
              placeholder={copy.today.addHabit}
              className="ghost-input flex-1"
            />
            <button className="btn-fill rounded-full px-4 text-sm">
              {copy.today.add}
            </button>
          </form>
        </section>
      )}

      {state.settings.layers.rest && (
        <section>
          <h2 className="display text-2xl">{copy.day.rest}</h2>
          {rest ? (
            <button
              type="button"
              onClick={() => removeRest(rest.id)}
              className="ghost-action mt-2 text-rest"
            >
              {copy.day.unmarkRest}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => addRest(newRest(iso))}
              className="ghost-action mt-2"
            >
              {copy.day.markRest}
            </button>
          )}
        </section>
      )}

      {(rest ||
        sprints.some((sprint) => sprintIntensityOn(sprint, iso) === "rest")) && (
        <Link
          href="/tune?hz=432"
          className="display text-2xl"
        >
          {copy.day.restTone}
        </Link>
      )}

      {state.settings.layers.personal && state.personalCycles.length > 0 && (
        <section>
          <h2 className="display text-2xl">{copy.day.ownCycle}</h2>
          <SourceBadge type="personal" />
          <ul className="mt-2 space-y-1 text-sm">
            {state.personalCycles.map((cycle) => {
              const pos = cyclePosition(cycle, iso);
              return (
                <li key={cycle.id}>
                  {copy.day.cycleDay(cycle.name, pos.dayInCycle, cycle.length, pos.phase)}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {mapped.suePeriod && (
        <Link
          href={`/period/${mapped.suePeriod}`}
          className="inline-block text-brass underline-offset-4 hover:underline"
        >
          {copy.day.backToPeriod(mapped.suePeriodName)}
        </Link>
      )}
    </div>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  badge?: "fact" | "calculation" | "interpretation";
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2">
        <p className="text-xs text-ink-soft">
          {label}
        </p>
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
