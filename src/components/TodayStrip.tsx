"use client";

import Link from "next/link";
import { useSueStore } from "./StoreProvider";
import {
  formatGregorianLong,
  formatSueLabel,
  gregorianToSue,
  todayISO,
} from "@/lib/sue-calendar";
import { moonLabel } from "@/lib/moon";
import { seasonLabel } from "@/lib/seasons";
import { copy } from "@/lib/copy";
import { MoonGlyph } from "./MoonGlyph";
import { SourceBadge } from "./SourceBadge";
import { AsciiMoon } from "./Ascii";

export function TodayStrip() {
  const { state } = useSueStore();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = gregorianToSue(todayISO(), naming);
  return (
    <section className="hud-frame mb-8 grid gap-4 rounded-3xl p-5 md:grid-cols-[1fr_auto]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {copy.today.kicker}
        </p>
        <h1 className="display mt-1 text-3xl md:text-4xl">
          {formatGregorianLong(today.gregorianDate)}
        </h1>
        <p className="mt-2 text-ink-soft">{formatSueLabel(today)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <SourceBadge type="fact" />
          <SourceBadge type="calculation" />
          <SourceBadge type="interpretation" />
        </div>
      </div>
      <div className="flex flex-col justify-end gap-2 text-sm">
        <div className="flex items-center gap-2">
          <MoonGlyph name={today.moon.name} />
          <AsciiMoon name={today.moon.name} />
          <span>
            {moonLabel(today.moon.name)} · {today.moon.illumination}%
          </span>
          <SourceBadge type="calculation" />
        </div>
        <div className="text-ink-soft">
          {seasonLabel(today.season)}
          {today.seasonMarker ? ` · ${copy.seasons[today.seasonMarker]}` : ""}
        </div>
        {today.suePeriod && (
          <Link
            href={`/period/${today.suePeriod}`}
            className="text-brass underline-offset-4 hover:underline"
          >
            {copy.today.openPeriod(today.suePeriodName)}
          </Link>
        )}
      </div>
    </section>
  );
}
