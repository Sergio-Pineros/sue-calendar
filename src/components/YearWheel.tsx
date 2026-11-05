"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSueStore } from "./StoreProvider";
import {
  datesInYear,
  daysInGregorianYear,
  formatGregorianLong,
  gregorianToSue,
  leapDayISO,
  periodName,
  todayISO,
  yearDayISO,
} from "@/lib/sue-calendar";
import { periodColor } from "@/lib/palette";
import { eventsOnDate } from "@/lib/planning";
import { seasonMarkers } from "@/lib/seasons";
import { sabbatsForYear } from "@/lib/wheel-of-year";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { copy } from "@/lib/copy";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { weekdayShortLabel, weekdayNumber, formatWeekdayNumber } from "@/lib/weekdays";
import { AsciiMoon } from "./Ascii";

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function donut(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
) {
  const large = a1 - a0 > 180 ? 1 : 0;
  const p0 = polar(cx, cy, r1, a0);
  const p1 = polar(cx, cy, r1, a1);
  const p2 = polar(cx, cy, r0, a1);
  const p3 = polar(cx, cy, r0, a0);
  return `M ${p0.x} ${p0.y} A ${r1} ${r1} 0 ${large} 1 ${p1.x} ${p1.y} L ${p2.x} ${p2.y} A ${r0} ${r0} 0 ${large} 0 ${p3.x} ${p3.y} Z`;
}

function dateFromDoy(year: number, doy: number): string {
  const utc = Date.UTC(year, 0, doy);
  const next = new Date(utc);
  const m = String(next.getUTCMonth() + 1).padStart(2, "0");
  const d = String(next.getUTCDate()).padStart(2, "0");
  return `${next.getUTCFullYear()}-${m}-${d}`;
}

