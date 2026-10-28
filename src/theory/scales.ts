import { mod12 } from './pitch';
import type { QualityId } from './chords';

export type ScaleType =
  | 'major' | 'naturalMinor' | 'harmonicMinor' | 'melodicMinor'
  | 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian'
  | 'majorPentatonic' | 'minorPentatonic' | 'blues';

export type KeyMode = 'major' | 'minor';

/**
 * Semitones above the tonic for each degree. The octave is not included: a scale
 * is 7 pitch classes (5 pentatonic, 6 blues) and the octave is a display concern.
 * `melodicMinor` is the ascending form.
 */
export const SCALE_INTERVALS: Readonly<Record<ScaleType, readonly number[]>> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  naturalMinor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

// Letter steps from the tonic letter (0 = same letter, 2 = a third up, …). Heptatonic
// scales use one letter per degree. The blues ♭5 and 5 share the fifth's letter.
const SEVEN = [0, 1, 2, 3, 4, 5, 6];
const LETTER_STEPS: Readonly<Record<ScaleType, readonly number[]>> = {
  major: SEVEN, naturalMinor: SEVEN, harmonicMinor: SEVEN, melodicMinor: SEVEN,
  ionian: SEVEN, dorian: SEVEN, phrygian: SEVEN, lydian: SEVEN, mixolydian: SEVEN,
  aeolian: SEVEN, locrian: SEVEN,
  majorPentatonic: [0, 1, 2, 4, 5],
  minorPentatonic: [0, 2, 3, 4, 6],
  blues: [0, 2, 3, 4, 4, 6],
};

// Which conventional key-name table breaks ties for the tonic.
const MINORISH = new Set<ScaleType>([
  'naturalMinor', 'harmonicMinor', 'melodicMinor', 'dorian', 'phrygian', 'aeolian', 'locrian',
  'minorPentatonic', 'blues',
]);

/** The pitch classes of a scale, starting on the tonic. */
export function scale(tonicPc: number, type: ScaleType): number[] {
  const t = mod12(tonicPc);
  return SCALE_INTERVALS[type].map((i) => mod12(t + i));
}

// --- spelling ---------------------------------------------------------------

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];

interface Spelled {
  letter: number;
  /** −1 = flat, +1 = sharp, … */
  acc: number;
}

function accSymbol(n: number): string {
  if (n === 0) return '';
  if (n === 2) return '𝄪';
  if (n === -2) return '𝄫';
  return (n > 0 ? '♯' : '♭').repeat(Math.abs(n));
}

const nameOf = (s: Spelled) => LETTERS[s.letter] + accSymbol(s.acc);

function spellNote(letter: number, pc: number): Spelled {
  return { letter, acc: mod12(pc - NATURAL_PC[letter] + 6) - 6 };
}

function spellFrom(tonic: Spelled, tonicPc: number, type: ScaleType): Spelled[] {
  const steps = LETTER_STEPS[type];
  return SCALE_INTERVALS[type].map((semis, i) =>
    spellNote((tonic.letter + steps[i]) % 7, tonicPc + semis));
}

// Preferred accidental for each black-key tonic when two names cost the same.
const TIE_MAJOR: Readonly<Record<number, number>> = { 1: -1, 3: -1, 6: 1, 8: -1, 10: -1 };
const TIE_MINOR: Readonly<Record<number, number>> = { 1: 1, 3: -1, 6: 1, 8: 1, 10: -1 };

export interface SpellOptions {
  /**
   * Force the tonic's accidental for black-key tonics (`'sharp'` → C♯ major,
   * `'flat'` → G♭ major). Ignored for white-key tonics. Without it the key with
   * the fewest accidentals wins, ties going to the conventional name (D♭ major,
   * F♯ major, E♭ minor, G♯ minor).
   */
  prefer?: 'sharp' | 'flat';
}

function spellTonic(tonicPc: number, type: ScaleType, prefer?: 'sharp' | 'flat'): { tonic: Spelled; notes: Spelled[] } {
  const pc = mod12(tonicPc);
  let candidates: Spelled[] = [];
  for (let letter = 0; letter < 7; letter++) {
    const s = spellNote(letter, pc);
    if (Math.abs(s.acc) <= 1) candidates.push(s);
  }
  if (prefer && candidates.some((c) => c.acc !== 0) && !candidates.some((c) => c.acc === 0)) {
    const want = prefer === 'sharp' ? 1 : -1;
    candidates = candidates.filter((c) => c.acc === want);
  }
  const tie = (MINORISH.has(type) ? TIE_MINOR : TIE_MAJOR)[pc];
  let best: { tonic: Spelled; notes: Spelled[]; cost: number; tied: boolean } | null = null;
  for (const tonic of candidates) {
    const notes = spellFrom(tonic, pc, type);
    const cost = notes.reduce((sum, n) => sum + Math.abs(n.acc), 0);
    const tied = tonic.acc === tie;
    if (!best || cost < best.cost || (cost === best.cost && tied && !best.tied)) {
      best = { tonic, notes, cost, tied };
    }
  }
  return { tonic: best!.tonic, notes: best!.notes };
}

