export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E'
  | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface NoteInfo {
  note: NoteName;
  octave: number;
  midi: number;
  frequency: number;
  name: string;
  /** 0–1. Only set on `noteOn` for notes that arrived over MIDI. */
  velocity?: number;
}

export interface NoteRange {
  first: string | number;
  last: string | number;
}

export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth';

export interface FitOptions {
  /** Lowest key shown. A black key rounds down to the white key below it. */
  start: string | number;
  /** Narrowest a white key may get, in CSS px. The keyboard shows as many white keys as fit. */
  minWhiteKeyPx: number;
}

export interface VisibleRange {
  /** Lowest and highest MIDI notes on the keyboard (the highest is always a white key in fit mode). */
  low: number;
  high: number;
}

/** Per-key visual state, independent of whether the key is being played. */
export interface KeyState {
  /** Any CSS background value. Lights the key without playing it. */
  color?: string;
  /** Outline the key, e.g. to mark a target note. */
  mark?: boolean;
  /** Replaces the key's label while the state is set. */
  label?: string;
  /** Small badge on the key, e.g. a finger number. */
  badge?: string | number;
}

export interface PianoOptions {
  range?: NoteRange;
  /** Alternative to `range`: show as many white keys as the container fits. Takes precedence over `range`. */
  fit?: FitOptions;
  /** Text on each key, from the key's MIDI number (before transpose). Empty string for none. */
  labels?: (midi: number) => string;
  /** Sliding a pointer across keys releases the old key and presses the new one. Default `true`. */
  glide?: boolean;
  /** Render ◀ ▶ buttons that shift a `fit` keyboard by an octave (touch cannot pan the keyboard). */
  viewButtons?: boolean;
  root: HTMLElement | string;
  waveform?: WaveformType;
  onPlayNote?: (note: NoteInfo) => void;
  onStopNote?: (note: NoteInfo) => void;
  keyboardShortcuts?: boolean | Record<string, number>;
  detune?: number;
  transpose?: number;
  octaveShift?: number;
}

export interface PianoEvents {
  noteOn: NoteInfo;
  noteOff: NoteInfo;
  /** Fit mode only: the visible keys changed because the container was resized. */
  rangeChange: VisibleRange;
}

export interface KeyElement {
  element: HTMLDivElement;
  midi: number;
  isBlack: boolean;
}
