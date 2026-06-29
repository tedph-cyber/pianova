import { EventEmitter } from './EventEmitter';
import { createKeyboard } from './Keyboard';
import { SynthEngine } from './SynthEngine';
import { InputManager } from './InputManager';
import { parseNote } from './NoteMap';
import { removeStyles } from './css';
import type { PianoOptions, PianoEvents, NoteInfo, WaveformType } from './types';

export type { PianoOptions, PianoEvents, NoteInfo, WaveformType, NoteName, NoteRange } from './types';
export { parseNote, midiToNote, midiToFrequency, midiToNoteName } from './NoteMap';

export class Piano extends EventEmitter<PianoEvents> {
  private synth: SynthEngine | null = null;
  private input: InputManager | null = null;
  private container: HTMLElement | null = null;
  private _destroyed = false;

  private _transpose = 0;
  private _octaveShift = 0;
  private _lastNote: NoteInfo | null = null;

  public readonly options: PianoOptions;

  constructor(options: PianoOptions) {
    super();

    this.options = { range: { first: 'C2', last: 'C6' }, ...options };
    this._transpose = options.transpose ?? 0;
    this._octaveShift = options.octaveShift ?? 0;

    const range = this.options.range!;
    const root = typeof options.root === 'string'
      ? document.querySelector<HTMLElement>(options.root)
      : options.root;

    if (!root) throw new Error('pianova: root element not found');

    const waveform = options.waveform ?? 'sine';
    const keyboardShortcuts = options.keyboardShortcuts ?? true;

    if (!options.onPlayNote && !options.onStopNote) {
      this.synth = new SynthEngine(waveform);
      if (options.detune) this.synth.detune = options.detune;
    }

    const result = createKeyboard(range.first, range.last, root);
    this.container = result.container;

    this.input = new InputManager({
      keys: result.keys,
      keyboardMap: keyboardShortcuts,
      onNoteOn: (midi: number) => this.handleNoteOn(midi),
      onNoteOff: (midi: number) => this.handleNoteOff(midi),
    });
  }

  private adjustMidi(raw: number): number {
    return raw + this._transpose + this._octaveShift * 12;
  }

  private handleNoteOn(rawMidi: number): void {
    const midi = this.adjustMidi(rawMidi);
    const info = parseNote(midi);
    this._lastNote = info;
    if (this.synth) this.synth.playNote(midi, info.frequency);
    if (this.options.onPlayNote) this.options.onPlayNote(info);
    this.emit('noteOn', info);
  }

  private handleNoteOff(rawMidi: number): void {
    const midi = this.adjustMidi(rawMidi);
    const info = parseNote(midi);
    if (this.synth) this.synth.stopNote(midi);
    if (this.options.onStopNote) this.options.onStopNote(info);
    this.emit('noteOff', info);
  }

  get lastNote(): NoteInfo | null {
    return this._lastNote;
  }

  get transpose(): number { return this._transpose; }
  set transpose(v: number) { this._transpose = Math.round(v); }

  get octaveShift(): number { return this._octaveShift; }
  set octaveShift(v: number) { this._octaveShift = Math.round(v); }

  playNote(note: string | number): void {
    if (this._destroyed) return;
    this.input?.pressKey(parseNote(note).midi);
  }

  stopNote(note: string | number): void {
    if (this._destroyed) return;
    this.input?.releaseKey(parseNote(note).midi);
  }

  setWaveform(type: WaveformType): void {
    if (this.synth) this.synth.waveform = type;
  }

  pitchBend(semitones: number): void {
    if (this.synth) this.synth.pitchBend = semitones;
  }

  modulation(depth: number): void {
    if (this.synth) this.synth.modulation = depth;
  }

  get sustain(): boolean {
    return this.synth?.sustain ?? false;
  }

  set sustain(v: boolean) {
    if (this.synth) this.synth.sustain = v;
  }

  get detune(): number {
    return this.synth?.detune ?? 0;
  }

  set detune(cents: number) {
    if (this.synth) this.synth.detune = cents;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.input?.destroy();
    this.synth?.destroy();
    this.container?.remove();
    this.removeAllListeners();
    removeStyles();
    this.synth = null;
    this.input = null;
    this.container = null;
  }
}
