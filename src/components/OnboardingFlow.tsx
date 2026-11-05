"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSueStore } from "@/components/StoreProvider";
import { PERIOD_PRESETS } from "@/lib/naming";
import { THEMES } from "@/lib/themes";
import { WEEKDAYS, WEEKDAY_NUMBER_PRESETS } from "@/lib/weekdays";
import { copy } from "@/lib/copy";
import type { NamingSystem } from "@/lib/types";

export function OnboardingFlow() {
  const router = useRouter();
  const { state, setNaming, setTheme, updateSettings, completeOnboarding } = useSueStore();
  const [step, setStep] = useState(0);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="display text-center text-5xl tracking-[0.4em]">{copy.app.name}</p>
      <p className="mt-4 text-center text-ink-soft">{copy.onboarding.intro}</p>
      <div className="mx-auto mt-8 flex gap-2">
        {copy.onboarding.steps.map((label, i) => (
          <span
            key={label}
            className={`h-1.5 w-12 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`}
          />
        ))}
      </div>

      <div className="hud-frame mt-10 rounded-3xl p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h1 className="display text-3xl">{copy.onboarding.namesTitle}</h1>
            {PERIOD_PRESETS.filter((preset) => preset.id !== "custom").map((preset) => (
              <Choice
                key={preset.id}
                active={state.settings.naming === preset.id}
                title={preset.label}
                body={preset.origin}
                onClick={() => setNaming(preset.id as NamingSystem)}
              />
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="display text-3xl">{copy.onboarding.weekTitle}</h1>
            <p className="text-ink-soft">{copy.onboarding.weekBody}</p>
            <div className="grid gap-2">
              {WEEKDAY_NUMBER_PRESETS.filter((preset) => preset.id !== "custom").map((preset) => (
                <Choice
                  key={preset.id}
                  active={state.settings.weekdayNumberPreset === preset.id}
                  title={preset.label}
                  body={preset.origin}
                  onClick={() =>
                    updateSettings({ weekdayNumberPreset: preset.id })
                  }
                />
              ))}
            </div>
            <label className="block text-sm">
              {copy.settings.weekStart}
              <select
                value={state.settings.weekStart}
                onChange={(event) =>
                  updateSettings({ weekStart: Number(event.target.value) })
                }
                className="mt-2 w-full rounded-full border border-line bg-card px-4"
              >
                {WEEKDAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h1 className="display text-3xl">{copy.onboarding.themeTitle}</h1>
            <p className="text-sm text-ink-soft">{copy.onboarding.themeBody}</p>
            {THEMES.map((theme) => (
              <Choice
                key={theme.id}
                active={state.settings.theme === theme.id}
                title={theme.label}
                body={theme.origin}
                onClick={() => setTheme(theme.id)}
              />
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <h1 className="display text-3xl">{copy.onboarding.readyTitle}</h1>
            <p className="text-ink-soft">{copy.onboarding.readyBody}</p>
            <p className="text-ink-soft">{copy.onboarding.calendarBody}</p>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          className="text-sm text-ink-soft"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          {copy.onboarding.back}
        </button>
        <button
          type="button"
          className="rounded-full bg-ink px-5 text-sm text-paper"
          onClick={() => {
            if (step < 3) {
              setStep((s) => s + 1);
              return;
            }
            completeOnboarding();
            router.push("/");
          }}
        >
          {step === 3 ? copy.onboarding.enter : copy.onboarding.continue}
        </button>
      </div>
    </div>
  );
}

function Choice({
  active,
  title,
  body,
  onClick,
}: {
  active: boolean;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left ${
        active ? "border-ink bg-ink text-paper" : "border-line"
      }`}
    >
      <p className="font-medium">{title}</p>
      <p className={`mt-1 text-sm ${active ? "text-paper/70" : "text-ink-soft"}`}>
        {body}
      </p>
    </button>
  );
}
