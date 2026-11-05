"use client";

import { useEffect } from "react";

export function NativeShell() {
  useEffect(() => {
    void boot();
  }, []);
  return null;
}

async function boot() {
  try {
    const core = await import("@capacitor/core");
    if (!core.Capacitor.isNativePlatform()) return;
    const path = window.location.pathname.replace(/\/$/, "") || "/";
    if (path === "/") {
      window.location.replace("/app/");
      return;
    }
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#100c16" });
  } catch {
    /* web or plugin missing */
  }
}
