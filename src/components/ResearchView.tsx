"use client";

import { useState } from "react";
import { CLAIMS_OK, CLAIMS_TO_AVOID, EVIDENCE_BADGE, RESEARCH } from "@/lib/research";
import { SYNODIC_MONTH } from "@/lib/moon";
import { SourceBadge } from "./SourceBadge";
import { copy } from "@/lib/copy";

export function ResearchView() {
  const [open, setOpen] = useState<string | null>("ifc");
  return (
    <div className="space-y-8">
      <header className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {copy.research.kicker}
        </p>
        <h1 className="display text-4xl">{copy.research.title}</h1>
        <p className="mt-3 text-ink-soft">
          {copy.research.intro(SYNODIC_MONTH.toFixed(2))}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <List title={copy.research.canSay} items={CLAIMS_OK} />
        <List title={copy.research.cannotSay} items={CLAIMS_TO_AVOID} tone="avoid" />
      </div>

      <div className="space-y-3">
        {RESEARCH.map((entry) => {
          const expanded = open === entry.id;
          return (
            <article
              key={entry.id}
              className="hud-frame rounded-2xl"
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
                    <span className="font-medium">{copy.research.rule} </span>
                    {entry.rule}
                  </p>
                  <p>
                    <span className="font-medium">{copy.research.inProduct} </span>
                    {entry.appUse}
                  </p>
                  <p className="text-ink-soft">{entry.notes}</p>
                  <a
                    href={entry.sourceUrl}
                    className="inline-block text-brass underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {copy.research.source}
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
    <section className="hud-frame rounded-2xl p-5">
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
