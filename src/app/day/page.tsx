"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DayView } from "@/components/DayView";
import { todayISO } from "@/lib/sue-calendar";

function DayFromQuery() {
  const search = useSearchParams();
  const raw = search.get("iso") ?? todayISO();
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : todayISO();
  return <DayView iso={iso} />;
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DayFromQuery />
    </Suspense>
  );
}