/**
 * The scale spelled with one letter per degree (F major spells B♭, never A♯;
 * F♯ major spells E♯). Returns names in scale order starting on the tonic.
 */
export function spellScale(tonicPc: number, type: ScaleType, opts: SpellOptions = {}): string[] {
  return spellTonic(tonicPc, type, opts.prefer).notes.map(nameOf);
}

// --- key signatures -----------------------------------------------------------

export interface KeySignature {
  accidentals: 'sharp' | 'flat' | 'none';
  count: number;
  /** The altered notes in signature order, e.g. `['B♭', 'E♭']`. */
  notes: string[];
}

const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6]; // F C G D A E B
const FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3]; // B E A D G C F
const LETTER_FIFTHS = [0, 2, 4, -1, 1, 3, 5]; // C D E F G A B on the circle of fifths

/** Key signature of a major or natural-minor key. */
export function keySignature(tonicPc: number, mode: KeyMode, opts: SpellOptions = {}): KeySignature {
  const { tonic } = spellTonic(tonicPc, mode === 'major' ? 'major' : 'naturalMinor', opts.prefer);
  const fifths = LETTER_FIFTHS[tonic.letter] + 7 * tonic.acc - (mode === 'minor' ? 3 : 0);
  if (fifths === 0) return { accidentals: 'none', count: 0, notes: [] };
  const sharp = fifths > 0;
  const order = sharp ? SHARP_ORDER : FLAT_ORDER;
  const count = Math.abs(fifths);
  const notes: string[] = [];
  for (let i = 0; i < count; i++) {
    const n = Math.floor(i / 7) + 1;
    notes.push(LETTERS[order[i % 7]] + accSymbol(sharp ? n : -n));
  }
  return { accidentals: sharp ? 'sharp' : 'flat', count, notes };
}

// --- diatonic chords ----------------------------------------------------------

export interface DiatonicChord {
  /** 1–7. */
  degree: number;
  /** Pitch class of the chord root. */
  root: number;
  quality: QualityId;
  /** Chord tones as pitch classes, root first. */
  notes: number[];
  /** Roman numeral: `I`, `ii`, `vii°`, `V7`, `viiø7`. */
  roman: string;
  /** Number label: `1`, `2m`, `7°`, `57`, `1maj7`. */
  number: string;
}

const TRIADS: Record<KeyMode, QualityId[]> = {
  major: ['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim'],
  minor: ['minor', 'dim', 'major', 'minor', 'minor', 'major', 'major'],
};
const SEVENTHS: Record<KeyMode, QualityId[]> = {
  major: ['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'm7b5'],
  minor: ['min7', 'm7b5', 'maj7', 'min7', 'min7', 'maj7', 'dom7'],
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const TONES: Partial<Record<QualityId, number[]>> = {
  major: [0, 4, 7], minor: [0, 3, 7], dim: [0, 3, 6],
  maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], m7b5: [0, 3, 6, 10],
};
// [roman suffix, number suffix, lower-case numeral?]
const SUFFIX: Partial<Record<QualityId, [string, string, boolean]>> = {
  major: ['', '', false], minor: ['', 'm', true], dim: ['°', '°', true],
  maj7: ['maj7', 'maj7', false], min7: ['7', 'm7', true], dom7: ['7', '7', false], m7b5: ['ø7', 'ø7', true],
};

/** The chord on each degree of a major or natural-minor key. */
export function diatonicChords(
  keyPc: number,
  mode: KeyMode,
  { sevenths = false }: { sevenths?: boolean } = {},
): DiatonicChord[] {
  const key = mod12(keyPc);
  const degrees = scale(key, mode === 'major' ? 'major' : 'naturalMinor');
  const qualities = (sevenths ? SEVENTHS : TRIADS)[mode === 'major' ? 'major' : 'minor'];
  return degrees.map((root, i) => {
    const quality = qualities[i];
    const [romanSuffix, numberSuffix, lower] = SUFFIX[quality]!;
    const numeral = lower ? ROMAN[i].toLowerCase() : ROMAN[i];
    return {
      degree: i + 1,
      root,
      quality,
      notes: TONES[quality]!.map((t) => mod12(root + t)),
      roman: numeral + romanSuffix,
      number: `${i + 1}${numberSuffix}`,
    };
  });
}
