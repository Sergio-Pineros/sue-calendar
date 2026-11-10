"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import {
  SPIRAL_CENTER,
  SPIRAL_DAY_TURN,
  SPIRAL_HUB_RADIUS,
  SPIRAL_WINDOW_DAYS,
  aheadOpacity,
  spiralSegments,
  todayLightPath,
  todayNowPoint,
  todayOpacity,
} from "@/lib/period-spiral";
import { addDays, formatGregorianLong, formatSueLabel, gregorianToSue } from "@/lib/sue-calendar";
import { eventsOnDate } from "@/lib/planning";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { copy } from "@/lib/copy";
import { useNowMinute } from "@/hooks/useNowMinute";
import { useSueStore } from "./StoreProvider";

export function relativeDayLabel(offset: number): string {
  if (offset === 0) return copy.spiral.today;
  if (offset === 1) return copy.spiral.tomorrow;
  return copy.spiral.inDays(offset);
}

function onActivate(handler: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handler();
    }
  };
}

export function DaySpiral({
  todayIso,
  onOpenDay,
}: {
  todayIso: string;
  onOpenDay: (iso: string) => void;
}) {
  const { state } = useSueStore();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const now = useNowMinute();
  const progress = now ? (now.getHours() * 60 + now.getMinutes()) / 1_440 : 0;
  const segments = spiralSegments();
  const dates = useMemo(
    () => Array.from({ length: SPIRAL_WINDOW_DAYS }, (_, offset) => addDays(todayIso, offset)),
    [todayIso],
  );

  const [shownIso, setShownIso] = useState(todayIso);
  const [turn, setTurn] = useState(0);
  const [instant, setInstant] = useState(false);
  if (shownIso !== todayIso) {
    setShownIso(todayIso);
    setTurn(SPIRAL_DAY_TURN);
    setInstant(true);
  }
  useEffect(() => {
    if (!instant) return;
    let second = 0;
    const first = window.requestAnimationFrame(() => {
      second = window.requestAnimationFrame(() => {
        setInstant(false);
        setTurn(0);
      });
    });
    return () => {
      window.cancelAnimationFrame(first);
      window.cancelAnimationFrame(second);
    };
  }, [instant]);

  const farIso = dates[SPIRAL_WINDOW_DAYS - 1];
  const far = gregorianToSue(farIso, naming);
  const [nowX, nowY] = todayNowPoint(progress);

  return (
    <div className="day-spiral">
      <svg viewBox="0 0 800 800" className="day-spiral-svg" role="group" aria-label={copy.spiral.label}>
        <g
          className={`day-spiral-rotor ${instant ? "is-instant" : ""}`}
          style={{ ["--spiral-turn" as string]: `${turn}deg` }}
        >
          {segments.map((segment) => {
            const iso = dates[segment.offset];
            const mapped = gregorianToSue(iso, naming);
            const isToday = segment.offset === 0;
            const sprint = activeSprintsOn(state.sprints, iso)[0];
            const intensity = sprint ? sprintIntensityOn(sprint, iso) : null;
            const hasRest = state.restBlocks.some((block) => block.date === iso);
            const hasEvent =
              state.settings.layers.events && eventsOnDate(state.events, iso).length > 0;
            const planned = (state.dayPlans?.[iso]?.tasks ?? []).some((task) => !task.done);
            const tone =
              hasRest || intensity === "rest"
                ? "is-rest"
                : intensity === "push"
                  ? "is-push"
                  : intensity === "light"
                    ? "is-light"
                    : "";
            const dot = hasEvent || planned
              ? "event"
              : mapped.moon.name === "full" || mapped.moon.name === "new"
                ? `moon-${mapped.moon.name}`
                : "";
            const startsPeriod = mapped.isSpecialDay || mapped.sueDayInPeriod === 1;
            const label = mapped.isSpecialDay
              ? isToday
                ? mapped.isYearDay
                  ? copy.year.yearDay
                  : copy.year.leapDay
                : "✦"
              : String(mapped.sueDayInPeriod);
            const size = mapped.isSpecialDay && isToday ? segment.labelSize * 0.62 : segment.labelSize;
            const open = () => onOpenDay(iso);

            return (
              <g
                key={segment.offset}
                className={`day-spiral-section ${isToday ? "is-today" : ""} ${tone} ${
                  mapped.isSpecialDay ? "is-special" : ""
                }`}
                role="button"
                tabIndex={0}
                aria-label={`${relativeDayLabel(segment.offset)}, ${formatGregorianLong(iso)}, ${formatSueLabel(mapped)}`}
                onClick={open}
                onKeyDown={onActivate(open)}
                style={{ opacity: isToday ? todayOpacity(progress) : aheadOpacity(segment.offset) }}
                data-offset={segment.offset}
              >
                <path d={segment.path} className="day-spiral-band" />
                {isToday && <path d={todayLightPath(progress)} className="day-spiral-light" />}
                {startsPeriod && segment.offset > 0 && (
                  <line {...segment.edge} className="day-spiral-edge" />
                )}
                <g transform={`translate(${segment.labelX.toFixed(2)} ${segment.labelY.toFixed(2)})`}>
                  <g className="day-spiral-upright">
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="day-spiral-number"
                      style={{ fontSize: `${size.toFixed(1)}px` }}
                    >
                      {label}
                    </text>
                    {dot && (
                      <circle
                        cy={segment.labelSize * 0.74}
                        r={Math.max(2.6, segment.width * 0.045)}
                        className={`day-spiral-dot ${dot}`}
                      />
                    )}
                  </g>
                </g>
              </g>
            );
          })}
          {now && <circle cx={nowX} cy={nowY} r="5" className="day-spiral-now" aria-hidden="true" />}
        </g>

        <g
          className="day-spiral-hub"
          role="button"
          tabIndex={0}
          aria-label={`${copy.spiral.farthest}, ${formatGregorianLong(farIso)}, ${formatSueLabel(far)}`}
          onClick={() => onOpenDay(farIso)}
          onKeyDown={onActivate(() => onOpenDay(farIso))}
          data-offset={SPIRAL_WINDOW_DAYS - 1}
        >
          <circle cx={SPIRAL_CENTER} cy={SPIRAL_CENTER} r={SPIRAL_HUB_RADIUS} className="day-spiral-hub-disc" />
          <text
            x={SPIRAL_CENTER}
            y={SPIRAL_CENTER}
            textAnchor="middle"
            dominantBaseline="central"
            className="day-spiral-hub-number"
          >
            {far.isSpecialDay ? "✦" : far.sueDayInPeriod}
          </text>
        </g>
      </svg>
    </div>
  );
}
