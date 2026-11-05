"use client";

import { useState } from "react";
import { useSueStore } from "./StoreProvider";
import { copy } from "@/lib/copy";
import { periodName } from "@/lib/sue-calendar";
import {
  PERIOD_COLOR_PRESETS,
  PERIOD_SWATCHES,
  periodHasOverride,
  resolvePeriodColors,
} from "@/lib/period-colors";
import type { PeriodColorPreset } from "@/lib/types";

export function PeriodColorStudio({ compact = false }: { compact?: boolean }) {
  const { state, updateSettings } = useSueStore();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const colors = resolvePeriodColors(
    state.settings.periodColorPreset,
    state.settings.periodColorOverrides,
  );
  const [focus, setFocus] = useState(1);

  function applyPreset(preset: PeriodColorPreset) {
    updateSettings({
      periodColorPreset: preset,
      periodColorOverrides: Array.from({ length: 13 }, () => null),
    });
  }

  function applySwatch(hex: string) {
    const next = [...state.settings.periodColorOverrides];
    next[focus - 1] = hex.toLowerCase();
    updateSettings({ periodColorOverrides: next });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {copy.settings.colorPresets}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PERIOD_COLOR_PRESETS.map((preset) => {
            const active =
              state.settings.periodColorPreset === preset.id &&
              !state.settings.periodColorOverrides.some(Boolean);
            return (
              <button
                key={preset.id}
                type="button"
                className={`period-preset ${active ? "is-active" : ""}`}
                onClick={() => applyPreset(preset.id)}
              >
                <span className="period-preset-ramp" aria-hidden>
                  {preset.colors.map((hex) => (
                    <i key={hex} style={{ background: hex }} />
                  ))}
                </span>
                <span className="display text-xl leading-none">{preset.label}</span>
                {!compact && (
                  <span className="text-xs text-ink-soft">{preset.origin}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {copy.settings.pickPeriod}
        </p>
        <div className="period-discs">
          {colors.map((hex, index) => {
            const period = index + 1;
            const active = focus === period;
            return (
              <button
                key={period}
                type="button"
                className={`period-disc ${active ? "is-active" : ""}`}
                style={{ background: hex }}
                onClick={() => setFocus(period)}
                aria-pressed={active}
                aria-label={periodName(period, naming)}
              >
                <span>{periodName(period, naming)}</span>
                {periodHasOverride(state.settings.periodColorOverrides, period) && (
                  <em />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {periodName(focus, naming)} · {copy.settings.colorSwatches}
        </p>
        <div className="period-swatches">
          {PERIOD_SWATCHES.map((hex) => (
            <button
              key={hex}
              type="button"
              className={`period-swatch ${colors[focus - 1] === hex ? "is-active" : ""}`}
              style={{ background: hex }}
              aria-label={hex}
              onClick={() => applySwatch(hex)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
