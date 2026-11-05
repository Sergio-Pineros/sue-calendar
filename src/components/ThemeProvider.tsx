"use client";

import { useEffect } from "react";
import { useSueStore } from "./StoreProvider";
import { applyPeriodColorVars, resolvePeriodColors } from "@/lib/period-colors";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useSueStore();
  const colorKey = `${state.settings.periodColorPreset}:${state.settings.periodColorOverrides.join(",")}`;
  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
    applyPeriodColorVars(
      resolvePeriodColors(
        state.settings.periodColorPreset,
        state.settings.periodColorOverrides,
      ),
    );
  }, [state.settings.theme, colorKey, state.settings.periodColorPreset, state.settings.periodColorOverrides]);
  return <>{children}</>;
}
