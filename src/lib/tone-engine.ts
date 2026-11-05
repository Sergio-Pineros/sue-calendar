import {
  beatFor,
  carrierFor,
  clampHz,
  DEFAULT_VOLUME,
  FADE_SECONDS,
  MAX_VOLUME,
  type Waveform,
} from "./frequency";

export type TonePatch = {
  hz: number;
  volume: number;
  wave: Waveform;
  binaural: boolean;
  offset: number;
};

/**
 * Web Audio oscillator with fade-in/out, modelled on the MIT
 * frequency-tone-generator (createOscillator → destination) plus
 * a master gain, analyser, and optional stereo pair for binaural beats.
 */
export class ToneEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private oscL: OscillatorNode | null = null;
  private oscR: OscillatorNode | null = null;
  private playing = false;
  private patch: TonePatch = {
    hz: 432,
    volume: DEFAULT_VOLUME,
    wave: "sine",
    binaural: false,
    offset: 0,
  };

  get isPlaying(): boolean {
    return this.playing;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  async ensure(): Promise<AudioContext> {
    if (!this.ctx) {
      const Ctor = window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.master.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") await this.ctx.resume();
    return this.ctx;
  }

  async play(patch: TonePatch): Promise<void> {
    this.patch = patch;
    const ctx = await this.ensure();
    this.stopOscillators(true);
    this.connectOscillators(ctx, patch);
    this.ramp(Math.min(MAX_VOLUME, Math.max(0, patch.volume)));
    this.playing = true;
  }

  stop(): void {
    if (!this.ctx || !this.master) {
      this.playing = false;
      return;
    }
    this.ramp(0);
    const dying = [this.oscL, this.oscR];
    this.oscL = null;
    this.oscR = null;
    this.playing = false;
    window.setTimeout(() => {
      for (const osc of dying) {
        if (!osc) continue;
        try {
          osc.stop();
        } catch {
          /* already stopped */
        }
        osc.disconnect();
      }
    }, FADE_SECONDS * 1000 + 20);
  }

  update(patch: Partial<TonePatch>): void {
    this.patch = { ...this.patch, ...patch };
    if (!this.playing || !this.ctx) return;
    const needsRebuild =
      patch.wave !== undefined ||
      patch.binaural !== undefined ||
      (patch.offset !== undefined && this.patch.binaural) ||
      (patch.hz !== undefined && this.patch.binaural && this.patch.hz < 20);
    if (needsRebuild) {
      void this.play(this.patch);
      return;
    }
    const now = this.ctx.currentTime;
    const hz = clampHz(this.patch.hz);
    const beat = beatFor(hz, this.patch.binaural, this.patch.offset);
    const left = carrierFor(hz, this.patch.binaural);
    this.oscL?.frequency.setTargetAtTime(left, now, 0.03);
    this.oscR?.frequency.setTargetAtTime(left + beat, now, 0.03);
    if (patch.volume !== undefined && this.master) {
      this.master.gain.setTargetAtTime(
        Math.min(MAX_VOLUME, Math.max(0, patch.volume)),
        now,
        0.04,
      );
    }
  }

  dispose(): void {
    this.stop();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.analyser = null;
  }

  private connectOscillators(ctx: AudioContext, patch: TonePatch): void {
    const hz = clampHz(patch.hz);
    const beat = beatFor(hz, patch.binaural, patch.offset);
    const left = carrierFor(hz, patch.binaural);
    const oscL = ctx.createOscillator();
    oscL.type = patch.wave;
    oscL.frequency.setValueAtTime(left, ctx.currentTime);
    if (patch.binaural && beat > 0) {
      const oscR = ctx.createOscillator();
      oscR.type = patch.wave;
      oscR.frequency.setValueAtTime(left + beat, ctx.currentTime);
      const merger = ctx.createChannelMerger(2);
      oscL.connect(merger, 0, 0);
      oscR.connect(merger, 0, 1);
      merger.connect(this.master!);
      oscL.start();
      oscR.start();
      this.oscL = oscL;
      this.oscR = oscR;
      return;
    }
    oscL.connect(this.master!);
    oscL.start();
    this.oscL = oscL;
    this.oscR = null;
  }

  private stopOscillators(immediate: boolean): void {
    const nodes = [this.oscL, this.oscR];
    this.oscL = null;
    this.oscR = null;
    for (const osc of nodes) {
      if (!osc) continue;
      try {
        if (immediate) osc.stop();
      } catch {
        /* already stopped */
      }
      osc.disconnect();
    }
  }

  private ramp(to: number): void {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(to, now + FADE_SECONDS);
  }
}
