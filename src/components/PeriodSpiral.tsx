"use client";

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from "react";
import {
  dayLightProgress,
  periodSpiralGlow,
  periodSpiralPoints,
} from "@/lib/period-spiral";
import { datesInPeriod, gregorianToSue } from "@/lib/sue-calendar";
import { eventsOnDate } from "@/lib/planning";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useSueStore } from "./StoreProvider";

const CX = 400;
const CY = 400;

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

function spiralPath(points: ReturnType<typeof periodSpiralPoints>): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

export function PeriodSpiral({
  year,
  period,
  currentDay,
  currentIso,
  specialLabel = null,
}: PeriodSpiralProps) {
  const { state } = useSueStore();
  const reduced = usePrefersReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const day = currentDay ?? 28;
  const [progress, setProgress] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [turning, setTurning] = useState(false);
  const previousDayKey = useRef(`${specialLabel ?? "day"}:${day}`);
  const turnTimer = useRef<number | null>(null);
  const drag = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startRotation: 0,
  });

  const dates = useMemo(() => datesInPeriod(year, period), [period, year]);
  const points = useMemo(() => periodSpiralPoints(day), [day]);
  const path = useMemo(() => spiralPath(points), [points]);
  const glow = periodSpiralGlow(progress);
  const dayKey = `${specialLabel ?? "day"}:${day}`;

  useEffect(() => {
    const update = () => setProgress(dayLightProgress(secondsSinceMidnight()));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (previousDayKey.current === dayKey) return;
    previousDayKey.current = dayKey;
    if (reduced) return;
    const frame = window.requestAnimationFrame(() => setTurning(true));
    if (turnTimer.current !== null) window.clearTimeout(turnTimer.current);
    turnTimer.current = window.setTimeout(() => setTurning(false), 760);
    return () => {
      window.cancelAnimationFrame(frame);
      if (turnTimer.current !== null) window.clearTimeout(turnTimer.current);
    };
  }, [dayKey, reduced]);

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    const target = event.target;
    if (target instanceof Element && target.closest("a")) return;
    drag.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: rotation,
    };
    setTurning(false);
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
    setRotation(0);
  }

  return (
    <div className="period-spiral">
      <svg
        viewBox="0 0 800 800"
        className={`period-spiral-svg ${turning ? "is-turning" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label="Twenty-eight day period spiral"
        style={{
          ["--spiral-rotation" as string]: `${rotation}deg`,
        }}
      >
        <defs>
          <radialGradient id={`period-glow-${gradientId}`}>
            <stop offset="0" stopColor="var(--brass)" stopOpacity="0.8" />
            <stop offset="0.52" stopColor="var(--lunar)" stopOpacity="0.18" />
            <stop offset="1" stopColor="var(--lunar)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="period-spiral-rotor">
          <path d={path} className="period-spiral-line" />
          <circle
            cx={CX + glow.x}
            cy={CY + glow.y}
            r={72 * glow.scale}
            fill={`url(#period-glow-${gradientId})`}
            className="period-spiral-glow"
            opacity={glow.opacity}
          />

          {points.map((point) => {
            if (point.day === day) return null;
            const iso = dates[point.day - 1];
            const mapped = gregorianToSue(iso, state.settings.naming);
            const sprint = activeSprintsOn(state.sprints, iso)[0];
            const intensity = sprint ? sprintIntensityOn(sprint, iso) : null;
            const hasEvent =
              state.settings.layers.events && eventsOnDate(state.events, iso).length > 0;
            const hasRest = state.restBlocks.some((block) => block.date === iso);
            const size = 18 + Math.abs(point.relative) * 0.62;
            const safeSize = Math.max(18, size);
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
                className={`period-spiral-day ${point.relative < 0 ? "is-past" : ""}`}
                transform={`translate(${point.x} ${point.y})`}
                style={{
                  opacity: point.opacity,
                  ["--spiral-day-size" as string]: `${safeSize}px`,
                }}
              >
                <a href={`/day?iso=${iso}`} aria-label={`Day ${point.day}, ${iso}`}>
                  <circle r="24" fill="transparent" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`period-spiral-number ${status}`}
                  >
                    {point.day}
                  </text>
                  {(status || mapped.moon.name === "new" || mapped.moon.name === "full") && (
                    <circle
                      cy={safeSize * 0.72}
                      r="2.5"
                      className={`period-spiral-status ${status}`}
                    />
                  )}
                </a>
              </g>
            );
          })}

          <a href={`/day?iso=${currentIso}`} aria-label={specialLabel ?? `Day ${day}, ${currentIso}`}>
            <circle cx={CX} cy={CY} r="82" fill="var(--paper-deep)" className="period-spiral-hub" />
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
        </g>
      </svg>
    </div>
  );
}
