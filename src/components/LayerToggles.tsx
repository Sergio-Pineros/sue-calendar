"use client";

import type { LayerKey } from "@/lib/types";
import { copy } from "@/lib/copy";
import { useSueStore } from "./StoreProvider";

const ITEMS: LayerKey[] = [
  "events",
  "goals",
  "habits",
  "rest",
  "moon",
  "seasons",
  "personal",
  "sabbats",
  "sprints",
];

export function LayerToggles() {
  const { state, setLayer } = useSueStore();
  return (
    <div className="flex flex-wrap gap-1.5">
      {ITEMS.map((key) => {
        const on = state.settings.layers[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => setLayer(key, !on)}
            className={`chip rounded-full border px-3 text-xs tracking-wide ${
              on
                ? "border-line bg-ink/10 text-ink"
                : "border-line bg-transparent text-ink-soft"
            }`}
          >
            {copy.layers[key]}
          </button>
        );
      })}
    </div>
  );
}
