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
}

export interface PianoEvents {
  noteOn: NoteInfo;
  noteOff: NoteInfo;
}

export interface KeyElement {
  element: HTMLDivElement;
  midi: number;
  isBlack: boolean;
}
