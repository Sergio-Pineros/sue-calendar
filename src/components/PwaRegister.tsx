"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    void register();
  }, []);
  return null;
}

async function register() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) return;
  } catch {
    /* web */
  }
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    /* unsupported or insecure context */
  }
}
