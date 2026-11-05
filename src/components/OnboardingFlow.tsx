"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSueStore } from "@/components/StoreProvider";
import { PERIOD_PRESETS } from "@/lib/naming";
import { THEMES } from "@/lib/themes";
import { WEEKDAYS, WEEKDAY_NUMBER_PRESETS } from "@/lib/weekdays";
import { copy } from "@/lib/copy";
import type { NamingSystem } from "@/lib/types";
import { PeriodColorStudio } from "./PeriodColorStudio";

export function OnboardingFlow() {
  const router = useRouter();
  const { state, setNaming, setTheme, updateSettings, completeOnboarding, skipOnboarding } =
    useSueStore();
  const [step, setStep] = useState(0);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <div className="sticky top-0 z-10 flex justify-end bg-paper/80 py-2 backdrop-blur-md">
        <button
          type="button"
          className="tap text-sm text-ink-soft"
          onClick={() => {
            skipOnboarding();
            router.push("/app");
          }}
        >
          {copy.onboarding.skip}
        </button>
      </div>
      <p className="display text-center text-5xl tracking-[-0.04em]">{copy.app.name}</p>
      <div className="mx-auto mt-8 flex gap-2">
        {copy.onboarding.steps.map((label, i) => (
          <span
            key={label}
            className={`h-1.5 w-12 rounded-full ${i <= step ? "bg-ink" : "bg-line"}`}
          />
        ))}
      </div>

      {step === 3 ? (
        <div className="mt-10 space-y-4">
          <h1 className="display text-3xl">{copy.onboarding.colorsTitle}</h1>
          <PeriodColorStudio compact />
        </div>
      ) : (
      <div className="mt-10 space-y-4">
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
                className="ghost-input mt-2 w-full"
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
        {step === 4 && (
          <div className="space-y-3">
            <h1 className="display text-3xl">{copy.onboarding.readyTitle}</h1>
          </div>
        )}
      </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4">
        <button
          type="button"
          className="tap text-sm text-ink-soft"
          onClick={() => {
            skipOnboarding();
            router.push("/app");
          }}
        >
          {copy.onboarding.skip}
        </button>
        <button
          type="button"
          className="tap text-sm text-ink-soft"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          {copy.onboarding.back}
        </button>
        <button
          type="button"
          className="btn-fill rounded-full px-5 text-sm"
          onClick={() => {
            if (step < 4) {
              setStep((s) => s + 1);
              return;
            }
            completeOnboarding();
            router.push("/app");
          }}
        >
          {step === 4 ? copy.onboarding.enter : copy.onboarding.continue}
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
      className={`w-full py-3 text-left ${active ? "text-ink" : "text-ink-soft"}`}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">
        {body}
      </p>
    </button>
  );
}
