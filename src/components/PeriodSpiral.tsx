"use client";

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  SPIRAL_CENTER,
  SPIRAL_HIT_RADIUS,
  SPIRAL_HUB_RADIUS,
  dayLightProgress,
  periodSpiralGlow,
  periodSpiralSlots,
  spiralDayOpacity,
  spiralPaths,
  spiralTurnDegrees,
} from "@/lib/period-spiral";
import { datesInPeriod, gregorianToSue } from "@/lib/sue-calendar";
import { eventsOnDate } from "@/lib/planning";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { useSueStore } from "./StoreProvider";

const CX = SPIRAL_CENTER;
const CY = SPIRAL_CENTER;

type PeriodSpiralProps = {
  year: number;
  period: number;
  currentDay: number | null;
  currentIso: string;
  specialLabel?: string | null;
};

function secondsSinceMidnight(): number {
  const now = new Date();
  return (
    now.getHours() * 3_600 +
    now.getMinutes() * 60 +
    now.getSeconds() +
    now.getMilliseconds() / 1_000
  );
}

export function PeriodSpiral({
  year,
  period,
  currentDay,
  currentIso,
  specialLabel = null,
}: PeriodSpiralProps) {
  const { state } = useSueStore();
  const gradientId = useId().replace(/:/g, "");
  const day = currentDay ?? 28;
  const [progress, setProgress] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startRotation: 0,
  });

  const slots = periodSpiralSlots();
  const dates = useMemo(() => datesInPeriod(year, period), [period, year]);
  const paths = useMemo(() => spiralPaths(currentDay), [currentDay]);
  const turn = spiralTurnDegrees(currentDay) + rotation;
  const glow = periodSpiralGlow(progress);
  const nowSlot = currentDay === null ? null : slots[day - 1];

  useEffect(() => {
    const update = () => setProgress(dayLightProgress(secondsSinceMidnight()));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest("a")) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: rotation,
    };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current.active) return;
    const dx = event.clientX - drag.current.startX;
    const dy = event.clientY - drag.current.startY;
    const next = drag.current.startRotation + (dx - dy * 0.32) * 0.08;
    setRotation(Math.max(-18, Math.min(18, next)));
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setRotation(0);
  }

  return (
    <div className="period-spiral">
      <svg
        viewBox="0 0 800 800"
        className="period-spiral-svg"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label="Twenty-eight day period spiral"
      >
        <defs>
          <radialGradient id={`period-glow-${gradientId}`}>
            <stop offset="0" stopColor="var(--brass)" stopOpacity="0.8" />
            <stop offset="0.52" stopColor="var(--lunar)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--lunar)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g
          key={`${year}-${period}`}
          className={`period-spiral-rotor ${dragging ? "is-dragging" : ""}`}
          style={{ ["--spiral-turn" as string]: `${turn}deg` }}
        >
          <path d={paths.tail} className="period-spiral-line is-tail" />
          <path d={paths.traveled} className="period-spiral-line is-traveled" />
          <path d={paths.ahead} className="period-spiral-line" />

          {nowSlot && (
            <circle
              cx={nowSlot.x}
              cy={nowSlot.y}
              r="9"
              className="period-spiral-now"
              aria-hidden="true"
            />
          )}

          {slots.map((slot) => {
            if (currentDay !== null && slot.day === day) return null;
            const iso = dates[slot.day - 1];
            const mapped = gregorianToSue(iso, state.settings.naming);
            const sprint = activeSprintsOn(state.sprints, iso)[0];
            const intensity = sprint ? sprintIntensityOn(sprint, iso) : null;
            const hasEvent =
              state.settings.layers.events && eventsOnDate(state.events, iso).length > 0;
            const hasRest = state.restBlocks.some((block) => block.date === iso);
            const isPast = currentDay === null || slot.day < day;
            const status =
              hasRest || intensity === "rest"
                ? "rest"
                : intensity === "push"
                  ? "push"
                  : intensity === "light"
                    ? "light"
                    : hasEvent
                      ? "event"
                      : "";

            return (
              <g
                key={iso}
                className={`period-spiral-day ${isPast ? "is-past" : ""}`}
                transform={`translate(${slot.x.toFixed(2)} ${slot.y.toFixed(2)})`}
                style={{
                  opacity: spiralDayOpacity(slot.day, currentDay),
                  ["--spiral-day-size" as string]: `${slot.size.toFixed(1)}px`,
                }}
              >
                <g className="period-spiral-upright">
                  <a href={`/day?iso=${iso}`} aria-label={`Day ${slot.day}, ${iso}`}>
                    <circle r={SPIRAL_HIT_RADIUS} fill="transparent" />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className={`period-spiral-number ${status}`}
                    >
                      {slot.day}
                    </text>
                    {(status || mapped.moon.name === "new" || mapped.moon.name === "full") && (
                      <circle
                        cy={slot.size * 0.72}
                        r="3"
                        className={`period-spiral-status ${status}`}
                      />
                    )}
                  </a>
                </g>
              </g>
            );
          })}
        </g>

        <circle
          cx={CX + glow.x}
          cy={CY + glow.y}
          r={72 * glow.scale}
          fill={`url(#period-glow-${gradientId})`}
          className="period-spiral-glow"
          opacity={glow.opacity}
        />

        <a href={`/day?iso=${currentIso}`} aria-label={specialLabel ?? `Day ${day}, ${currentIso}`}>
          <circle
            cx={CX}
            cy={CY}
            r={SPIRAL_HUB_RADIUS}
            fill="var(--paper-deep)"
            className="period-spiral-hub"
          />
          <text
            x={CX}
            y={CY - 10}
            textAnchor="middle"
            className={`period-spiral-current-number ${specialLabel ? "is-special" : ""}`}
          >
            {specialLabel ?? day}
          </text>
          <text x={CX} y={CY + 42} textAnchor="middle" className="period-spiral-current-caption">
            {specialLabel ? "SÚE" : `day ${day}`}
          </text>
        </a>
      </svg>
    </div>
  );
}
