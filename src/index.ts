import { EventEmitter } from './EventEmitter';
import { createKeyboard, type KeyboardResult } from './Keyboard';
import { SynthEngine } from './SynthEngine';
import { InputManager } from './InputManager';
import { parseNote } from './NoteMap';
import { removeStyles } from './css';
import { connectMidi, MidiError, type MidiConnection } from './midi';
import type { PianoOptions, PianoEvents, NoteInfo, WaveformType, VisibleRange, KeyState } from './types';

export type {
  PianoOptions, PianoEvents, NoteInfo, WaveformType, NoteName, NoteRange, FitOptions, VisibleRange, KeyState,
} from './types';
export { parseNote, midiToNote, midiToFrequency, midiToNoteName } from './NoteMap';
export { connectMidi, midiSupported, midiUnavailableReason, MidiError } from './midi';
export type { MidiOptions, MidiConnection, MidiErrorCode } from './midi';

export class Piano extends EventEmitter<PianoEvents> {
  private synth: SynthEngine | null = null;
  private input: InputManager | null = null;
  private container: HTMLElement | null = null;
  private keyboard: KeyboardResult | null = null;
  private midi: MidiConnection | null = null;
  private viewBar: HTMLElement | null = null;
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

    const result = createKeyboard(range.first, range.last, root, {
      labels: options.labels,
      fit: options.fit,
      onRebuild: (keys) => this.input?.setKeys(keys),
      onRangeChange: (r) => { this.updateViewButtons(); this.emit('rangeChange', r); },
    });
    this.keyboard = result;
    this.container = result.container;

    if (options.fit && options.viewButtons) {
      const bar = document.createElement('div');
      bar.className = 'pianova-view-bar';
      const mk = (text: string, label: string, dir: number) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'pianova-view-btn';
        b.textContent = text;
        b.setAttribute('aria-label', label);
        b.addEventListener('click', () => this.shiftView(dir));
        return b;
      };
      bar.append(mk('◀ 8va', 'Shift keyboard down an octave', -1), mk('8va ▶', 'Shift keyboard up an octave', 1));
      root.insertBefore(bar, result.container);
      this.viewBar = bar;
      this.updateViewButtons();
    }

    this.input = new InputManager({
      keys: result.keys,
      container: result.container,
      glide: options.glide ?? true,
      keyboardMap: keyboardShortcuts,
      onNoteOn: (midi: number, velocity?: number) => this.handleNoteOn(midi, velocity),
      onNoteOff: (midi: number) => this.handleNoteOff(midi),
    });
  }

  private adjustMidi(raw: number): number {
    return raw + this._transpose + this._octaveShift * 12;
  }

  private handleNoteOn(rawMidi: number, velocity?: number): void {
    const midi = this.adjustMidi(rawMidi);
    const info = parseNote(midi);
    if (velocity !== undefined) info.velocity = velocity;
    this._lastNote = info;
    if (this.synth) this.synth.playNote(midi, info.frequency, velocity);
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

  /**
   * Sets a key's visual state (colour, mark, label, badge) without playing it.
   * Replaces the key's previous state; `null` clears it. Keys are addressed by
   * their position on the keyboard, ignoring transpose and octave shift.
   * Keys outside the range are ignored.
   */
  setKeyState(note: string | number, state: KeyState | null): void {
    if (this._destroyed) return;
    this.keyboard?.setKeyState(parseNote(note).midi, state);
  }

  /** Clears the visual state of every key. */
  clearKeyStates(): void {
    if (this._destroyed) return;
    this.keyboard?.clearKeyStates();
  }

  /** Highlight keys (MIDI numbers of the physical keys, before transpose) independently of what is pressed. */
  setActive(midis: Iterable<number>): void {
    this.keyboard?.setActive(midis);
  }

  /** Replace the key labels; `null` restores note names. Use this when "do" moves. */
  setLabels(fn: ((midi: number) => string) | null): void {
    this.keyboard?.relabel(fn);
  }

  /** Lowest and highest keys currently shown. Changes with the container size in fit mode. */
  get visibleRange(): VisibleRange {
    return this.keyboard?.range() ?? { low: 0, high: 0 };
  }

  /**
   * Route Web MIDI into the same note path as touch (highlighting, transpose, events,
   * audio). `noteOn` events and `onPlayNote` carry `velocity` (0–1) for MIDI notes, and
   * the built-in synth scales its level by it. Call it from a user action: Chrome shows
   * a permission prompt. Rejects with a `MidiError`.
   */
  async connectMidi(opts: { onDevices?: (names: string[]) => void } = {}): Promise<MidiConnection> {
    if (this._destroyed) throw new MidiError('failed', 'pianova: piano is destroyed.');
    this.midi?.close();
    const conn = await connectMidi({
      onNoteOn: (midi, velocity) => this.input?.pressKey(midi, velocity),
      onNoteOff: (midi) => this.input?.releaseKey(midi),
      onDevices: opts.onDevices,
    });
    if (this._destroyed) {
      conn.close();
      throw new MidiError('failed', 'pianova: piano was destroyed while connecting.');
    }
    this.midi = conn;
    return conn;
  }

  /** Fit mode: move the lowest key. A black key rounds down to the white key below. */
  setViewStart(note: string | number): void {
    this.keyboard?.setStart(note);
    this.updateViewButtons();
  }

  /** Fit mode: shift the visible keys by whole octaves (negative = down). */
  shiftView(octaves: number): void {
    const start = this.keyboard?.start();
    if (start == null) return;
    this.setViewStart(start + Math.round(octaves) * 12);
  }

  private updateViewButtons(): void {
    if (!this.viewBar) return;
    const start = this.keyboard?.start() ?? 0;
    const { high } = this.visibleRange;
    (this.viewBar.firstChild as HTMLButtonElement).disabled = start < 12;
    (this.viewBar.lastChild as HTMLButtonElement).disabled = high + 12 > 127;
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
    this.midi?.close();
    this.input?.destroy();
    this.keyboard?.destroy();
    this.synth?.destroy();
    this.viewBar?.remove();
    this.container?.remove();
    this.removeAllListeners();
    removeStyles();
    this.synth = null;
    this.input = null;
    this.midi = null;
    this.viewBar = null;
    this.keyboard = null;
    this.container = null;
  }
}
