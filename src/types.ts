export type NoteName =
  | 'C' | 'C#' | 'D' | 'D#' | 'E'
  | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export interface NoteInfo {
  note: NoteName;
  octave: number;
  midi: number;
  frequency: number;
  name: string;
}

export interface NoteRange {
  first: string | number;
  last: string | number;
}

export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth';

/**
 * Key labels: `true` shows note names on white keys (default), `false` shows none,
 * a function returns the label for any key (return '' for no label).
 */
export type KeyLabels = boolean | ((note: NoteInfo) => string);

/** `fixed` uses fixed pixel key widths (default); `fluid` fills the container's width. */
export type KeyboardLayout = 'fixed' | 'fluid';

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
  root: HTMLElement | string;
  waveform?: WaveformType;
  onPlayNote?: (note: NoteInfo) => void;
  onStopNote?: (note: NoteInfo) => void;
  keyboardShortcuts?: boolean | Record<string, number>;
  detune?: number;
  transpose?: number;
  octaveShift?: number;
  keyLabels?: KeyLabels;
  layout?: KeyboardLayout;
  /** White key height in px (default 200). Black keys scale with it. */
  keyHeight?: number;
  /** In fluid layout, the narrowest a white key may get (px) before the keyboard overflows. */
  minWhiteKeyWidth?: number;
}

export interface PianoEvents {
  noteOn: NoteInfo;
  noteOff: NoteInfo;
}

export interface KeyElement {
  element: HTMLDivElement;
  midi: number;
  isBlack: boolean;
  /** Label from the `keyLabels` option, restored when a state label is cleared. */
  defaultLabel: string;
}
