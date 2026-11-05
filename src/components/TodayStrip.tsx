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

export function TodayStrip() {
  const { state } = useSueStore();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = gregorianToSue(todayISO(), naming);
  return (
    <section className="mb-2">
      <p className="kicker">{copy.today.kicker}</p>
      <h1 className="display mt-1 text-4xl md:text-5xl">
        {formatGregorianLong(today.gregorianDate)}
      </h1>
      <p className="mt-2 text-ink-soft">{formatSueLabel(today)}</p>
      <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
        <MoonGlyph name={today.moon.name} />
        <span>{moonLabel(today.moon.name)}</span>
        <span>{seasonLabel(today.season)}</span>
        {today.suePeriod && (
          <Link href={`/period/${today.suePeriod}`}>{today.suePeriodName}</Link>
        )}
      </p>
    </section>
  );
}
