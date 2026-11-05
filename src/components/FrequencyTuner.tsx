"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSueStore } from "./StoreProvider";
import { copy } from "@/lib/copy";
import {
  DEFAULT_VOLUME,
  FREQUENCY_PRESETS,
  WAVEFORMS,
  beatFor,
  carrierFor,
  formatHz,
  hzToDial,
  dialToHz,
  isFavorite,
  meaningForHz,
  parseHz,
  periodTone,
  snapHz,
  suggestedTone,
  toggleFavorite,
  type Waveform,
} from "@/lib/frequency";
import { ToneEngine } from "@/lib/tone-engine";
import { gregorianToSue, periodName, todayISO } from "@/lib/sue-calendar";
import { activeSprintsOn, sprintIntensityOn } from "@/lib/sprints";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const VOLUME_STEPS = [0.06, 0.12, 0.18, 0.28, 0.4];
const NUDGES = [-10, -1, -0.1, 0.1, 1, 10];
const SCOPE_CHARS = " ·-~=≡█";

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
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
  const [ascii, setAscii] = useState("· · · · · · · ·");
  const [scope, setScope] = useState("");
  const [dragging, setDragging] = useState(false);
  const engine = useRef<ToneEngine | null>(null);
  const lastAngle = useRef(0);

  useEffect(() => {
    engine.current = new ToneEngine();
    return () => engine.current?.dispose();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const analyser = engine.current?.getAnalyser();
      if (analyser) {
        const data = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(data);
        const step = Math.floor(data.length / 48);
        let line = "";
        let path = "";
        for (let i = 0; i < 48; i += 1) {
          const v = data[i * step] / 255;
          line += SCOPE_CHARS[Math.min(6, Math.floor(v * 7))];
          const x = (i / 47) * 200;
          const y = 20 - (v - 0.5) * 36;
          path += (i ? " L " : "M ") + x.toFixed(1) + " " + y.toFixed(1);
        }
        setAscii(line);
        setScope(path);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);

  function patchPlaying(next: {
    hz?: number;
    wave?: Waveform;
    volume?: number;
    binaural?: boolean;
    offset?: number;
  }) {
    engine.current?.update({
      hz: next.hz ?? hz,
      wave: next.wave ?? wave,
      volume: next.volume ?? volume,
      binaural: next.binaural ?? binaural,
      offset: next.offset ?? offset,
    });
  }

  function applyHz(next: number, extra?: { binaural?: boolean; offset?: number }) {
    const snapped = snapHz(next);
    setHz(snapped);
    setTyped(formatHz(snapped));
    if (extra?.binaural !== undefined) setBinaural(extra.binaural);
    if (extra?.offset !== undefined) setOffset(extra.offset);
    patchPlaying({
      hz: snapped,
      binaural: extra?.binaural,
      offset: extra?.offset,
    });
  }

  async function togglePlay() {
    const tone = engine.current;
    if (!tone) return;
    if (tone.isPlaying) {
      tone.stop();
      setPlaying(false);
      return;
    }
    await tone.play({ hz, wave, volume, binaural, offset });
    setPlaying(true);
  }

  function applyPreset(id: string) {
    const preset = FREQUENCY_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    applyHz(preset.hz, {
      binaural: Boolean(preset.binaural),
      offset: preset.binaural ? preset.hz : offset || 4,
    });
  }

  function onDialDown(event: PointerEvent<SVGSVGElement>) {
    setDragging(true);
    lastAngle.current = pointerAngle(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onDialMove(event: PointerEvent<SVGSVGElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const next = pointerAngle(event);
    let delta = next - lastAngle.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    lastAngle.current = next;
    const t = Math.min(1, Math.max(0, hzToDial(hz) + delta / 270));
    applyHz(dialToHz(t));
  }

  function onDialUp(event: PointerEvent<SVGSVGElement>) {
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const needle = -135 + hzToDial(hz) * 270;
  const meaning = meaningForHz(hz);
  const favorites = state.settings.frequencyFavorites;
  const left = carrierFor(hz, binaural);
  const beat = beatFor(hz, binaural, offset);
  const periodHz = periodTone(mapped.suePeriod);

  return (
    <div className="tuner space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">
          {copy.tune.kicker}
        </p>
        <h1 className="display text-4xl">{copy.tune.title}</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">{copy.tune.honesty}</p>
        <p className="mt-2 text-xs text-ink-soft">{copy.tune.safety}</p>
      </header>

      <section className="tuner-suggest">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {copy.tune.today}
        </p>
        <button type="button" className="tuner-chip is-wide" onClick={() => applyHz(suggestion.hz)}>
          <span className="display text-2xl">{suggestion.label}</span>
          <span className="block text-sm text-ink-soft">{suggestion.reason}</span>
        </button>
        <button
          type="button"
          className="tuner-chip is-wide"
          onClick={() => applyHz(periodHz)}
        >
          <span className="display text-xl">
            {periodName(mapped.suePeriod, naming)} · {formatHz(periodHz)} Hz
          </span>
          <span className="block text-sm text-ink-soft">{copy.tune.periodHint}</span>
        </button>
      </section>

      <section className="tuner-stage">
        <svg
          viewBox="0 0 320 320"
          className={`tuner-dial ${dragging ? "is-drag" : ""}`}
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
          <circle cx="160" cy="160" r="144" fill="none" stroke="var(--brass)" strokeWidth="10" />
          <circle cx="160" cy="160" r="136" fill="none" stroke="var(--engrave)" strokeWidth="1.8" opacity="0.7" />
          <path
            d={`M ${polar(160, 160, 124, -135).x} ${polar(160, 160, 124, -135).y} A 124 124 0 1 1 ${polar(160, 160, 124, 135).x} ${polar(160, 160, 124, 135).y}`}
            fill="none"
            stroke="var(--brass)"
            strokeWidth="3"
            opacity="0.85"
          />
          {Array.from({ length: 25 }, (_, i) => {
            const a = -135 + (i / 24) * 270;
            const p0 = polar(160, 160, 112, a);
            const p1 = polar(160, 160, i % 4 === 0 ? 130 : 122, a);
            return (
              <line
                key={i}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                stroke="var(--brass)"
                strokeWidth={i % 4 === 0 ? 2.2 : 1}
                opacity={i % 4 === 0 ? 0.95 : 0.45}
              />
            );
          })}
          {[
            { hz: 20, t: 0 },
            { hz: 200, t: 0.5 },
            { hz: 2000, t: 1 },
          ].map((mark) => {
            const a = -135 + mark.t * 270;
            const p = polar(160, 160, 98, a);
            return (
              <text
                key={mark.hz}
                x={p.x}
                y={p.y}
                fill="var(--ink-soft)"
                fontSize="9"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {mark.hz}
              </text>
            );
          })}
          <g
            className="tuner-needle"
            style={{ transform: `rotate(${needle}deg)` }}
          >
            <line
              x1="160"
              y1="160"
              x2="160"
              y2="50"
              stroke="var(--brass)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
          <circle cx="160" cy="160" r="10" fill="var(--brass)" />
        </svg>

        <div className="tuner-readout">
          <input
            value={typed}
            inputMode="decimal"
            aria-label={copy.tune.hz}
            className="tuner-hz"
            onChange={(event) => setTyped(event.target.value)}
            onBlur={() => {
              const next = parseHz(typed);
              if (next != null) applyHz(next);
              else setTyped(formatHz(hz));
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                const next = parseHz(typed);
                if (next != null) applyHz(next);
              }
            }}
          />
          <span className="tuner-unit">Hz</span>
          {meaning && <p className="mt-2 text-sm text-ink-soft">{meaning}</p>}
        </div>

        <button
          type="button"
          className={`tuner-play ${playing ? "is-on" : ""}`}
          onClick={() => void togglePlay()}
        >
          {playing ? copy.tune.stop : copy.tune.play}
        </button>
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        {NUDGES.map((step) => (
          <button
            key={step}
            type="button"
            className="tuner-chip"
            onClick={() => applyHz(hz + step)}
          >
            {step > 0 ? `+${step}` : String(step)}
          </button>
        ))}
      </div>

      <section>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {copy.tune.wave}
        </p>
        <div className="tuner-waves">
          {WAVEFORMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tuner-wave ${wave === item.id ? "is-active" : ""}`}
              onClick={() => {
                setWave(item.id);
                patchPlaying({ wave: item.id });
              }}
            >
              <span className="tuner-glyph">{item.glyph}</span>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            {copy.tune.volume}
          </p>
          <div className="flex gap-2">
            {VOLUME_STEPS.map((step, index) => (
              <button
                key={step}
                type="button"
                className={`tuner-vol ${volume === step ? "is-active" : ""}`}
                onClick={() => {
                  setVolume(step);
                  patchPlaying({ volume: step });
                }}
                aria-label={`${copy.tune.volume} ${index + 1}`}
              >
                {["·", "░", "▒", "▓", "█"][index]}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`tuner-chip ${binaural ? "is-active" : ""}`}
          onClick={() => {
            const next = !binaural;
            setBinaural(next);
            const nextOffset = next && offset === 0 ? 4 : offset;
            if (next && offset === 0) setOffset(4);
            patchPlaying({ binaural: next, offset: nextOffset });
          }}
        >
          {copy.tune.binaural}
        </button>
      </section>

      {binaural && (
        <div className="space-y-2 text-center">
          <p className="text-sm text-ink-soft">
            {copy.tune.phones} · L {formatHz(left)} / R {formatHz(left + beat)}
          </p>
          {hz >= 20 && (
            <div className="flex flex-wrap justify-center gap-2">
              {[2, 4, 8].map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`tuner-chip ${offset === step ? "is-active" : ""}`}
                  onClick={() => {
                    setOffset(step);
                    patchPlaying({ offset: step });
                  }}
                >
                  {copy.tune.beat} {step}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <section>
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          {copy.tune.presets}
        </p>
        <div className="flex flex-wrap gap-2">
          {FREQUENCY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`tuner-chip ${Math.abs(preset.hz - hz) < 0.05 ? "is-active" : ""}`}
              onClick={() => applyPreset(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            {copy.tune.favorites}
          </p>
          <button
            type="button"
            className="tuner-chip"
            onClick={() =>
              updateSettings({
                frequencyFavorites: toggleFavorite(favorites, hz),
              })
            }
          >
            {isFavorite(favorites, hz) ? copy.tune.unstar : copy.tune.star}
          </button>
        </div>
        {favorites.length === 0 ? (
          <p className="text-sm text-ink-soft">{copy.tune.noFavorites}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {favorites.map((fav) => (
              <button
                key={fav}
                type="button"
                className="tuner-chip"
                onClick={() => applyHz(fav)}
              >
                {formatHz(fav)} Hz
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="tuner-scope" aria-hidden>
        <svg viewBox="0 0 200 40" className="w-full">
          <path
            d={scope || "M 0 20 L 200 20"}
            fill="none"
            stroke="var(--brass)"
            strokeWidth="1.2"
          />
        </svg>
        <pre className="ascii text-center text-[11px] leading-none">
          {playing ? ascii : reduced ? copy.tune.scopeStill : copy.tune.scopeIdle}
        </pre>
      </section>

      <p className="text-center text-xs text-ink-soft">
        {copy.tune.credit}{" "}
        <Link href="/research" className="text-brass underline-offset-4 hover:underline">
          {copy.nav.research}
        </Link>
        .
      </p>
    </div>
  );
}

function pointerAngle(event: PointerEvent<SVGSVGElement>) {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left - rect.width / 2;
  const y = event.clientY - rect.top - rect.height / 2;
  return (Math.atan2(y, x) * 180) / Math.PI;
}
