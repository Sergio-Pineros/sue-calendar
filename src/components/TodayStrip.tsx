"use client";

import Link from "next/link";
import { useSueStore } from "./StoreProvider";
import {
  formatGregorianLong,
  formatSueLabel,
  gregorianToSue,
  todayISO,
} from "@/lib/sue-calendar";
import { MOON_LABELS_ES } from "@/lib/moon";
import { SEASON_LABELS_ES } from "@/lib/seasons";
import { MoonGlyph } from "./MoonGlyph";
import { SourceBadge } from "./SourceBadge";

export function TodayStrip() {
  const { state } = useSueStore();
  const today = gregorianToSue(todayISO(), state.settings.naming);
  return (
    <section className="mb-8 grid gap-4 rounded-3xl border border-line bg-card/70 p-5 md:grid-cols-[1fr_auto]">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          Hoy
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
          <span>
            {MOON_LABELS_ES[today.moon.name]} · {today.moon.illumination}%
          </span>
          <SourceBadge type="calculation" />
        </div>
        <div className="text-ink-soft">
          {SEASON_LABELS_ES[today.season]}
          {today.seasonMarker ? ` · ${today.seasonMarker}` : ""}
        </div>
        {today.suePeriod && (
          <Link
            href={`/period/${today.suePeriod}`}
            className="text-brass underline-offset-4 hover:underline"
          >
            Abrir periodo {today.suePeriodName}
          </Link>
        )}
      </div>
    </section>
  );
}
