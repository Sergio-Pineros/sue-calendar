"use client";

import { useState } from "react";
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
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {ITEMS.map((key) => {
        const on = state.settings.layers[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => setLayer(key, !on)}
            className={`min-h-11 bg-transparent px-0 text-sm ${
              on ? "text-ink" : "text-ink-soft"
            }`}
          >
            {copy.layers[key]}
          </button>
        );
      })}
    </div>
  );
}

export function LayersDisclosure() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        className="layers-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {copy.year.layers}
      </button>
      {open && <div className="mt-3"><LayerToggles /></div>}
    </div>
  );
}
