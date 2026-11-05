"use client";

import { useId } from "react";
import type { MoonPhaseName } from "@/lib/types";

export function MoonGlyph({
  name,
  size = 18,
}: {
  name: MoonPhaseName;
  size?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const clip = `moon-${uid}`;
  const cx = 12;
  const cy = 12;
  const r = 8;
  const offset: Record<MoonPhaseName, number> = {
    new: 16,
    "waxing-crescent": 10,
    "first-quarter": 8,
    "waxing-gibbous": 4,
    full: 0,
    "waning-gibbous": -4,
    "last-quarter": -8,
    "waning-crescent": -10,
  };
  const dx = offset[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      className="inline-block shrink-0"
    >
      <defs>
        <clipPath id={clip}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="var(--paper-deep)" />
      {name !== "new" && name !== "full" && (
        <circle
          cx={cx + dx}
          cy={cy}
          r={r}
          fill="var(--lunar)"
          clipPath={`url(#${clip})`}
        />
      )}
      {name === "full" && <circle cx={cx} cy={cy} r={r} fill="var(--lunar)" />}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--engrave)" strokeWidth="1" />
    </svg>
  );
}
