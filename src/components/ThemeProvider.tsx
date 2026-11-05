"use client";

import { useEffect } from "react";
import { useSueStore } from "./StoreProvider";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { state } = useSueStore();
  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
  }, [state.settings.theme]);
  return <>{children}</>;
}
