"use client";

import { Suspense } from "react";
import { FrequencyTuner } from "@/components/FrequencyTuner";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <FrequencyTuner />
    </Suspense>
  );
}
