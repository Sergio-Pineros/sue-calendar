"use client";

import { formatGregorianLong, todayISO } from "@/lib/sue-calendar";

export function TodayStrip() {
  return (
    <h1 className="display text-4xl md:text-5xl">
      {formatGregorianLong(todayISO())}
    </h1>
  );
}
