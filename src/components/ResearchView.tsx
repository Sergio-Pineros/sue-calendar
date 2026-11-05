"use client";

import { useState } from "react";
import { CLAIMS_OK, CLAIMS_TO_AVOID, RESEARCH } from "@/lib/research";
import { SYNODIC_MONTH } from "@/lib/moon";
import { SourceBadge } from "./SourceBadge";

const EVIDENCE_BADGE = {
  "Hecho histórico": "fact",
  "Cálculo astronómico": "calculation",
  "Interpretación moderna": "interpretation",
  "Requisito de producto": "personal",
} as const;

export function ResearchView() {
  const [open, setOpen] = useState<string | null>("ifc");
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          Origen
        </p>
        <h1 className="display text-4xl">Qué es SÚE, y qué no es</h1>
        <p className="mt-3 text-ink-soft">
          SÚE toma la claridad de un calendario fijo de 13 × 28 como lente de
          planificación. No afirma que la humanidad usara un único calendario
          universal de 13 meses. Un mes lunar dura unos {SYNODIC_MONTH} días,
          no 28.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <List title="SÚE puede decir" items={CLAIMS_OK} />
        <List title="SÚE no dice" items={CLAIMS_TO_AVOID} tone="avoid" />
      </div>

      <div className="space-y-3">
        {RESEARCH.map((entry) => {
          const expanded = open === entry.id;
          return (
            <article
              key={entry.id}
              className="rounded-2xl border border-line bg-card/80"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 p-4 text-left"
                onClick={() => setOpen(expanded ? null : entry.id)}
              >
                <div>
                  <div className="mb-2 flex flex-wrap gap-2">
                    <SourceBadge type={EVIDENCE_BADGE[entry.evidence]} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                      {entry.category}
                    </span>
                  </div>
                  <h2 className="display text-2xl">{entry.title}</h2>
                  <p className="mt-1 text-sm text-ink-soft">{entry.summary}</p>
                </div>
                <span className="font-mono text-ink-soft">
                  {expanded ? "–" : "+"}
                </span>
              </button>
              {expanded && (
                <div className="space-y-2 border-t border-line px-4 py-4 text-sm">
                  <p>
                    <span className="font-medium">Regla: </span>
                    {entry.rule}
                  </p>
                  <p>
                    <span className="font-medium">En el producto: </span>
                    {entry.appUse}
                  </p>
                  <p className="text-ink-soft">{entry.notes}</p>
                  <a
                    href={entry.sourceUrl}
                    className="inline-block text-brass underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Fuente
                  </a>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function List({
  title,
  items,
  tone = "ok",
}: {
  title: string;
  items: string[];
  tone?: "ok" | "avoid";
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h2 className="display text-2xl">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className={tone === "ok" ? "text-rest" : "text-year-day"}>
              {tone === "ok" ? "○" : "×"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
