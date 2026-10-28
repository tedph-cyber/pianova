import { mod12 } from './pitch';
import type { KeyMode } from './scales';

export interface KeyCandidate {
  /** Pitch class of the tonic. */
  tonic: number;
  mode: KeyMode;
  /** Pearson correlation with the key profile, −1 to 1. */
  score: number;
}

// Krumhansl–Kessler probe-tone profiles, C = index 0.
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function correlation(a: readonly number[], b: readonly number[]): number {
  const n = a.length;
  const ma = a.reduce((s, v) => s + v, 0) / n;
  const mb = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    num += (a[i] - ma) * (b[i] - mb);
    da += (a[i] - ma) ** 2;
    db += (b[i] - mb) ** 2;
  }
  return da === 0 || db === 0 ? 0 : num / Math.sqrt(da * db);
}

/**
 * Rank the 24 major and minor keys for a set of notes (Krumhansl–Schmuckler).
 * `durations` parallels `midiNotes` and weights each note; without it every note
 * counts once. Best first. `[]` when there are no notes.
 *
 * A key and its relative key (C major / A minor) often score close together:
 * check the top two rather than trusting a single winner on short input.
 */
export function findKey(
  midiNotes: readonly number[],
  { durations }: { durations?: readonly number[] } = {},
): KeyCandidate[] {
  if (!midiNotes.length) return [];
  if (durations && durations.length !== midiNotes.length) {
    throw new RangeError('pianova: durations must be the same length as midiNotes');
  }
  const hist = new Array<number>(12).fill(0);
  midiNotes.forEach((m, i) => { hist[mod12(m)] += durations ? durations[i] : 1; });

  const out: KeyCandidate[] = [];
  for (let tonic = 0; tonic < 12; tonic++) {
    // Rotate the histogram so the candidate tonic sits at index 0.
    const rotated = hist.map((_, i) => hist[mod12(tonic + i)]);
    out.push({ tonic, mode: 'major', score: correlation(rotated, MAJOR_PROFILE) });
    out.push({ tonic, mode: 'minor', score: correlation(rotated, MINOR_PROFILE) });
  }
  return out.sort((a, b) => b.score - a.score);
}
