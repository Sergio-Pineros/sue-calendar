"use client";

import { useState } from "react";
import { useSueStore } from "@/components/StoreProvider";
import { gregorianToSue, todayISO } from "@/lib/sue-calendar";
import { newReflection } from "@/lib/storage";
import { copy } from "@/lib/copy";

const PROMPTS: { key: keyof ReturnType<typeof emptyAnswers>; label: string }[] = [
  { key: "repeated", label: copy.reflect.repeated },
  { key: "moved", label: copy.reflect.moved },
  { key: "rest", label: copy.reflect.rest },
  { key: "carry", label: copy.reflect.carry },
  { key: "data", label: copy.reflect.data },
];

function emptyAnswers() {
  return { repeated: "", moved: "", rest: "", carry: "", data: "" };
}

export function ReflectView() {
  const { state, upsertReflection, carryFocus } = useSueStore();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = gregorianToSue(todayISO(), naming);
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
        {copy.reflect.kicker}
      </p>
      <h1 className="display text-4xl">{copy.reflect.title(today.suePeriodName)}</h1>
      <p className="text-ink-soft">{copy.reflect.intro}</p>
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
        className="rounded-full bg-ink px-5 text-sm text-paper"
        onClick={save}
      >
        {copy.reflect.save}
      </button>
      {saved && (
        <p className="text-sm text-brass">
          {copy.reflect.saved}
          {answers.carry.trim() ? copy.reflect.carried : ""}
        </p>
      )}
      {today.isYearDay && (
        <p className="rounded-2xl border border-year-day/40 bg-year-day/10 p-4 text-sm">
          {copy.reflect.yearDay}
        </p>
      )}
    </div>
  );
}
