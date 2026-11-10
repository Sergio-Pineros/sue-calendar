"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { copy } from "@/lib/copy";
import { moonLabel } from "@/lib/moon";
import { daysBetween } from "@/lib/iso-date";
import { addDays, formatGregorianLong, formatSueLabel, gregorianToSue } from "@/lib/sue-calendar";
import { eventsOnDate } from "@/lib/planning";
import { CompanionCalendarLine } from "./CalendarLibrary";
import { DayFocus } from "./DayFocus";
import { relativeDayLabel } from "./DaySpiral";
import { MoonGlyph } from "./MoonGlyph";
import { useSueStore } from "./StoreProvider";

export function DaySheet({
  iso,
  todayIso,
  onStep,
  onClose,
}: {
  iso: string;
  todayIso: string;
  onStep: (iso: string) => void;
  onClose: () => void;
}) {
  const { state } = useSueStore();
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<"enter" | "open" | "leave">("enter");
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const velocity = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  const mapped = gregorianToSue(iso, {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  });
  const offset = daysBetween(todayIso, iso);
  const events = state.settings.layers.events ? eventsOnDate(state.events, iso) : [];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = window.requestAnimationFrame(() => setPhase("open"));
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previous;
      window.cancelAnimationFrame(id);
    };
  }, []);

  function dismiss() {
    setPhase("leave");
    window.setTimeout(onClose, reduced ? 0 : 420);
  }

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setPhase("leave");
        window.setTimeout(onClose, reduced ? 0 : 420);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, reduced]);

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
    const now = performance.now();
    const dt = Math.max(8, now - lastT.current);
    velocity.current = ((event.clientY - lastY.current) / dt) * 1000;
    lastY.current = event.clientY;
    lastT.current = now;
    setDragY(Math.max(0, event.clientY - startY.current));
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

  const transition =
    dragging || reduced
      ? "none"
      : "transform 520ms cubic-bezier(0.22, 1.2, 0.36, 1), opacity 320ms ease";
  const translate = phase === "open" ? `translateY(${dragY}px)` : "translateY(100%)";

  const sheet = (
    <div className="sprint-sheet day-sheet" role="dialog" aria-modal="true" aria-label={formatGregorianLong(iso)}>
      <button
        type="button"
        tabIndex={-1}
        className={`sprint-sheet-backdrop ${phase === "open" ? "is-open" : ""}`}
        aria-label={copy.focus.close}
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
        </div>
        <div className="sprint-sheet-body day-sheet-body">
          <div className="day-sheet-nav">
            <button type="button" className="ghost-action" aria-label={copy.focus.previous} onClick={() => onStep(addDays(iso, -1))}>
              ←
            </button>
            <p className="focus-kicker is-brass">
              {offset >= 0 ? relativeDayLabel(offset) : formatSueLabel(mapped)}
            </p>
            <button type="button" className="ghost-action" aria-label={copy.focus.next} onClick={() => onStep(addDays(iso, 1))}>
              →
            </button>
          </div>
          <h2 className="display day-sheet-title">{formatGregorianLong(iso)}</h2>
          <p className="mt-2 text-sm text-ink-soft">{formatSueLabel(mapped)}</p>
          <CompanionCalendarLine iso={iso} />
          {state.settings.layers.moon && (
            <p className="mt-1 inline-flex items-center gap-2 text-sm text-ink-soft">
              <MoonGlyph name={mapped.moon.name} size={14} />
              {moonLabel(mapped.moon.name)}
            </p>
          )}
          {events.length > 0 && (
            <ul className="day-sheet-events">
              {events.map((event) => (
                <li key={event.id}>
                  <span>{event.title}</span>
                  <span className="text-ink-soft">
                    {event.allDay ? copy.day.allDay : event.start.slice(11, 16)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-10">
            <DayFocus iso={iso} />
          </div>

          <div className="mt-10 flex flex-col items-center gap-2">
            <Link href={`/day?iso=${iso}`} className="sprint-action">
              {copy.focus.openDay}
            </Link>
            <button ref={closeRef} type="button" className="sprint-action is-quiet" onClick={dismiss}>
              {copy.focus.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(sheet, document.body);
}
