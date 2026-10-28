import { mod12, pitchClasses } from './pitch';

export type QualityId =
  | 'major' | 'minor' | 'dom7' | 'maj7' | 'min7' | 'sus4' | 'sus2' | 'six'
  | 'min6' | 'add9' | 'madd9' | 'dim' | 'aug' | 'dim7' | 'm7b5' | 'power';

export interface ChordQuality {
  id: QualityId;
  /** Semitones above the root, excluding the root. */
  ivals: readonly number[];
  symbol: string;
  name: string;
  /** Kid-facing copy; product wording, not theory. Override via `chordLabel` options. */
  feel: string;
}

/** Chord qualities, most common first: on an exact tie the earlier entry wins. */
export const QUALITIES: readonly ChordQuality[] = [
  { id: 'major', ivals: [4, 7], symbol: '', name: 'major', feel: 'bright and happy' },
  { id: 'minor', ivals: [3, 7], symbol: 'm', name: 'minor', feel: 'a little sad' },
  { id: 'dom7', ivals: [4, 7, 10], symbol: '7', name: 'seven', feel: 'wants to move on' },
  { id: 'maj7', ivals: [4, 7, 11], symbol: 'maj7', name: 'major seven', feel: 'soft and dreamy' },
  { id: 'min7', ivals: [3, 7, 10], symbol: 'm7', name: 'minor seven', feel: 'smooth and calm' },
  { id: 'sus4', ivals: [5, 7], symbol: 'sus4', name: 'sus four', feel: 'waiting to land' },
  { id: 'sus2', ivals: [2, 7], symbol: 'sus2', name: 'sus two', feel: 'open and airy' },
  { id: 'six', ivals: [4, 7, 9], symbol: '6', name: 'six', feel: 'sunny and sweet' },
  { id: 'min6', ivals: [3, 7, 9], symbol: 'm6', name: 'minor six', feel: 'mysterious' },
  { id: 'add9', ivals: [2, 4, 7], symbol: 'add9', name: 'add nine', feel: 'bright and sparkly' },
  { id: 'madd9', ivals: [2, 3, 7], symbol: 'm(add9)', name: 'minor add nine', feel: 'sad but shimmering' },
  { id: 'dim', ivals: [3, 6], symbol: 'dim', name: 'diminished', feel: 'tense, like a question' },
  { id: 'aug', ivals: [4, 8], symbol: 'aug', name: 'augmented', feel: 'strange and floaty' },
  { id: 'dim7', ivals: [3, 6, 9], symbol: 'dim7', name: 'diminished seven', feel: 'spooky' },
  { id: 'm7b5', ivals: [3, 6, 10], symbol: 'm7♭5', name: 'half-diminished', feel: 'dark and unsettled' },
  { id: 'power', ivals: [7], symbol: '5', name: 'power chord', feel: 'strong and bold' },
];

export const QUALITY_BY_ID = Object.fromEntries(QUALITIES.map((q) => [q.id, q])) as Record<QualityId, ChordQuality>;

export interface IntervalInfo {
  name: string;
  feel: string;
}

/** Two-note shapes, by semitones from the bass. 7 is a power chord, so it is absent. */
export const INTERVALS: Readonly<Record<number, IntervalInfo>> = {
  1: { name: 'half step', feel: 'a crunchy pair' },
  2: { name: 'whole step', feel: 'a stepping pair' },
  3: { name: 'minor third', feel: 'a slightly sad pair' },
  4: { name: 'major third', feel: 'a happy pair' },
  5: { name: 'fourth', feel: 'an open pair' },
  6: { name: 'tritone', feel: 'a tense pair' },
  8: { name: 'minor sixth', feel: 'a gentle, sad pair' },
  9: { name: 'major sixth', feel: 'a warm pair' },
  10: { name: 'minor seventh', feel: 'a bluesy pair' },
  11: { name: 'major seventh', feel: 'a clashing pair' },
};

export interface ChordMatch {
  kind: 'chord';
  /** Pitch class of the root. */
  root: number;
  quality: QualityId;
  /** Pitch class of the lowest note. */
  bass: number;
  /** 0 = root position, 1 = first inversion, … */
  inversion: number;
  score: number;
}

export interface IntervalMatch {
  kind: 'interval';
  bass: number;
  top: number;
  /** Semitones up from the bass, 1–11. */
  semitones: number;
  score: number;
}

export type Match = ChordMatch | IntervalMatch;

const sameList = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Name what is held. Takes MIDI numbers (any order, duplicates allowed) so the
 * lowest note is known. Best match first; `[]` for fewer than two pitch classes
 * or a cluster with no common name.
 *
 * Root in the bass beats any inversion; among equals, the more common quality
 * (table order) wins. Two pitch classes are an interval, except a fifth up from
 * the bass, which is a power chord.
 */
export function identifyChord(midiNotes: readonly number[]): Match[] {
  if (!midiNotes.length) return [];
  const bass = mod12(Math.min(...midiNotes));
  const pcs = pitchClasses(midiNotes);
  if (pcs.length < 2) return [];

  if (pcs.length === 2) {
    const top = pcs[0] === bass ? pcs[1] : pcs[0];
    const semitones = mod12(top - bass);
    if (semitones === 7) return [{ kind: 'chord', root: bass, quality: 'power', bass, inversion: 0, score: 100 }];
    return [{ kind: 'interval', bass, top, semitones, score: 0 }];
  }

  const matches: ChordMatch[] = [];
  for (const root of pcs) {
    const ivals = pcs.map((pc) => mod12(pc - root)).filter((i) => i !== 0).sort((a, b) => a - b);
    QUALITIES.forEach((q, rank) => {
      if (!sameList(q.ivals, ivals)) return;
      const inversion = [0, ...q.ivals].indexOf(mod12(bass - root));
      const score = (inversion === 0 ? 100 : 0) + (QUALITIES.length - rank);
      matches.push({ kind: 'chord', root, quality: q.id, bass, inversion, score });
    });
  }
  return matches.sort((a, b) => b.score - a.score);
}
