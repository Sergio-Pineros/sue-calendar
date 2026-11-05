"use client";

import Link from "next/link";
import { PeriodGrid } from "@/components/PeriodGrid";
import { LayerToggles } from "@/components/LayerToggles";
import { useSueStore } from "@/components/StoreProvider";
import { periodName } from "@/lib/sue-calendar";
import { copy } from "@/lib/copy";
import { useState } from "react";

export function PeriodPage({ period }: { period: number }) {
  const { state, setPeriodFocus } = useSueStore();
  const [title, setTitle] = useState("");
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const prev = period === 1 ? 13 : period - 1;
  const next = period === 13 ? 1 : period + 1;
  const existing = state.goals.find(
    (g) =>
      g.sueYear === state.settings.viewYear &&
      g.suePeriod === period &&
      g.status !== "complete",
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/period/${prev}`} className="font-mono text-sm text-ink-soft">
          ← {periodName(prev, naming)}
        </Link>
        <Link href={`/period/${next}`} className="font-mono text-sm text-ink-soft">
          {periodName(next, naming)} →
        </Link>
      </div>
      <LayerToggles />
      <PeriodGrid period={period} />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          setPeriodFocus(state.settings.viewYear, period, title.trim());
          setTitle("");
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            existing
              ? copy.period.replaceFocus(existing.title)
              : copy.period.placeholder
          }
          className="ghost-input flex-1"
        />
        <button className="ghost-action">
          {copy.period.saveFocus}
        </button>
      </form>
    </div>
  );
}
