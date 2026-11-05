"use client";

import { useState } from "react";
import Link from "next/link";
import { useSueStore } from "./StoreProvider";
import {
  applySprintOverride,
  buildSprint,
  defaultSprintTitle,
  sprintCounts,
  SPRINT_STYLES,
  synodicHint,
} from "@/lib/sprints";
import { newSprint } from "@/lib/storage";
import { gregorianToSue, periodName, todayISO } from "@/lib/sue-calendar";
import { copy } from "@/lib/copy";
import { createGoogleEvent, googleClientId } from "@/lib/google-calendar";
import type { SprintIntensity, SprintStyle } from "@/lib/types";
import { YearWheel } from "./YearWheel";
import { HudFrame } from "./Hud";

export function SprintView() {
  const { state, addSprint, updateSprint, removeSprint, addEvent } = useSueStore();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = todayISO();
  const mapped = gregorianToSue(today, naming);
  const [title, setTitle] = useState("");
  const [style, setStyle] = useState<SprintStyle>("period");
  const [startDate, setStartDate] = useState(today);
  const [lengthDays, setLengthDays] = useState(28);
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");

  function create() {
    const built = buildSprint({
      title: title.trim() || defaultSprintTitle(style, startDate),
      style,
      startDate,
      lengthDays,
      deadline: deadline || null,
      year: mapped.sueYear,
      period: mapped.suePeriod,
    });
    addSprint(newSprint(built));
    setTitle("");
    setStatus("Sprint planned. Recommendations are a rhythm, not a forecast.");
  }

  async function pushSprint(id: string) {
    const sprint = state.sprints.find((item) => item.id === id);
    const calendarId = state.settings.selectedCalendarIds[0];
    if (!sprint || !calendarId || !googleClientId()) {
      setStatus("Connect Google in Settings to push sprint blocks.");
      return;
    }
    try {
      for (const day of sprint.days) {
        const intensity = day.override ?? day.recommended;
        const created = await createGoogleEvent(calendarId, {
          title: `[SÚE ${copy.intensity[intensity]}] ${sprint.title}`,
          description: day.note,
          start: day.date,
          end: day.date,
          allDay: true,
        });
        addEvent(created);
      }
      setStatus("Sprint blocks written to Google Calendar.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : copy.event.failed);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {copy.sprints.kicker}
        </p>
        <h1 className="display text-4xl">{copy.sprints.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">{copy.sprints.honesty}</p>
        <p className="mt-2 text-xs text-ink-soft">{synodicHint()}</p>
      </header>

      <YearWheel compact />

      <HudFrame label={copy.sprints.create}>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            create();
          }}
        >
          <label className="text-sm md:col-span-2">
            {copy.sprints.project}
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={copy.sprints.projectPlaceholder}
              className="mt-1 w-full rounded-full border border-line bg-paper px-4"
            />
          </label>
          <label className="text-sm">
            {copy.sprints.style}
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as SprintStyle)}
              className="mt-1 w-full rounded-full border border-line bg-paper px-4"
            >
              {SPRINT_STYLES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {copy.sprints.start}
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-1 w-full rounded-full border border-line bg-paper px-4"
            />
          </label>
          {style === "custom" && (
            <>
              <label className="text-sm">
                {copy.sprints.length}
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={lengthDays}
                  onChange={(event) => setLengthDays(Number(event.target.value))}
                  className="mt-1 w-full rounded-full border border-line bg-paper px-4"
                />
              </label>
              <label className="text-sm">
                {copy.sprints.deadline}
                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  className="mt-1 w-full rounded-full border border-line bg-paper px-4"
                />
              </label>
            </>
          )}
          <p className="text-xs text-ink-soft md:col-span-2">
            {SPRINT_STYLES.find((item) => item.id === style)?.origin}
          </p>
          <button className="rounded-full bg-ink px-4 text-sm text-paper md:col-span-2">
            {copy.sprints.plan}
          </button>
        </form>
      </HudFrame>

      {state.sprints.length === 0 && (
        <p className="text-sm text-ink-soft">{copy.sprints.empty}</p>
      )}

      {state.sprints.map((sprint) => {
        const counts = sprintCounts(sprint);
        return (
          <article key={sprint.id} className="hud-frame space-y-4 rounded-2xl p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="display text-3xl">{sprint.title}</h2>
                <p className="text-sm text-ink-soft">
                  {sprint.startDate} → {sprint.endDate} · {copy.sprints.days(sprint.days.length)} ·{" "}
                  {copy.sprints.counts(counts.push, counts.light, counts.rest)}
                </p>
                <p className="text-xs text-ink-soft">
                  {periodName(gregorianToSue(sprint.startDate, naming).suePeriod, naming)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-line px-3 text-xs"
                  onClick={() => pushSprint(sprint.id)}
                >
                  {copy.sprints.pushToCalendar}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-line px-3 text-xs"
                  onClick={() => removeSprint(sprint.id)}
                >
                  {copy.sprints.remove}
                </button>
              </div>
            </div>
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
                {copy.sprints.list}
              </p>
              <ol className="grid gap-1 sm:grid-cols-2">
                {sprint.days.map((day) => {
                  const intensity = day.override ?? day.recommended;
                  return (
                    <li
                      key={day.date}
                      className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-line px-3 text-sm"
                    >
                      <Link href={`/day/${day.date}`} className="min-w-0 flex-1">
                        <span className="font-mono text-xs">{day.date.slice(5)}</span>
                        <span className={`ml-2 intensity-${intensity}`}>
                          {copy.intensity[intensity]}
                        </span>
                        {day.override ? " *" : ""}
                      </Link>
                      <select
                        aria-label={copy.sprints.override}
                        value={intensity}
                        onChange={(event) =>
                          updateSprint(
                            applySprintOverride(
                              sprint,
                              day.date,
                              event.target.value as SprintIntensity,
                            ),
                          )
                        }
                        className="rounded-full border border-line bg-paper px-2 text-xs"
                      >
                        <option value="push">{copy.intensity.push}</option>
                        <option value="light">{copy.intensity.light}</option>
                        <option value="rest">{copy.intensity.rest}</option>
                      </select>
                    </li>
                  );
                })}
              </ol>
            </div>
          </article>
        );
      })}
      {status && <p className="text-sm text-brass">{status}</p>}
    </div>
  );
}
