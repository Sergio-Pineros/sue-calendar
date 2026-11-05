"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSueStore } from "./StoreProvider";
import { YearWheel } from "./YearWheel";
import { LayerToggles } from "./LayerToggles";
import { copy } from "@/lib/copy";
import {
  daysInGregorianYear,
  gregorianToSue,
  periodName,
  periodRangeLabel,
  todayISO,
} from "@/lib/sue-calendar";
import {
  blendPeriodColors,
  mutePageTone,
  resolvePeriodColors,
} from "@/lib/period-colors";
import {
  doyFromProgress,
  lerpAt,
  offsetFromDoy,
  pathOffset,
  periodIndexFromDoy,
  periodStartDayOfYear,
  progressFromDoy,
  ringAngles,
  snapProgressToNearestDay,
} from "@/lib/wheel-scrub";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { periodNamesFor } from "@/lib/naming";

const R_TEXT = 92.8;
const R_LINE = 87;
const RING_PATH =
  "M " + -R_TEXT + " 0 A " + R_TEXT + " " + R_TEXT + " 0 1 1 " + R_TEXT + " 0 A " + R_TEXT + " " + R_TEXT + " 0 1 1 " + -R_TEXT + " 0";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function YearWheelStage() {
  const router = useRouter();
  const { state } = useSueStore();
  const reduced = usePrefersReducedMotion();
  const year = state.settings.viewYear;
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const names = periodNamesFor(naming.preset, naming.customNames);
  const colors = resolvePeriodColors(
    state.settings.periodColorPreset,
    state.settings.periodColorOverrides,
  );
  const today = todayISO();
  const todayDate = gregorianToSue(today, naming);
  const dim = daysInGregorianYear(year);
  const todayDoy = todayDate.sueYear === year ? todayDate.dayOfYear : 1;
  const angles = useMemo(() => ringAngles(13), []);
  const ringId = useId().replace(/:/g, "");

  const track = useRef<HTMLDivElement | null>(null);
  const root = useRef<HTMLElement | null>(null);
  const dot = useRef<SVGGElement | null>(null);
  const texts = useRef<Array<HTMLDivElement | null>>([]);
  const labels = useRef<Array<SVGTextElement | null>>([]);
  const trigger = useRef<ScrollTrigger | null>(null);
  const lastPeriod = useRef(0);
  const rotor = useRef<SVGGElement | null>(null);
  const [active, setActive] = useState(
    Math.max(0, (todayDate.suePeriod ?? 1) - 1),
  );

  function apply(progress: number) {
    const doy = doyFromProgress(progress, year);
    const nextOffset = offsetFromDoy(doy, todayDoy, dim);
    const restRotation = -(todayDoy - 0.5) * (360 / dim);
    const periodIndex = periodIndexFromDoy(doy, year);
    const start = periodStartDayOfYear(year, periodIndex + 1);
    const mixPos = Math.min(12, periodIndex + (doy - start) / 28);
    const mixed = mutePageTone(blendPeriodColors(colors, mixPos));
    if (root.current) root.current.style.backgroundColor = mixed;
    document.documentElement.style.setProperty("--year-blend", mixed);
    if (rotor.current) {
      rotor.current.style.transform = `rotate(${restRotation + nextOffset}deg)`;
    }
    if (dot.current) {
      dot.current.style.transform = `rotate(${lerpAt(angles, mixPos)}deg)`;
    }
    for (let i = 0; i < 13; i += 1) {
      const d = mixPos - i;
      const near = Math.max(0, 1 - Math.abs(d));
      const tx = texts.current[i];
      if (tx) {
        tx.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.6));
        tx.style.transform = reduced ? "none" : `translateY(${(-d * 10).toFixed(2)}px)`;
        tx.style.visibility = Math.abs(d) < 0.7 ? "visible" : "hidden";
      }
      const nm = labels.current[i];
      if (nm) nm.style.opacity = String(0.48 + 0.52 * near);
    }
    if (periodIndex !== lastPeriod.current) {
      lastPeriod.current = periodIndex;
      setActive(periodIndex);
    }
  }

  useEffect(() => {
    if (!track.current || !root.current) return;
    const startDoy = todayDate.sueYear === year ? todayDoy : 1;
    const st = ScrollTrigger.create({
      trigger: track.current,
      start: "top top",
      end: "bottom bottom",
      snap: reduced
        ? undefined
        : {
            snapTo: (value) => snapProgressToNearestDay(value, year),
            duration: { min: 0.22, max: 0.62 },
            delay: 0.06,
            ease: "power2.inOut",
          },
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    trigger.current = st;
    document.documentElement.setAttribute("data-year-blend", "");
    const y = st.start + progressFromDoy(startDoy, year) * (st.end - st.start);
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "auto" });
      apply(progressFromDoy(startDoy, year));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      st.kill();
      trigger.current = null;
      document.documentElement.removeAttribute("data-year-blend");
      document.documentElement.style.removeProperty("--year-blend");
    };
    // apply reads latest colors/year from this render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, reduced, colors.join(","), todayDoy, dim]);

  function goToProgress(progress: number) {
    const st = trigger.current;
    if (!st) return;
    window.scrollTo({
      top: st.start + progress * (st.end - st.start),
      behavior: reduced ? "auto" : "smooth",
    });
  }

  function goToPeriod(index: number) {
    goToProgress(progressFromDoy(periodStartDayOfYear(year, index + 1), year));
  }

  function onRotate(deltaDeg: number, ended: boolean) {
    const st = trigger.current;
    if (!st) return;
    if (ended) return;
    const range = Math.max(1, st.end - st.start);
    const pixelsPerDegree = range / 360;
    window.scrollBy(0, -deltaDeg * pixelsPerDegree);
  }

  return (
    <div
      ref={track}
      className="year-track"
      style={{ height: "calc(100svh * 10.2)" }}
    >
      <section
        ref={root}
        className="year-stage"
        style={{ backgroundColor: colors[active] }}
        aria-label={`Year wheel for ${year}`}
      >
        <div className="year-stage-bar">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
              {copy.year.kicker}
            </p>
            <h1 className="display text-3xl md:text-4xl">{year}</h1>
          </div>
          <div className="hidden md:block">
            <LayerToggles />
          </div>
        </div>

        <div className="year-copy">
          {Array.from({ length: 13 }, (_, i) => {
            const period = i + 1;
            const range = periodRangeLabel(year, period);
            return (
              <div
                key={period}
                ref={(el) => {
                  texts.current[i] = el;
                }}
                className="year-txt"
                aria-hidden={i !== active}
                style={{ opacity: i === active ? 1 : 0 }}
              >
                <button
                  type="button"
                  className="display text-4xl md:text-5xl"
                  onClick={() => router.push(`/period/${period}`)}
                >
                  {periodName(period, naming)}
                </button>
                <p className="mt-2 text-sm text-ink-soft">
                  {range.start.slice(5)} → {range.end.slice(5)} · {copy.period.weeks}
                </p>
              </div>
            );
          })}
        </div>

        <div className="year-sink">
          <YearWheel
            hideChrome
            driven
            rotorRef={rotor}
            activePeriod={active + 1}
            onRotate={onRotate}
            onHubTap={() => goToProgress(progressFromDoy(todayDoy, year))}
          />
          <svg
            className="year-name-ring"
            viewBox="-100 -100 200 200"
            role="group"
            aria-label={copy.wheel.ring}
          >
            <defs>
              <path id={`${ringId}p`} d={RING_PATH} />
            </defs>
            <circle r={R_LINE} fill="none" stroke="var(--engrave)" strokeWidth="0.35" opacity="0.55" />
            <g
              ref={dot}
              className="year-dot"
              style={{ transform: `rotate(${angles[active] ?? 0}deg)` }}
            >
              <circle cy={-R_LINE} r="1.35" fill="var(--brass)" />
            </g>
            {names.map((name, i) => (
              <text
                key={name + i}
                ref={(el) => {
                  labels.current[i] = el;
                }}
                textAnchor="middle"
                role="button"
                tabIndex={0}
                aria-label={name}
                aria-pressed={i === active}
                onClick={() => goToPeriod(i)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    goToPeriod(i);
                  }
                }}
              >
                <textPath href={`#${ringId}p`} startOffset={`${pathOffset(angles[i])}%`}>
                  {name}
                </textPath>
              </text>
            ))}
          </svg>
        </div>
      </section>
    </div>
  );
}
