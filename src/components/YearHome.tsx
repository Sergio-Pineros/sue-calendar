"use client";

import { YearWheel } from "@/components/YearWheel";
import { LayerToggles } from "@/components/LayerToggles";
import { useSueStore } from "@/components/StoreProvider";
import { copy } from "@/lib/copy";

export function YearHome() {
  const { state } = useSueStore();
  const year = state.settings.viewYear;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
            {copy.year.kicker}
          </p>
          <h1 className="display text-4xl">{year}</h1>
        </div>
        <LayerToggles />
      </div>
      <p className="mb-6 max-w-xl text-sm text-ink-soft">{copy.year.honesty}</p>
      <YearWheel />
    </div>
  );
}
