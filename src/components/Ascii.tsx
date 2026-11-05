"use client";

import { useEffect, useState } from "react";
import type { MoonPhaseName } from "@/lib/types";
import { ASCII_MOON } from "@/lib/moon";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const VINES = [
  "   .\n   |\n",
  "   .\n  \\|\n   |\n",
  "   .\n  \\|/\n   |\n",
  "   .\n  \\|/\n  \\|/\n   |\n",
  "  *.\n ~\\|/\n  \\|/\n  ~|\n",
];

export function AsciiMoon({ name }: { name: MoonPhaseName }) {
  return <span className="ascii">{ASCII_MOON[name]}</span>;
}

export function AsciiVine({ active = true }: { active?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active || reduced) return;
    const id = window.setInterval(() => {
      setFrame((n) => (n + 1) % VINES.length);
    }, 220);
    return () => window.clearInterval(id);
  }, [active, reduced]);
  const shown = !active || reduced ? VINES.length - 1 : frame;
  return <span className="ascii text-[10px]">{VINES[shown]}</span>;
}

const GLYPHS = "ᛟᚠᚨ*+×⟡✺◉◎†‡§#";

function scramble(text: string, frame: number): string {
  const total = 8;
  return text
    .split("")
    .map((char, index) =>
      char === " " || frame / total > index / Math.max(text.length, 1)
        ? char
        : GLYPHS[(index + frame) % GLYPHS.length],
    )
    .join("");
}

export function GlyphScramble({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const [frame, setFrame] = useState(8);
  useEffect(() => {
    if (reduced) return;
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setFrame(n);
      if (n >= 8) window.clearInterval(id);
    }, 40);
    return () => window.clearInterval(id);
  }, [reduced, text]);
  return <span className={className}>{reduced || frame >= 8 ? text : scramble(text, frame)}</span>;
}
