import type { EvidenceType } from "@/lib/types";
import { copy } from "@/lib/copy";

const CLASS: Record<EvidenceType, string> = {
  fact: "source-fact",
  calculation: "source-calc",
  interpretation: "source-interp",
  personal: "source-personal",
};

export function SourceBadge({ type }: { type: EvidenceType }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${CLASS[type]}`}
    >
      {copy.evidence[type]}
    </span>
  );
}
