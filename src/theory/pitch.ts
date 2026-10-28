/** Wrap any integer into a pitch class, 0–11 (C = 0). */
export const mod12 = (n: number): number => ((n % 12) + 12) % 12;

/** Distinct pitch classes of a set of MIDI notes, ascending. */
export function pitchClasses(midiNotes: readonly number[]): number[] {
  return [...new Set(midiNotes.map(mod12))].sort((a, b) => a - b);
}

/** Semitones above do (the key's tonic): what sol-fa syllables and numbers are based on. */
export function degree(pc: number, keyPc: number): number {
  return mod12(pc - keyPc);
}
