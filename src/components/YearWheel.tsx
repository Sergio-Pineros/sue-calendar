"use client";

import { useEffect, useMemo, useRef, useState, type Ref } from "react";
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

export function YearWheel({
  compact = false,
  hideChrome = false,
  driven = false,
  rotorRef,
  activePeriod,
  onRotate,
  onHubTap,
}: {
  compact?: boolean;
  hideChrome?: boolean;
  driven?: boolean;
  rotorRef?: Ref<SVGGElement>;
  activePeriod?: number | null;
  onRotate?: (deltaDeg: number, ended: boolean) => void;
  onHubTap?: () => void;
}) {
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
  const stageRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const ornamentRef = useRef(0);
  const interactingRef = useRef(false);
  const pinTodayRef = useRef(false);
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastAngleRef = useRef(0);
  const lastYRef = useRef(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const lastTRef = useRef(0);
  const dimRef = useRef(dim);
  const todayDoyRef = useRef(todayDoy);
  const degRef = useRef(degreesPerDay);
  const rotationRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [ornament, setOrnament] = useState(0);

  useEffect(() => {
    dimRef.current = dim;
    todayDoyRef.current = todayDoy;
    degRef.current = degreesPerDay;
  }, [dim, todayDoy, degreesPerDay]);

  function clampOffset(value: number) {
    const minOffset = (todayDoyRef.current - dimRef.current) * degRef.current;
    const maxOffset = (todayDoyRef.current - 1) * degRef.current;
    return Math.min(maxOffset, Math.max(minOffset, value));
  }

  function nearestDayOffset(value: number) {
    const doy = Math.min(
      dimRef.current,
      Math.max(1, Math.round(todayDoyRef.current - value / degRef.current)),
    );
    return (todayDoyRef.current - doy) * degRef.current;
  }

  function goToToday() {
    pinTodayRef.current = true;
    interactingRef.current = false;
    if (reduced) {
      offsetRef.current = 0;
      velocityRef.current = 0;
      setOffset(0);
    } else {
      velocityRef.current = 0;
    }
  }

  useEffect(() => {
    let frame = 0;
    const tick = (t: number) => {
      const last = lastTRef.current || t;
      const dt = Math.min(0.032, (t - last) / 1000);
      lastTRef.current = t;

      if (!reduced) {
        ornamentRef.current = (ornamentRef.current + dt * 4) % 360;
      }

      if (!driven && !interactingRef.current) {
        if (Math.abs(velocityRef.current) > 8) {
          offsetRef.current = clampOffset(offsetRef.current + velocityRef.current * dt);
          velocityRef.current *= Math.pow(0.08, dt);
        } else {
          const target = pinTodayRef.current ? 0 : nearestDayOffset(offsetRef.current);
          if (reduced) {
            offsetRef.current = target;
            velocityRef.current = 0;
          } else {
            const k = 28;
            const c = 10;
            const force = -k * (offsetRef.current - target) - c * velocityRef.current;
            velocityRef.current += force * dt;
            offsetRef.current += velocityRef.current * dt;
            if (Math.abs(offsetRef.current - target) < 0.04 && Math.abs(velocityRef.current) < 0.04) {
              offsetRef.current = target;
              velocityRef.current = 0;
            }
          }
        }
      }

      if (!driven) setOffset(offsetRef.current);
      setOrnament(ornamentRef.current);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduced, driven]);

  useEffect(() => {
    if (driven) return;
    const el = stageRef.current;
    if (!el) return;
    let settle = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      pinTodayRef.current = false;
      interactingRef.current = true;
      const delta = event.deltaY + event.deltaX * 0.35;
      offsetRef.current = clampOffset(offsetRef.current - delta * 0.16);
      velocityRef.current = -delta * 0.7;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        interactingRef.current = false;
      }, 90);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(settle);
      el.removeEventListener("wheel", onWheel);
    };
  }, [driven]);

  const displayOffset = offset;
  const restRotation = -(todayDoy - 0.5) * degreesPerDay;
  const rotation = restRotation + displayOffset;

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);
  const focusedDoy = Math.min(
    dim,
    Math.max(1, Math.round(todayDoy - displayOffset / degreesPerDay)),
  );
  const focusedIso = dateFromDoy(year, focusedDoy);
  const focused = gregorianToSue(focusedIso, naming);
  const isToday = focusedIso === today;

  const densities = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const start = i * 28 + 1;
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

  function localFromEvent(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { r: 0, localDeg: 0 };
    const x = ((event.clientX - rect.left) / rect.width) * 800 - 400;
    const y = ((event.clientY - rect.top) / rect.height) * 800 - 400;
    const r = Math.hypot(x, y);
    const fromNorth = (Math.atan2(x, -y) * 180) / Math.PI;
    const visual = (() => {
      const node =
        rotorRef && typeof rotorRef === "object" ? rotorRef.current : null;
      const raw = node?.style.transform ?? "";
      const match = /rotate\((-?[\d.]+)deg\)/.exec(raw);
      return match ? Number(match[1]) : rotationRef.current;
    })();
    const localDeg = ((fromNorth - visual) % 360 + 360) % 360;
    return { r, localDeg };
  }

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    interactingRef.current = true;
    draggingRef.current = true;
    didDragRef.current = false;
    pinTodayRef.current = false;
    lastAngleRef.current = pointerAngle(event);
    lastYRef.current = event.clientY;
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    velocityRef.current = 0;
    svgRef.current?.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!draggingRef.current) return;
    const travelX = event.clientX - startXRef.current;
    const travelY = event.clientY - startYRef.current;
    if (travelX * travelX + travelY * travelY > 36) didDragRef.current = true;

    const next = pointerAngle(event);
    let ang = next - lastAngleRef.current;
    if (ang > 180) ang -= 360;
    if (ang < -180) ang += 360;
    const fromY = -(event.clientY - lastYRef.current) * 0.32;
    const combined = ang + fromY;
    if (onRotate) {
      onRotate(combined, false);
    } else {
      offsetRef.current = clampOffset(offsetRef.current + combined);
      velocityRef.current = combined * 40;
    }
    lastAngleRef.current = next;
    lastYRef.current = event.clientY;
  }

  function handleTap(event: React.PointerEvent<SVGSVGElement>) {
    const { r, localDeg } = localFromEvent(event);
    if (r < 168) {
      if (onHubTap) onHubTap();
      else goToToday();
      return;
    }
    if (r >= 196 && r <= 224) {
      const doy = Math.min(dim, Math.max(1, Math.round(localDeg / degreesPerDay + 0.5)));
      router.push(`/day?iso=${dateFromDoy(year, doy)}`);
      return;
    }
    if (r >= 228 && r <= 348) {
      const period = Math.min(13, Math.max(1, Math.floor(localDeg / sweep) + 1));
      router.push(`/period/${period}`);
    }
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    draggingRef.current = false;
    interactingRef.current = false;
    svgRef.current?.releasePointerCapture(event.pointerId);
    if (didDragRef.current && onRotate) onRotate(0, true);
    if (!didDragRef.current) handleTap(event);
  }

  const cx = 400;
  const cy = 400;
  const sweep = 360 / 13;
  const gap = 1.1;
  const weekdayN = weekdayNumber(focused.weekdayIndex, state.settings);

  return (
    <div ref={stageRef} className="wheel-stage relative mx-auto w-full max-w-[720px]">
      {!hideChrome && <div className="mb-3 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {isToday ? copy.wheel.today : focused.gregorianDate}
        </p>
        <button
          type="button"
          className="display text-4xl md:text-5xl"
          onClick={() => router.push(`/day?iso=${focused.gregorianDate}`)}
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
      </div>}
      <svg
        ref={svgRef}
        viewBox="0 0 800 800"
        className="w-full cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="img"
        aria-label={`Year wheel for ${year}. ${copy.wheel.drag}`}
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
          ref={rotorRef}
          style={{
            transform: driven ? undefined : `rotate(${rotation}deg)`,
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
            const active = (activePeriod ?? focused.suePeriod) === period;
            return (
              <g key={period}>
                <path
                  d={donut(cx, cy, 228, 348, a0, a1)}
                  fill={periodColor(period)}
                  fillOpacity={active ? 0.95 : 0.62 + Math.min(densities[i], 6) * 0.04}
                  stroke={active ? "var(--ink)" : "color-mix(in oklab, var(--engrave) 45%, transparent)"}
                  strokeWidth={active ? 2.4 : 0.7}
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
                  style={{ fontSize: compact ? 13 : 15, fontFamily: "var(--font-display)" }}
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
        <circle
          cx={cx}
          cy={cy}
          r={168}
          fill="var(--paper-deep)"
          stroke="var(--engrave)"
          strokeWidth="1.2"
          className="cursor-pointer"
        />
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
      {!hideChrome && (
        <>
          <div className="mt-2 flex justify-center gap-6 text-xs text-ink-soft">
            <button type="button" className="tap hover:text-ink" onClick={() => router.push(`/day?iso=${yearDay}`)}>
              {copy.year.yearDay} · {yearDay.slice(5)}
            </button>
            {leap && (
              <button type="button" className="tap hover:text-ink" onClick={() => router.push(`/day?iso=${leap}`)}>
                {copy.year.leapDay} · {leap.slice(5)}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
