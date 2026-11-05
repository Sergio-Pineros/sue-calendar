"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useSueStore } from "./StoreProvider";
import { copy } from "@/lib/copy";
import {
  DEFAULT_VOLUME,
  FREQUENCY_PRESETS,
  WAVEFORMS,
  formatHz,
  hzToDial,
  dialToHz,
  isFavorite,
  parseHz,
  snapHz,
  suggestedTone,
  toggleFavorite,
  type Waveform,
} from "@/lib/frequency";
import { ToneEngine } from "@/lib/tone-engine";
import { gregorianToSue, todayISO } from "@/lib/sue-calendar";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { haptic } from "@/lib/haptic";
import { project, rubberbandT, settled, springStep } from "@/lib/spring";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const VOLUME_STEPS = [0.06, 0.12, 0.18, 0.28, 0.4];
const ARC = 270;
const START = -135;

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function pointerAngle(event: PointerEvent<SVGSVGElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  return (Math.atan2(
    event.clientY - rect.top - rect.height / 2,
    event.clientX - rect.left - rect.width / 2,
  ) * 180) / Math.PI + 90;
}

export function FrequencyTuner() {
  const { state, updateSettings } = useSueStore();
  const reduced = usePrefersReducedMotion();
  const naming = {
    preset: state.settings.naming,
    customNames: state.settings.customPeriodNames,
  };
  const today = todayISO();
  const mapped = gregorianToSue(today, naming);
  const sprint = activeSprintsOn(state.sprints, today)[0];
  const intensity = sprint ? sprintIntensityOn(sprint, today) : null;
  const rest = Boolean(state.restBlocks.find((block) => block.date === today));
  const suggestion = suggestedTone({
    moon: mapped.moon.name,
    period: mapped.suePeriod,
    intensity,
    rest,
  });

  const search = useSearchParams();
  const initialHz = parseHz(search.get("hz") ?? "") ?? suggestion.hz;
  const [hz, setHz] = useState(initialHz);
  const [wave, setWave] = useState<Waveform>("sine");
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [playing, setPlaying] = useState(false);
  const [binaural, setBinaural] = useState(Boolean(suggestion.binaural));
  const [offset, setOffset] = useState(suggestion.binaural ? suggestion.hz : 4);
  const [typed, setTyped] = useState(formatHz(initialHz));
  const [sheet, setSheet] = useState(false);
  const [needle, setNeedle] = useState(START + hzToDial(initialHz) * ARC);

  const engine = useRef<ToneEngine | null>(null);
  const hzRef = useRef(initialHz);
  const tRef = useRef(hzToDial(initialHz));
  const velRef = useRef(0);
  const grabRef = useRef(0);
  const draggingRef = useRef(false);
  const lastA = useRef(0);
  const lastT = useRef(0);
  const samples = useRef<Array<{ t: number; a: number }>>([]);
  const lastDetent = useRef(initialHz);
  const scopeRef = useRef<SVGPathElement | null>(null);
  const springing = useRef(0);

  useEffect(() => {
    engine.current = new ToneEngine();
    return () => engine.current?.dispose();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const analyser = engine.current?.getAnalyser();
      const path = scopeRef.current;
      if (analyser && path) {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        const n = 72;
        const step = Math.floor(data.length / n);
        let d = "";
        for (let i = 0; i < n; i += 1) {
          const v = data[i * step] / 255;
          const a = -180 + (i / (n - 1)) * 360;
          const p = polar(160, 160, 78 + (v - 0.5) * 22, a);
          d += `${i ? " L" : "M"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        }
        path.setAttribute("d", d);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);

  function commitHz(next: number, extra?: { binaural?: boolean; offset?: number }) {
    const snapped = snapHz(next);
    hzRef.current = snapped;
    setHz(snapped);
    setTyped(formatHz(snapped));
    if (extra?.binaural !== undefined) setBinaural(extra.binaural);
    if (extra?.offset !== undefined) setOffset(extra.offset);
    engine.current?.update({
      hz: snapped,
      wave,
      volume,
      binaural: extra?.binaural ?? binaural,
      offset: extra?.offset ?? offset,
    });
    if (Math.abs(snapped - lastDetent.current) >= 1) {
      const hit = FREQUENCY_PRESETS.some((item) => Math.abs(item.hz - snapped) < 0.6);
      if (hit) haptic("rigid");
      lastDetent.current = snapped;
    }
  }

  function applyT(t: number, live: boolean) {
    const visual = live ? rubberbandT(t) : clampT(t);
    tRef.current = visual;
    setNeedle(START + visual * ARC);
    commitHz(dialToHz(clampT(visual)));
  }

  function clampT(t: number) {
    return Math.min(1, Math.max(0, t));
  }

  function springTo(targetT: number, velocity: number, damping: number) {
    window.cancelAnimationFrame(springing.current);
    if (reduced) {
      applyT(targetT, false);
      velRef.current = 0;
      return;
    }
    let current = tRef.current;
    let v = velocity;
    const step = (now: number) => {
      const prev = lastT.current || now;
      const dt = Math.min(0.032, (now - prev) / 1000 || 1 / 60);
      lastT.current = now;
      const next = springStep(current, targetT, v, dt, damping, 0.62);
      current = next.value;
      v = next.velocity;
      velRef.current = v;
      applyT(current, true);
      if (settled(current, targetT, v)) {
        applyT(targetT, false);
        return;
      }
      springing.current = window.requestAnimationFrame(step);
    };
    lastT.current = 0;
    springing.current = window.requestAnimationFrame(step);
  }

  function onDialDown(event: PointerEvent<SVGSVGElement>) {
    window.cancelAnimationFrame(springing.current);
    draggingRef.current = true;
    const pointer = pointerAngle(event);
    grabRef.current = pointer - (START + tRef.current * ARC);
    lastA.current = pointer;
    lastT.current = event.timeStamp;
    samples.current = [{ t: event.timeStamp, a: pointer }];
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDialMove(event: PointerEvent<SVGSVGElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const pointer = pointerAngle(event);
    const now = event.timeStamp;
    samples.current.push({ t: now, a: pointer });
    if (samples.current.length > 6) samples.current.shift();
    lastA.current = pointer;
    lastT.current = now;
    applyT((pointer - grabRef.current - START) / ARC, true);
  }

  function onDialUp(event: PointerEvent<SVGSVGElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    draggingRef.current = false;
    const hist = samples.current;
    let velocity = 0;
    if (hist.length >= 2) {
      const a = hist[0];
      const b = hist[hist.length - 1];
      const dt = Math.max(8, b.t - a.t);
      velocity = ((b.a - a.a) / ARC / dt) * 1000;
    }
    const projected = tRef.current + project(velocity, 0.99);
    const target = clampT(projected);
    const flick = Math.abs(velocity) > 0.35;
    springTo(target, velocity, flick ? 0.8 : 1);
  }

  async function playNow() {
    const tone = engine.current;
    if (!tone) return;
    haptic("light");
    if (tone.isPlaying) {
      tone.stop();
      setPlaying(false);
      return;
    }
    await tone.play({ hz: hzRef.current, wave, volume, binaural, offset });
    setPlaying(true);
  }

  function applyPreset(id: string) {
    const preset = FREQUENCY_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    haptic("rigid");
    const nextBinaural = Boolean(preset.binaural);
    const nextOffset = preset.binaural ? preset.hz : offset || 4;
    setBinaural(nextBinaural);
    setOffset(nextOffset);
    tRef.current = hzToDial(Math.max(20, preset.hz));
    commitHz(preset.hz, { binaural: nextBinaural, offset: nextOffset });
    springTo(hzToDial(Math.max(20, preset.hz)), 0, 1);
  }

  const favorites = state.settings.frequencyFavorites;

  return (
    <div className="tuner">
      <header className="tuner-head">
        <p className="tuner-safety">{copy.tune.safety}</p>
      </header>

      <section className="tuner-hero">
        <svg
          viewBox="0 0 320 320"
          className="tuner-dial"
          onPointerDown={onDialDown}
          onPointerMove={onDialMove}
          onPointerUp={onDialUp}
          onPointerCancel={onDialUp}
          role="slider"
          aria-valuemin={20}
          aria-valuemax={2000}
          aria-valuenow={Math.round(hz)}
          aria-label={copy.tune.dial}
        >
          <circle cx="160" cy="160" r="150" fill="var(--paper-deep)" />
          <circle cx="160" cy="160" r="148" fill="none" stroke="var(--engrave)" strokeWidth="1.2" opacity="0.4" />
          <circle cx="160" cy="160" r="88" fill="var(--paper)" opacity="0.4" />
          <path
            d={`M ${polar(160, 160, 126, START).x} ${polar(160, 160, 126, START).y} A 126 126 0 1 1 ${polar(160, 160, 126, START + ARC).x} ${polar(160, 160, 126, START + ARC).y}`}
            fill="none"
            stroke="var(--engrave)"
            strokeWidth="2"
            opacity="0.55"
          />
          {Array.from({ length: 25 }, (_, i) => {
            const a = START + (i / 24) * ARC;
            const p0 = polar(160, 160, 114, a);
            const p1 = polar(160, 160, i % 4 === 0 ? 132 : 124, a);
            return (
              <line
                key={i}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke="var(--engrave)"
                strokeWidth={i % 4 === 0 ? 1.6 : 0.8}
                opacity={i % 4 === 0 ? 0.55 : 0.22}
              />
            );
          })}
          <path
            ref={scopeRef}
            className="tuner-scope"
            d="M 80 160 A 80 80 0 1 1 240 160"
            fill="none"
            stroke="var(--engrave)"
            strokeWidth="1"
            opacity="0.22"
          />
          <g style={{ transform: `rotate(${needle}deg)`, transformOrigin: "160px 160px" }}>
            <line x1="160" y1="160" x2="160" y2="42" stroke="var(--ink-soft)" strokeWidth="2.4" strokeLinecap="round" />
          </g>
          <circle cx="160" cy="160" r="8" fill="var(--ink-soft)" />
        </svg>
      </section>

      <div className="tuner-readout">
        <button type="button" className="tuner-nudge" onPointerDown={() => commitHz(hz - (hz < 100 ? 0.1 : 1))}>
          −
        </button>
        <label className="tuner-hz-wrap">
          <input
            value={typed}
            inputMode="decimal"
            aria-label={copy.tune.hz}
            className="tuner-hz"
            onChange={(event) => setTyped(event.target.value)}
            onBlur={() => {
              const next = parseHz(typed);
              if (next == null) {
                setTyped(formatHz(hz));
                return;
              }
              commitHz(next);
              springTo(hzToDial(Math.min(2000, Math.max(20, next))), 0, 1);
            }}
          />
          <span className="tuner-unit">Hz</span>
        </label>
        <button type="button" className="tuner-nudge" onPointerDown={() => commitHz(hz + (hz < 100 ? 0.1 : 1))}>
          +
        </button>
      </div>

      <button
        type="button"
        className={`tuner-play ${playing ? "is-on" : ""}`}
        onPointerDown={(event) => {
          event.preventDefault();
          void playNow();
        }}
      >
        {playing ? copy.tune.stop : copy.tune.play}
      </button>

      <div className="tuner-presets" aria-label={copy.tune.presets}>
        {FREQUENCY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={Math.abs(preset.hz - hz) < 0.05 ? "is-active" : ""}
            onPointerDown={() => applyPreset(preset.id)}
          >
            {preset.hz < 20 ? preset.hz.toFixed(2) : String(preset.hz)}
          </button>
        ))}
      </div>

      <div className="tuner-secondary">
        {WAVEFORMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={wave === item.id ? "is-active" : ""}
            aria-label={item.label}
            onPointerDown={() => {
              setWave(item.id);
              engine.current?.update({ wave: item.id, hz, volume, binaural, offset });
            }}
          >
            {item.glyph}
          </button>
        ))}
        <button type="button" className="is-more" onPointerDown={() => setSheet(true)}>
          {copy.tune.more}
        </button>
      </div>

      {sheet && (
        <TunerSheet
          reduced={reduced}
          volume={volume}
          binaural={binaural}
          offset={offset}
          hz={hz}
          favorites={favorites}
          onClose={() => setSheet(false)}
          onVolume={(next) => {
            setVolume(next);
            engine.current?.update({ volume: next, hz, wave, binaural, offset });
          }}
          onBinaural={() => {
            const next = !binaural;
            const nextOffset = next && offset === 0 ? 4 : offset;
            setBinaural(next);
            if (next && offset === 0) setOffset(4);
            engine.current?.update({ binaural: next, offset: nextOffset, hz, wave, volume });
          }}
          onOffset={(next) => {
            setOffset(next);
            engine.current?.update({ offset: next, hz, wave, volume, binaural });
          }}
          onFavorite={() =>
            updateSettings({ frequencyFavorites: toggleFavorite(favorites, hz) })
          }
          onFav={(fav) => {
            commitHz(fav);
            springTo(hzToDial(Math.max(20, fav)), 0, 1);
            setSheet(false);
          }}
        />
      )}
    </div>
  );
}

function TunerSheet({
  reduced,
  volume,
  binaural,
  offset,
  hz,
  favorites,
  onClose,
  onVolume,
  onBinaural,
  onOffset,
  onFavorite,
  onFav,
}: {
  reduced: boolean;
  volume: number;
  binaural: boolean;
  offset: number;
  hz: number;
  favorites: number[];
  onClose: () => void;
  onVolume: (value: number) => void;
  onBinaural: () => void;
  onOffset: (value: number) => void;
  onFavorite: () => void;
  onFav: (hz: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [holding, setHolding] = useState(false);
  const startY = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const vel = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  function dismiss() {
    setOpen(false);
    window.setTimeout(onClose, reduced ? 0 : 280);
  }

  return (
    <div className="sheet" role="dialog" aria-label={copy.tune.more}>
      <button type="button" className={`sheet-scrim ${open ? "is-open" : ""}`} aria-label={copy.tune.close} onClick={dismiss} />
      <div
        className={`sheet-panel ${open ? "is-open" : ""}`}
        style={{
          transform: open ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: holding || reduced ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="sheet-handle"
          onPointerDown={(event) => {
            dragging.current = true;
            setHolding(true);
            startY.current = event.clientY;
            lastY.current = event.clientY;
            lastT.current = performance.now();
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!dragging.current) return;
            const now = performance.now();
            vel.current = ((event.clientY - lastY.current) / Math.max(8, now - lastT.current)) * 1000;
            lastY.current = event.clientY;
            lastT.current = now;
            setDragY(Math.max(0, event.clientY - startY.current));
          }}
          onPointerUp={() => {
            dragging.current = false;
            setHolding(false);
            if (dragY > 72 || vel.current > 800) dismiss();
            else setDragY(0);
          }}
        >
          <span />
        </div>
        <div className="sheet-body">
          <p className="kicker">{copy.tune.volume}</p>
          <div className="tuner-vols">
            {VOLUME_STEPS.map((step, index) => (
              <button
                key={step}
                type="button"
                className={volume === step ? "is-active" : ""}
                aria-label={`${copy.tune.volume} ${index + 1}`}
                onPointerDown={() => onVolume(step)}
              >
                {["·", "░", "▒", "▓", "█"][index]}
              </button>
            ))}
          </div>
          <button type="button" className={`tuner-text-btn ${binaural ? "is-active" : ""}`} onPointerDown={onBinaural}>
            {copy.tune.binaural}
          </button>
          {binaural && hz >= 20 && (
            <div className="tuner-vols">
              {[2, 4, 8].map((step) => (
                <button
                  key={step}
                  type="button"
                  className={offset === step ? "is-active" : ""}
                  onPointerDown={() => onOffset(step)}
                >
                  {step}
                </button>
              ))}
            </div>
          )}
          <button type="button" className="tuner-text-btn" onPointerDown={onFavorite}>
            {isFavorite(favorites, hz) ? copy.tune.unstar : copy.tune.star}
          </button>
          {favorites.length > 0 && (
            <div className="tuner-presets">
              {favorites.map((fav) => (
                <button key={fav} type="button" onPointerDown={() => onFav(fav)}>
                  {formatHz(fav)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
