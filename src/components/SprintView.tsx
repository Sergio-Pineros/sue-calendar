"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSueStore } from "./StoreProvider";
import {
  applySprintOverride,
  buildSprint,
  cycleSprintIntensity,
  defaultSprintTitle,
  sprintCounts,
  sprintIntensityOn,
  SPRINT_STYLES,
} from "@/lib/sprints";
import { newSprint } from "@/lib/storage";
import { addDays, gregorianToSue, periodName, todayISO } from "@/lib/sue-calendar";
import { copy } from "@/lib/copy";
import { createGoogleEvent, googleClientId } from "@/lib/google-calendar";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { Sprint, SprintIntensity, SprintStyle } from "@/lib/types";

const GLYPH: Record<SprintStyle, string> = {
  "lunar-full": "( @ )",
  "lunar-waxing": "  |) ",
  "lunar-waning": " (|  ",
  period: "[IIII]",
  seasonal: " /\\\\ ",
  custom: " + + ",
};

function intensityColor(intensity: SprintIntensity): string {
  if (intensity === "push") return "var(--year-day)";
  if (intensity === "light") return "var(--brass)";
  return "var(--rest)";
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function wedge(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  return `M ${p0.x} ${p0.y} A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
}

function SprintRing({
  sprint,
  focus,
  onPick,
}: {
  sprint: Sprint;
  focus: string;
  onPick: (date: string) => void;
}) {
  const cx = 200;
  const cy = 200;
  const n = Math.max(1, sprint.days.length);
  const sweep = 360 / n;
  const lunar = sprint.style.startsWith("lunar");

  return (
    <svg viewBox="0 0 400 400" className="sprint-ring mx-auto w-full max-w-[420px]" role="img" aria-label={sprint.title}>
      <defs>
        <radialGradient id="sprint-stone" cx="50%" cy="42%" r="58%">
          <stop offset="0%" stopColor="var(--wood)" />
          <stop offset="70%" stopColor="var(--wood-deep)" />
          <stop offset="100%" stopColor="var(--paper-deep)" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={198} fill="url(#sprint-stone)" />
      <circle cx={cx} cy={cy} r={196} fill="none" stroke="var(--brass)" strokeWidth="8" opacity="0.55" />
      <circle cx={cx} cy={cy} r={188} fill="none" stroke="var(--engrave)" strokeWidth="2" />
      {sprint.days.map((day, index) => {
        const intensity = sprintIntensityOn(sprint, day.date) ?? day.recommended;
        const a0 = index * sweep + 0.45;
        const a1 = (index + 1) * sweep - 0.45;
        const active = day.date === focus;
        const mid = polar(cx, cy, 148, (a0 + a1) / 2);
        return (
          <g key={day.date}>
            <path
              d={wedge(cx, cy, 104, 178, a0, a1)}
              fill={`color-mix(in oklab, ${intensityColor(intensity)} 38%, var(--paper-deep))`}
              fillOpacity={active ? 1 : intensity === "rest" ? 0.7 : 0.88}
              stroke={active ? "var(--ink)" : "color-mix(in oklab, var(--paper-deep) 35%, transparent)"}
              strokeWidth={active ? 2.2 : 0.4}
              className="cursor-pointer"
              onClick={() => onPick(day.date)}
            />
            {n <= 36 && (
              <text
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--ink)"
                style={{ fontSize: 9, fontWeight: 500, letterSpacing: "0.02em" }}
                className="pointer-events-none"
              >
                {day.date.slice(8)}
              </text>
            )}
          </g>
        );
      })}
      {lunar && (
        <path
          d="M44 200 A156 156 0 0 1 356 200"
          fill="none"
          stroke="var(--lunar)"
          strokeWidth="2.4"
          strokeOpacity="0.7"
        />
      )}
      <circle cx={cx} cy={cy} r={94} fill="var(--paper-deep)" stroke="var(--engrave)" strokeWidth="1.2" />
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="var(--brass)"
        style={{ fontSize: 13, letterSpacing: "0.14em", fontWeight: 500 }}
      >
        {GLYPH[sprint.style]}
      </text>
      <text
        x={cx}
        y={cy + 18}
        textAnchor="middle"
        fill="var(--ink)"
        style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.03em" }}
      >
        {copy.sprints.days(sprint.days.length)}
      </text>
    </svg>
  );
}

function SprintSheet({
  sprint,
  onClose,
}: {
  sprint: Sprint;
  onClose: () => void;
}) {
  const { updateSprint, removeSprint, addEvent, state } = useSueStore();
  const reduced = usePrefersReducedMotion();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const live = state.sprints.find((item) => item.id === sprint.id) ?? sprint;
  const [phase, setPhase] = useState<"enter" | "open" | "leave">("enter");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [focus, setFocus] = useState(live.days[0]?.date ?? live.startDate);
  const [status, setStatus] = useState("");
  const draggingRef = useRef(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.requestAnimationFrame(() => setPhase("open"));
    return () => {
      document.body.style.overflow = previous;
      window.cancelAnimationFrame(id);
    };
  }, []);

  function dismiss() {
    setPhase("leave");
    window.setTimeout(onClose, reduced ? 0 : 420);
  }

  function onHandleDown(event: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    setDragging(true);
    startY.current = event.clientY;
    lastY.current = event.clientY;
    lastT.current = performance.now();
    velocity.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onHandleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const next = Math.max(0, event.clientY - startY.current);
    const now = performance.now();
    const dt = Math.max(8, now - lastT.current);
    velocity.current = ((event.clientY - lastY.current) / dt) * 1000;
    lastY.current = event.clientY;
    lastT.current = now;
    setDragY(next);
  }

  function onHandleUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (dragY > 88 || velocity.current > 900) {
      dismiss();
      return;
    }
    setDragY(0);
  }

  function cycleDay(date: string) {
    const day = live.days.find((item) => item.date === date);
    if (!day) return;
    setFocus(date);
    updateSprint(applySprintOverride(live, date, cycleSprintIntensity(day)));
  }

  function rebuild(patch: { startDate?: string; lengthDays?: number; title?: string }) {
    const built = buildSprint({
      title: patch.title ?? live.title,
      style: live.style,
      startDate: patch.startDate ?? live.startDate,
      lengthDays: patch.lengthDays ?? live.days.length,
      deadline: live.deadline,
    });
    updateSprint({
      ...live,
      ...built,
      title: patch.title ?? live.title,
    });
    setFocus(built.days[0]?.date ?? built.startDate);
  }

  async function pushSprint() {
    const calendarId = state.settings.selectedCalendarIds[0];
    if (!calendarId || !googleClientId()) {
      setStatus("Connect Google in Settings to push sprint blocks.");
      return;
    }
    try {
      for (const day of live.days) {
        const intensity = day.override ?? day.recommended;
        const created = await createGoogleEvent(calendarId, {
          title: `[SÚE ${copy.intensity[intensity]}] ${live.title}`,
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

  const focused = live.days.find((day) => day.date === focus) ?? live.days[0];
  const intensity = focused ? (focused.override ?? focused.recommended) : "light";
  const counts = sprintCounts(live);
  const mapped = gregorianToSue(live.startDate, naming);
  const transition = dragging || reduced
    ? "none"
    : "transform 520ms cubic-bezier(0.22, 1.35, 0.36, 1), opacity 320ms ease";
  const translate =
    phase === "open" ? `translateY(${dragY}px)` : "translateY(100%)";

  const sheet = (
    <div className="sprint-sheet" role="dialog" aria-modal="true" aria-label={live.title}>
      <button
        type="button"
        className={`sprint-sheet-backdrop ${phase === "open" ? "is-open" : ""}`}
        aria-label={copy.sprints.close}
        onClick={dismiss}
      />
      <div
        className={`sprint-sheet-panel ${phase === "open" ? "is-open" : ""}`}
        style={{ transform: translate, transition }}
      >
        <div
          className="sprint-sheet-handle"
          onPointerDown={onHandleDown}
          onPointerMove={onHandleMove}
          onPointerUp={onHandleUp}
          onPointerCancel={onHandleUp}
        >
          <span />
          <p>{copy.sprints.dismiss}</p>
        </div>
        <div className="sprint-sheet-body">
          <input
            value={live.title}
            onChange={(event) => updateSprint({ ...live, title: event.target.value })}
            aria-label={copy.sprints.project}
            className="sprint-ghost-input display w-full text-4xl"
          />
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            {SPRINT_STYLES.find((item) => item.id === live.style)?.label} · {live.startDate} → {live.endDate}
          </p>
          <p className="text-sm text-ink-soft">
            {periodName(mapped.suePeriod, naming)} · {copy.sprints.counts(counts.push, counts.light, counts.rest)}
          </p>

          {live.style === "custom" && (
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button type="button" className="sprint-step" onClick={() => rebuild({ startDate: addDays(live.startDate, -1) })}>
                {copy.sprints.earlier}
              </button>
              <button type="button" className="sprint-step" onClick={() => rebuild({ startDate: addDays(live.startDate, 1) })}>
                {copy.sprints.later}
              </button>
              <button
                type="button"
                className="sprint-step"
                onClick={() => rebuild({ lengthDays: Math.max(1, live.days.length - 1) })}
              >
                {copy.sprints.shorter}
              </button>
              <button
                type="button"
                className="sprint-step"
                onClick={() => rebuild({ lengthDays: Math.min(120, live.days.length + 1) })}
              >
                {copy.sprints.longer}
              </button>
            </div>
          )}

          <div className="mt-6">
            <SprintRing sprint={live} focus={focus} onPick={cycleDay} />
          </div>

          {focused && (
            <div className="mt-4 text-center">
              <Link href={`/day?iso=${focused.date}`} className="display text-3xl">
                {focused.date}
              </Link>
              <button
                type="button"
                className={`mt-2 block w-full font-mono text-sm uppercase tracking-[0.18em] intensity-${intensity}`}
                onClick={() => cycleDay(focused.date)}
              >
                {copy.intensity[intensity]}
                {focused.override ? " · override" : ""}
              </button>
              <p className="mt-2 text-sm text-ink-soft">{focused.note}</p>
              <p className="mt-3 font-mono text-[11px] text-ink-soft">{copy.sprints.tapDay}</p>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <button type="button" className="sprint-action" onClick={pushSprint}>
              {copy.sprints.pushToCalendar}
            </button>
            <button
              type="button"
              className="sprint-action is-quiet"
              onClick={() => {
                removeSprint(live.id);
                dismiss();
              }}
            >
              {copy.sprints.remove}
            </button>
            {status && <p className="text-center text-sm text-brass">{status}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}

export function SprintView() {
  const { state, addSprint } = useSueStore();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = todayISO();
  const mapped = gregorianToSue(today, naming);
  const [openId, setOpenId] = useState<string | null>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function openStyle(style: SprintStyle) {
    const built = buildSprint({
      title: defaultSprintTitle(style, today),
      style,
      startDate: today,
      lengthDays: 28,
      year: mapped.sueYear,
      period: mapped.suePeriod,
    });
    const created = newSprint(built);
    addSprint(created);
    setOpenId(created.id);
  }

  const open = state.sprints.find((item) => item.id === openId) ?? null;

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {copy.sprints.kicker}
        </p>
        <h1 className="display text-4xl">{copy.sprints.title}</h1>
      </header>

      <section>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {copy.sprints.pick}
        </p>
        <div className="sprint-picker">
          {SPRINT_STYLES.map((item) => (
            <button
              key={item.id}
              type="button"
              className="sprint-tile"
              onClick={() => openStyle(item.id)}
            >
              <span className="sprint-glyph" aria-hidden>
                {GLYPH[item.id]}
              </span>
              <span className="display text-2xl leading-none">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {copy.sprints.yours}
        </p>
        {state.sprints.length === 0 && (
          <p className="text-sm text-ink-soft">{copy.sprints.empty}</p>
        )}
        <div className="space-y-2">
          {state.sprints.map((sprint) => {
            const counts = sprintCounts(sprint);
            return (
              <button
                key={sprint.id}
                type="button"
                className="sprint-row"
                onClick={() => setOpenId(sprint.id)}
              >
                <span className="sprint-glyph" aria-hidden>
                  {GLYPH[sprint.style]}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="display block text-2xl">{sprint.title}</span>
                  <span className="block text-sm text-ink-soft">
                    {sprint.startDate} → {sprint.endDate} · {copy.sprints.counts(counts.push, counts.light, counts.rest)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {mounted && open && <SprintSheet sprint={open} onClose={() => setOpenId(null)} />}
    </div>
  );
}
