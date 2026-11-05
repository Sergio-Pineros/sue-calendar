"use client";

import { useState } from "react";
import { useSueStore } from "@/components/StoreProvider";
import {
  gregorianToSue,
  todayISO,
} from "@/lib/sue-calendar";
import { newReflection } from "@/lib/storage";

const PROMPTS: { key: keyof ReturnType<typeof emptyAnswers>; label: string }[] = [
  { key: "repeated", label: "¿Qué se repitió?" },
  { key: "moved", label: "¿Qué avanzó?" },
  { key: "rest", label: "¿Qué necesita descanso?" },
  { key: "carry", label: "¿Qué atraviesa al siguiente ciclo?" },
  { key: "data", label: "¿Qué mostraron tus datos personales?" },
];

function emptyAnswers() {
  return { repeated: "", moved: "", rest: "", carry: "", data: "" };
}

export function ReflectView() {
  const { state, upsertReflection, carryFocus } = useSueStore();
  const today = gregorianToSue(todayISO(), state.settings.naming);
  const existing = state.reflections.find(
    (r) =>
      r.scope === "period" &&
      r.sueYear === today.sueYear &&
      r.suePeriod === today.suePeriod,
  );
  const [answers, setAnswers] = useState(
    existing?.answers ?? emptyAnswers(),
  );
  const [saved, setSaved] = useState(false);

  function save() {
    const draft =
      existing ??
      newReflection(
        "period",
        today.sueYear,
        today.suePeriod,
        today.sueWeekInPeriod,
      );
    upsertReflection({ ...draft, answers });
    if (answers.carry.trim() && today.suePeriod) {
      carryFocus(today.sueYear, today.suePeriod, answers.carry.trim());
    }
    setSaved(true);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        Revisión
      </p>
      <h1 className="display text-4xl">
        Cierre de {today.suePeriodName}
      </h1>
      <p className="text-ink-soft">
        Sin racha. Sin culpa. Solo un borde claro entre un ciclo de cuatro
        semanas y el siguiente.
      </p>
      {PROMPTS.map((prompt) => (
        <label key={prompt.key} className="block">
          <span className="text-sm font-medium">{prompt.label}</span>
          <textarea
            value={answers[prompt.key]}
            onChange={(e) =>
              setAnswers((a) => ({ ...a, [prompt.key]: e.target.value }))
            }
            rows={3}
            className="mt-2 w-full rounded-2xl border border-line bg-card px-4 py-3 text-sm outline-none focus:border-ink"
          />
        </label>
      ))}
      <button
        type="button"
        className="rounded-full bg-ink px-5 py-2 text-sm text-paper"
        onClick={save}
      >
        Guardar revisión
      </button>
      {saved && (
        <p className="text-sm text-brass">
          Guardado.
          {answers.carry.trim()
            ? " Lo que atraviesa ya está como foco del siguiente periodo."
            : ""}
        </p>
      )}
      {today.isYearDay && (
        <p className="rounded-2xl border border-year-day/40 bg-year-day/10 p-4 text-sm">
          Hoy es Year Day: un borde anual, no un día más del periodo.
        </p>
      )}
    </div>
  );
}
