"use client";

import { useSyncExternalStore } from "react";

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 20_000);
  document.addEventListener("visibilitychange", onStoreChange);
  window.addEventListener("focus", onStoreChange);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onStoreChange);
    window.removeEventListener("focus", onStoreChange);
  };
}

const minuteNow = () => Math.floor(Date.now() / 60_000);
const serverMinute = () => 0;

/** The current local time to the minute; null while rendering on the server. */
export function useNowMinute(): Date | null {
  const minute = useSyncExternalStore(subscribe, minuteNow, serverMinute);
  return minute === 0 ? null : new Date(minute * 60_000);
}
