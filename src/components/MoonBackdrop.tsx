"use client";

import { useId } from "react";
import { moonAge, moonLitPath, moonPhaseModel } from "@/lib/moon";

export function MoonBackdrop({ iso }: { iso: string }) {
  const uid = useId().replace(/:/g, "");
  const age = moonAge(iso);
  const model = moonPhaseModel(age);
  const lit = moonLitPath(50, age);
  const lightX = model.waxing ? "62%" : "38%";

  return (
    <div className="moon-backdrop" aria-hidden>
      <div
        className="moon-atmosphere"
        style={{ ["--moon-light-x" as string]: lightX }}
      />
      <svg viewBox="-60 -60 120 120" className="moon-disc">
        <defs>
          <clipPath id={`moon-bg-${uid}`}>
            <circle r="50" />
          </clipPath>
        </defs>
        <circle r="50" className="moon-body" />
        {lit ? (
          <path d={lit} className="moon-lit" clipPath={`url(#moon-bg-${uid})`} />
        ) : null}
      </svg>
    </div>
  );
}
