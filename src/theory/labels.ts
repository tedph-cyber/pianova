import { mod12 } from './pitch';
import { INTERVALS, QUALITY_BY_ID, type Match, type QualityId } from './chords';

export type Notation = 'letter' | 'solfege' | 'number';
export type Accidentals = 'sharp' | 'flat';

export interface NoteLabelOptions {
  notation?: Notation;
  accidentals?: Accidentals;
  /** Pitch class of "do" / "1". Letters ignore it. Default 0 (C). */
  key?: number;
}

const LETTER = {
  sharp: ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'],
  flat: ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'],
};
// Movable do. The 7th is "ti" and the flat 7th "ta" (toh / taw).
const SOLFEGE = {
  sharp: ['do', 'di', 're', 'ri', 'mi', 'fa', 'fi', 'so', 'si', 'la', 'li', 'ti'],
  flat: ['do', 'ra', 're', 'me', 'mi', 'fa', 'se', 'so', 'le', 'la', 'ta', 'ti'],
};
const NUMBER = {
  sharp: ['1', '♯1', '2', '♯2', '3', '4', '♯4', '5', '♯5', '6', '♯6', '7'],
  flat: ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'],
};

/** Label for a pitch class (or any MIDI number) in letters, movable-do sol-fa, or numbers. */
export function noteLabel(
  pc: number,
  { notation = 'letter', accidentals = 'sharp', key = 0 }: NoteLabelOptions = {},
): string {
  const acc = accidentals === 'flat' ? 'flat' : 'sharp';
  if (notation === 'solfege') return SOLFEGE[acc][mod12(pc - key)];
  if (notation === 'number') return NUMBER[acc][mod12(pc - key)];
  return LETTER[acc][mod12(pc)];
}

/** Overrides for the kid-facing "feel" copy; anything not listed keeps the default. */
export interface FeelWords {
  quality?: Partial<Record<QualityId, string>>;
  /** Keyed by semitones from the bass (1–11, not 7). */
  interval?: Partial<Record<number, string>>;
}

export interface ChordLabelOptions extends NoteLabelOptions {
  feel?: FeelWords;
}

export interface ChordLabel {
  /** "C/E", or "C and E" style for pairs. */
  short: string;
  /** "C major, E in the bass". */
  long: string;
  feel: string;
  /** The quality or interval name. */
  detail: string;
}

/** Words for a match from `identifyChord`. */
export function chordLabel(match: Match, opts: ChordLabelOptions = {}): ChordLabel {
  const name = (pc: number) => noteLabel(pc, opts);
  if (match.kind === 'interval') {
    const iv = INTERVALS[match.semitones];
    return {
      short: `${name(match.bass)} + ${name(match.top)}`,
      long: `${name(match.bass)} and ${name(match.top)}`,
      feel: opts.feel?.interval?.[match.semitones] ?? iv.feel,
      detail: iv.name,
    };
  }
  const q = QUALITY_BY_ID[match.quality];
  const root = name(match.root);
  const bass = match.inversion > 0 ? name(match.bass) : null;
  const letters = (opts.notation ?? 'letter') === 'letter';
  const short = letters
    ? root + q.symbol + (bass ? `/${bass}` : '')
    : `${root} ${q.name}` + (bass ? ` / ${bass}` : '');
  const long = `${root} ${q.name}` + (bass ? `, ${bass} in the bass` : '');
  return { short, long, feel: opts.feel?.quality?.[match.quality] ?? q.feel, detail: q.name };
}