export function YearWheel({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { state } = useSueStore();
  const reduced = usePrefersReducedMotion();
  const year = state.settings.viewYear;
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = todayISO();
  const todayDate = gregorianToSue(today, naming);
  const leap = leapDayISO(year);
  const yearDay = yearDayISO(year);
  const dim = daysInGregorianYear(year);
  const degreesPerDay = 360 / dim;
  const todayInYear = todayDate.sueYear === year;
  const todayDoy = todayInYear ? todayDate.dayOfYear : 1;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const ornamentRef = useRef(0);
  const draggingRef = useRef(false);
  const lastAngleRef = useRef(0);
  const lastTRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [ornament, setOrnament] = useState(0);

  useEffect(() => {
    let frame = 0;
    const tick = (t: number) => {
      const last = lastTRef.current || t;
      const dt = Math.min(0.032, (t - last) / 1000);
      lastTRef.current = t;

      if (!reduced) {
        ornamentRef.current = (ornamentRef.current + dt * 4) % 360;
      }

      if (!draggingRef.current) {
        if (Math.abs(velocityRef.current) > 2) {
          offsetRef.current += velocityRef.current * dt;
          velocityRef.current *= Math.pow(0.12, dt);
        } else if (!reduced) {
          const k = 18;
          const c = 8;
          const force = -k * offsetRef.current - c * velocityRef.current;
          velocityRef.current += force * dt;
          offsetRef.current += velocityRef.current * dt;
          if (Math.abs(offsetRef.current) < 0.05 && Math.abs(velocityRef.current) < 0.05) {
            offsetRef.current = 0;
            velocityRef.current = 0;
          }
        } else {
          offsetRef.current = 0;
          velocityRef.current = 0;
        }
      }

      setOffset(offsetRef.current);
      setOrnament(ornamentRef.current);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduced]);

  const restRotation = -(todayDoy - 0.5) * degreesPerDay;
  const rotation = restRotation + offset;
  const focusedDoy = Math.min(
    dim,
    Math.max(1, Math.round(todayDoy - offset / degreesPerDay)),
  );
  const focusedIso =
    todayInYear && Math.abs(offset) < 0.4 ? today : dateFromDoy(year, focusedDoy);
  const focused = gregorianToSue(focusedIso, naming);

  const densities = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const start = (i * 28) + 1;
      let count = 0;
      for (let d = 0; d < 28; d += 1) {
        const iso = dateFromDoy(year, start + d + (year % 4 === 0 && i >= 6 ? 1 : 0));
        count += eventsOnDate(state.events, iso).length;
      }
      return count;
    });
  }, [state.events, year]);

  const yearDates = useMemo(() => datesInYear(year), [year]);

  function pointerAngle(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    return (Math.atan2(y, x) * 180) / Math.PI;
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    draggingRef.current = true;
    lastAngleRef.current = pointerAngle(event);
    velocityRef.current = 0;
    svgRef.current?.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!draggingRef.current) return;
    const next = pointerAngle(event);
    let delta = next - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    offsetRef.current += delta;
    velocityRef.current = delta * 40;
    lastAngleRef.current = next;
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    draggingRef.current = false;
    svgRef.current?.releasePointerCapture(event.pointerId);
  }

  const cx = 400;
  const cy = 400;
  const sweep = 360 / 13;
  const gap = 1.1;
  const weekdayN = weekdayNumber(focused.weekdayIndex, state.settings);

  return (
    <div className="wheel-stage relative mx-auto w-full max-w-[720px]">
      <div className="mb-3 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {Math.abs(offset) < 0.8 ? copy.wheel.today : focused.gregorianDate}
        </p>
        <button
          type="button"
          className="display text-4xl md:text-5xl"
          onClick={() => router.push(`/day/${focused.gregorianDate}`)}
        >
          {focused.suePeriodName}
          {focused.sueDayInPeriod ? ` · ${focused.sueDayInPeriod}` : ""}
        </button>
        <p className="mt-1 text-sm text-ink-soft">
          {formatGregorianLong(focused.gregorianDate)}
          {" · "}
          {weekdayShortLabel(focused.weekdayIndex, state.settings)}
          {weekdayN !== null ? ` ${formatWeekdayNumber(weekdayN)}` : ""}
          {" · "}
          <AsciiMoon name={focused.moon.name} />
        </p>
      </div>
      <svg
        ref={svgRef}
        viewBox="0 0 800 800"
        className="w-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label={`Year wheel for ${year}`}
      >
        <defs>
          <filter id="wood-grain" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" />
            <feColorMatrix type="saturate" values="0.2" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.35" />
            </feComponentTransfer>
          </filter>
          <radialGradient id="wood-fill" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="var(--wood)" />
            <stop offset="70%" stopColor="var(--wood-deep)" />
            <stop offset="100%" stopColor="var(--paper-deep)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={396} fill="var(--paper-deep)" opacity="0.55" />
        <circle cx={cx} cy={cy} r={392} fill="url(#wood-fill)" />
        <circle cx={cx} cy={cy} r={392} filter="url(#wood-grain)" fill="var(--wood)" opacity="0.55" />
        <circle cx={cx} cy={cy} r={390} fill="none" stroke="var(--brass)" strokeWidth="10" opacity="0.55" />
        <circle cx={cx} cy={cy} r={384} fill="none" stroke="var(--engrave)" strokeWidth="3" />
        <circle cx={cx} cy={cy} r={356} fill="none" stroke="var(--engrave)" strokeWidth="0.7" strokeOpacity="0.55" />
        <circle cx={cx} cy={cy} r={226} fill="none" stroke="var(--engrave)" strokeWidth="0.7" strokeOpacity="0.45" />
        <circle cx={cx} cy={cy} r={176} fill="none" stroke="var(--engrave)" strokeWidth="0.8" />
        <g
          style={{
            transform: `rotate(${ornament}deg)`,
            transformOrigin: "400px 400px",
            willChange: "transform",
          }}
        >
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i * 360) / 24;
            const p0 = polar(cx, cy, 372, a);
            const p1 = polar(cx, cy, 382, a);
            return (
              <line
                key={i}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke="var(--engrave)"
                strokeWidth="1.1"
              />
            );
          })}
        </g>
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "400px 400px",
            willChange: "transform",
          }}
        >
          {Array.from({ length: 13 }, (_, i) => {
            const period = i + 1;
            const a0 = i * sweep + gap;
            const a1 = (i + 1) * sweep - gap;
            const mid = (a0 + a1) / 2;
            const label = polar(cx, cy, 292, mid);
            const active = focused.suePeriod === period;
            return (
              <g key={period}>
                <path
                  d={donut(cx, cy, 228, 348, a0, a1)}
                  fill={periodColor(period)}
                  fillOpacity={active ? 0.95 : 0.62 + Math.min(densities[i], 6) * 0.04}
                  stroke={active ? "var(--ink)" : "color-mix(in oklab, var(--engrave) 45%, transparent)"}
                  strokeWidth={active ? 2.4 : 0.7}
                  className="cursor-pointer"
                  onClick={() => router.push(`/period/${period}`)}
                />
                {Array.from({ length: 3 }, (_, mark) => {
                  const groove = polar(cx, cy, 348 - mark * 8, a0);
                  const groove2 = polar(cx, cy, 228 + mark * 6, a0);
                  return (
                    <line
                      key={mark}
                      x1={groove.x}
                      y1={groove.y}
                      x2={groove2.x}
                      y2={groove2.y}
                      stroke="var(--engrave)"
                      strokeOpacity="0.35"
                      strokeWidth="0.6"
                    />
                  );
                })}
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--ink)"
                  className="cursor-pointer"
                  style={{ fontSize: compact ? 13 : 15, fontFamily: "var(--font-display)" }}
                  onClick={() => router.push(`/period/${period}`)}
                >
                  {periodName(period, naming)}
                </text>
              </g>
            );
          })}
          {yearDates.map((iso, index) => {
            const angle = (index + 0.5) * degreesPerDay;
            const p = polar(cx, cy, 210, angle);
            const sprint = state.settings.layers.sprints
              ? activeSprintsOn(state.sprints, iso)[0]
              : undefined;
            const intensity = sprint ? sprintIntensityOn(sprint, iso) : null;
            const hasEvent =
              state.settings.layers.events &&
              eventsOnDate(state.events, iso).length > 0;
            const fill = intensity
              ? intensity === "rest"
                ? "var(--rest)"
                : intensity === "push"
                  ? "var(--year-day)"
                  : "var(--brass)"
              : hasEvent
                ? "var(--brass)"
                : "color-mix(in oklab, var(--engrave) 50%, transparent)";
            return (
              <circle
                key={iso}
                cx={p.x}
                cy={p.y}
                r={intensity === "rest" ? 2.6 : hasEvent ? 2.1 : 1.15}
                fill={fill}
                className="cursor-pointer"
                onClick={() => router.push(`/day/${iso}`)}
              />
            );
          })}
          {state.settings.layers.moon &&
            yearDates
              .filter((iso) => {
                const name = gregorianToSue(iso, naming).moon.name;
                return name === "new" || name === "full";
              })
              .map((iso) => {
                const mapped = gregorianToSue(iso, naming);
                const p = polar(cx, cy, 188, (mapped.dayOfYear - 0.5) * degreesPerDay);
                return (
                  <circle
                    key={`moon-${iso}`}
                    cx={p.x}
                    cy={p.y}
                    r={mapped.moon.name === "full" ? 4 : 3}
                    fill={mapped.moon.name === "full" ? "var(--lunar)" : "var(--paper-deep)"}
                    stroke="var(--engrave)"
                    strokeWidth="0.8"
                  />
                );
              })}
          {state.settings.layers.seasons &&
            seasonMarkers(year).map((marker) => {
              const mapped = gregorianToSue(marker.iso, naming);
              const p = polar(cx, cy, 360, (mapped.dayOfYear - 0.5) * degreesPerDay);
              return (
                <g key={marker.iso}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={5}
                    fill={marker.kind === "solstice" ? "var(--brass)" : "var(--lunar)"}
                  />
                </g>
              );
            })}
          {state.settings.layers.sabbats &&
            sabbatsForYear(year).map((sabbat) => {
              const p = polar(cx, cy, 368, (sabbat.dayOfYear - 0.5) * degreesPerDay);
              return (
                <text
                  key={sabbat.id}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="var(--engrave)"
                  style={{ fontSize: 8, fontFamily: "var(--font-mono)" }}
                >
                  {sabbat.name.slice(0, 3)}
                </text>
              );
            })}
        </g>
        <circle cx={cx} cy={cy} r={168} fill="var(--paper-deep)" stroke="var(--engrave)" strokeWidth="1.2" />
        <g
          style={{
            transform: `rotate(${-ornament}deg)`,
            transformOrigin: "400px 400px",
          }}
        >
          <path
            d="M400 268 C448 318 486 348 486 400 C486 452 448 482 400 532 C352 482 314 452 314 400 C314 348 352 318 400 268 Z"
            fill="none"
            stroke="var(--engrave)"
            strokeWidth="1.6"
          />
          <path
            d="M338 338 C368 308 432 308 462 338 C492 368 492 432 462 462 C432 492 368 492 338 462 C308 432 308 368 338 338 Z"
            fill="none"
            stroke="var(--engrave)"
            strokeWidth="1.1"
          />
          <circle cx={cx} cy={cy} r={52} fill="none" stroke="var(--engrave)" strokeWidth="1.1" />
          <path
            d="M400 348 C424 364 440 380 440 400 C440 420 424 436 400 452 C376 436 360 420 360 400 C360 380 376 364 400 348 Z"
            fill="none"
            stroke="var(--brass)"
            strokeWidth="1.3"
          />
          {Array.from({ length: 8 }, (_, i) => {
            const a = i * 45;
            const p0 = polar(cx, cy, 58, a);
            const p1 = polar(cx, cy, 78, a);
            return (
              <line
                key={i}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke="var(--brass)"
                strokeWidth="0.8"
              />
            );
          })}
        </g>
        <polygon
          points="400,214 394,228 406,228"
          fill="var(--brass)"
        />
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="var(--brass)"
          style={{ fontSize: 13, letterSpacing: "0.32em", fontFamily: "var(--font-mono)" }}
        >
          SÚE
        </text>
        <text
          x={cx}
          y={cy + 18}
          textAnchor="middle"
          fill="var(--ink)"
          style={{ fontSize: 22, fontFamily: "var(--font-display)" }}
        >
          {year}
        </text>
      </svg>
      <p className="mt-2 text-center font-mono text-[11px] text-ink-soft">
        {reduced ? copy.wheel.reduced : copy.wheel.drag}
      </p>
      <div className="mt-2 flex justify-center gap-6 text-xs text-ink-soft">
        <button type="button" className="tap hover:text-ink" onClick={() => router.push(`/day/${yearDay}`)}>
          {copy.year.yearDay} · {yearDay.slice(5)}
        </button>
        {leap && (
          <button type="button" className="tap hover:text-ink" onClick={() => router.push(`/day/${leap}`)}>
            {copy.year.leapDay} · {leap.slice(5)}
          </button>
        )}
      </div>
    </div>
  );
}
