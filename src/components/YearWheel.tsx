"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSueStore } from "./StoreProvider";
import {
  datesInPeriod,
  gregorianToSue,
  leapDayISO,
  periodName,
  todayISO,
  yearDayISO,
} from "@/lib/sue-calendar";
import { periodColor } from "@/lib/palette";
import { eventsOnDate } from "@/lib/storage";
import { seasonMarkers } from "@/lib/seasons";

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

export function YearWheel() {
  const router = useRouter();
  const { state } = useSueStore();
  const year = state.settings.viewYear;
  const naming = state.settings.naming;
  const today = todayISO();
  const todayDate = gregorianToSue(today, naming);
  const leap = leapDayISO(year);
  const yearDay = yearDayISO(year);

  const densities = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const dates = datesInPeriod(year, i + 1);
      return dates.reduce(
        (n, iso) => n + eventsOnDate(state.events, iso).length,
        0,
      );
    });
  }, [state.events, year]);

  const cx = 320;
  const cy = 320;
  const r0 = 132;
  const r1 = 278;
  const sweep = 360 / 13;
  const gap = 1.6;

  const currentPeriod =
    todayDate.sueYear === year ? todayDate.suePeriod : null;

  const needleAngle = currentPeriod
    ? (currentPeriod - 0.5) * sweep
    : todayDate.isYearDay && todayDate.sueYear === year
      ? 0
      : todayDate.isLeapDay && todayDate.sueYear === year
        ? 6 * sweep
        : 0;

  return (
    <div className="relative mx-auto w-full max-w-[640px]">
      <svg viewBox="0 0 640 640" className="w-full drop-shadow-sm">
        <circle cx={cx} cy={cy} r={296} fill="none" stroke="#3d2a55" strokeWidth="0.6" />
        <circle cx={cx} cy={cy} r={118} fill="#1f1430" stroke="#4a3568" strokeWidth="0.8" />
        {Array.from({ length: 13 }, (_, i) => {
          const period = i + 1;
          const a0 = i * sweep + gap;
          const a1 = (i + 1) * sweep - gap;
          const mid = (a0 + a1) / 2;
          const label = polar(cx, cy, (r0 + r1) / 2, mid);
          const active = currentPeriod === period;
          const density = densities[i];
          const fill = periodColor(period);
          return (
            <g key={period}>
              <path
                d={donut(cx, cy, r0, r1, a0, a1)}
                fill={fill}
                fillOpacity={active ? 0.92 : 0.55 + Math.min(density, 6) * 0.05}
                stroke={active ? "#f0e6fa" : "rgba(212,184,240,0.22)"}
                strokeWidth={active ? 2.2 : 0.6}
                className="cursor-pointer"
                onClick={() => router.push(`/period/${period}`)}
              />
              {Array.from({ length: 4 }, (_, w) => {
                const wr = r0 + ((w + 1) * (r1 - r0)) / 4;
                const p = polar(cx, cy, wr, mid);
                return (
                  <circle
                    key={w}
                    cx={p.x}
                    cy={p.y}
                    r={w === (todayDate.sueWeekInPeriod ?? 0) - 1 && active ? 3.2 : 1.5}
                    fill={active ? "#f0e6fa" : "rgba(240,230,250,0.55)"}
                  />
                );
              })}
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={period >= 11 ? "#2a1848" : "#f0e6fa"}
                className="cursor-pointer"
                style={{ fontSize: 13, fontFamily: "var(--font-display)" }}
                onClick={() => router.push(`/period/${period}`)}
              >
                {period}
              </text>
            </g>
          );
        })}
        {state.settings.layers.seasons &&
          seasonMarkers(year).map((marker) => {
            const mapped = gregorianToSue(marker.iso, naming);
            if (!mapped.suePeriod) return null;
            const angle = (mapped.suePeriod - 0.5) * sweep;
            const p = polar(cx, cy, r1 + 14, angle);
            return (
              <circle
                key={marker.iso}
                cx={p.x}
                cy={p.y}
                r={3.5}
                fill={marker.kind === "solstice" ? "#e8d4fa" : "#a78bbe"}
              />
            );
          })}
        <line
          x1={cx}
          y1={cy}
          x2={polar(cx, cy, r0 - 8, needleAngle).x}
          y2={polar(cx, cy, r0 - 8, needleAngle).y}
          stroke="#d4b8f0"
          strokeWidth="1.6"
        />
        <circle cx={cx} cy={cy} r={7} fill="#d4b8f0" />
        <text
          x={cx}
          y={cy - 28}
          textAnchor="middle"
          fill="#d4b8f0"
          style={{ fontSize: 12, letterSpacing: "0.28em", fontFamily: "var(--font-mono)" }}
        >
          SÚE
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="#f0e6fa"
          style={{ fontSize: 28, fontFamily: "var(--font-display)" }}
        >
          {todayDate.sueYear === year
            ? todayDate.suePeriodName
            : periodName(1, naming)}
        </text>
        <text
          x={cx}
          y={cy + 32}
          textAnchor="middle"
          fill="#b9a4d0"
          style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
        >
          {year} · 13 × 28
        </text>
      </svg>
      <div className="mt-2 flex justify-center gap-6 text-xs text-ink-soft">
        <button
          type="button"
          className="hover:text-ink"
          onClick={() => router.push(`/day/${yearDay}`)}
        >
          Year Day · {yearDay.slice(5)}
        </button>
        {leap && (
          <button
            type="button"
            className="hover:text-ink"
            onClick={() => router.push(`/day/${leap}`)}
          >
            Leap Day · {leap.slice(5)}
          </button>
        )}
      </div>
    </div>
  );
}
