import type { WaveformType } from './types';
import { midiToFrequency } from './NoteMap';

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  baseFreq: number;
}

export class SynthEngine {
  private ctx: AudioContext | null = null;
  private voices = new Map<number, Voice>();
  private _waveform: OscillatorType;

  private _pitchBend = 0;
  private _detuneCents = 0;
  private _modDepth = 0;

  private _lfo: OscillatorNode | null = null;
  private _lfoGain: GainNode | null = null;

  private _sustain = false;
  private _sustained = new Set<number>();

  constructor(waveform: OscillatorType = 'sine') {
    this._waveform = waveform;
  }

  get waveform(): OscillatorType { return this._waveform; }
  set waveform(w: OscillatorType) { this._waveform = w; }

  get pitchBend(): number { return this._pitchBend; }
  set pitchBend(v: number) {
    this._pitchBend = Math.max(-2, Math.min(2, v));
    this.updateFrequencies();
  }

  get detune(): number { return this._detuneCents; }
  set detune(v: number) {
    this._detuneCents = v;
    this.updateFrequencies();
  }

  get modulation(): number { return this._modDepth; }
  set modulation(v: number) {
    this._modDepth = Math.max(0, Math.min(1, v));
    if (this._lfoGain) {
      this._lfoGain.gain.setValueAtTime(this._modDepth * 12, this.ctx!.currentTime);
    }
  }

  get sustain(): boolean { return this._sustain; }
  set sustain(v: boolean) {
    this._sustain = v;
    if (!v) this.releaseSustained();
  }

  private ensureCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  private initLFO(): void {
    if (this._lfo) return;
    const ctx = this.ensureCtx();
    this._lfo = ctx.createOscillator();
    this._lfo.type = 'sine';
    this._lfo.frequency.value = 5.5;
    this._lfoGain = ctx.createGain();
    this._lfoGain.gain.value = 0;
    this._lfo.connect(this._lfoGain);
    this._lfo.start();
  }

  private freqMult(): number {
    return Math.pow(2, this._pitchBend / 12 + this._detuneCents / 1200);
  }

  private updateFrequencies(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const m = this.freqMult();
    for (const v of this.voices.values()) {
      v.osc.frequency.setValueAtTime(v.baseFreq * m, now);
    }
  }

  private releaseVoice(midi: number): void {
    const v = this.voices.get(midi);
    if (!v) return;

    if (this._lfoGain) {
      try { this._lfoGain.disconnect(v.osc.frequency); } catch {}
    }

    const ctx = this.ensureCtx();
    const now = ctx.currentTime;
    const r = 0.25;

    v.gain.gain.cancelScheduledValues(now);
    v.gain.gain.setValueAtTime(v.gain.gain.value, now);
    v.gain.gain.linearRampToValueAtTime(0, now + r);
    v.osc.stop(now + r + 0.01);

    this.voices.delete(midi);
    this._sustained.delete(midi);
  }

  private releaseSustained(): void {
    if (!this.ctx) {
      this._sustained.clear();
      return;
    }
    for (const m of [...this._sustained]) {
      this.releaseVoice(m);
    }
  }

  playNote(midi: number, frequency?: number): void {
    if (this.voices.has(midi)) {
      if (!this._sustain || !this._sustained.has(midi)) return;
      this.releaseVoice(midi);
    }

    const ctx = this.ensureCtx();
    const baseFreq = frequency ?? midiToFrequency(midi);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = this._waveform;
    osc.frequency.setValueAtTime(baseFreq * this.freqMult(), ctx.currentTime);

    if (this._modDepth > 0) {
      this.initLFO();
      this._lfoGain!.connect(osc.frequency);
    }

    const now = ctx.currentTime;
    const a = 0.004, d = 0.08, s = 0.5, peak = 0.25;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + a);
    gain.gain.linearRampToValueAtTime(peak * s, now + a + d);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);

    this.voices.set(midi, { osc, gain, baseFreq });
  }

  stopNote(midi: number): void {
    if (!this.voices.has(midi)) return;

    if (this._sustain) {
      this._sustained.add(midi);
      return;
    }

    this.releaseVoice(midi);
  }

  stopAll(): void {
    for (const m of this.voices.keys()) this.releaseVoice(m);
  }

  destroy(): void {
    this.stopAll();
    if (this._lfo) { this._lfo.stop(); this._lfo.disconnect(); this._lfo = null; this._lfoGain = null; }
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
  }
}
