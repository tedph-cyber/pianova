import type { NoteName, NoteInfo } from './types';

const NOTES: NoteName[] = [
  'C', 'C#', 'D', 'D#', 'E',
  'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

const NOTE_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4, Fb: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
};

export function parseNote(input: string | number): NoteInfo {
  if (typeof input === 'number') {
    return midiToNote(Math.round(input));
  }

  const m = input.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
  if (!m) throw new Error(`pianova: invalid note string "${input}"`);

  const raw = m[1];
  const octave = parseInt(m[2], 10);
  const normalized = raw[0].toUpperCase() + raw.slice(1).toLowerCase();
  const semitone = NOTE_SEMITONE[normalized];
  if (semitone === undefined) throw new Error(`pianova: unknown note "${raw}"`);

  const midi = (octave + 1) * 12 + semitone;
  return buildNoteInfo(midi, NOTES[semitone], octave);
}

export function midiToNote(midi: number): NoteInfo {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  return buildNoteInfo(midi, NOTES[semitone], octave);
}

function buildNoteInfo(midi: number, note: NoteName, octave: number): NoteInfo {
  return {
    midi,
    note,
    octave,
    frequency: midiToFrequency(midi),
    name: `${note}${octave}`,
  };
}

export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function getNoteRange(first: string | number, last: string | number): NoteInfo[] {
  const a = parseNote(first);
  const b = parseNote(last);
  const lo = Math.min(a.midi, b.midi);
  const hi = Math.max(a.midi, b.midi);
  const notes: NoteInfo[] = [];
  for (let m = lo; m <= hi; m++) notes.push(midiToNote(m));
  return notes;
}

const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10]);

export function isBlackKey(midi: number): boolean {
  return BLACK_SEMITONES.has(((midi % 12) + 12) % 12);
}

export function isWhiteKey(midi: number): boolean {
  return !isBlackKey(midi);
}

const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

export function whiteKeyIndex(midi: number): number {
  const sem = ((midi % 12) + 12) % 12;
  const pos = WHITE_SEMITONES.indexOf(sem);
  if (pos === -1) return -1;
  return Math.floor(midi / 12) * 7 + pos;
}

export function midiToNoteName(midi: number): string {
  return midiToNote(midi).name;
}
