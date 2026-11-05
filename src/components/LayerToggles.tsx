"use client";

import type { LayerKey } from "@/lib/types";
import { useSueStore } from "./StoreProvider";

const ITEMS: { key: LayerKey; label: string }[] = [
  { key: "events", label: "Eventos" },
  { key: "goals", label: "Metas" },
  { key: "habits", label: "Hábitos" },
  { key: "rest", label: "Descanso" },
  { key: "moon", label: "Luna" },
  { key: "seasons", label: "Estaciones" },
  { key: "personal", label: "Ciclo propio" },
];

export function LayerToggles() {
  const { state, setLayer } = useSueStore();
  return (
    <div className="flex flex-wrap gap-1.5">
      {ITEMS.map((item) => {
        const on = state.settings.layers[item.key];
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => setLayer(item.key, !on)}
            className={`rounded-full border px-3 py-1 text-xs tracking-wide ${
              on
                ? "border-ink bg-ink text-paper"
                : "border-line bg-transparent text-ink-soft"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
