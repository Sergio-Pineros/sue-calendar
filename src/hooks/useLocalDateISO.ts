"use client";

import { useSyncExternalStore } from "react";
import { todayISO } from "@/lib/iso-date";

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 30_000);
  document.addEventListener("visibilitychange", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
  };
}

export function useLocalDateISO(): string {
  return useSyncExternalStore(subscribe, todayISO, todayISO);
}
