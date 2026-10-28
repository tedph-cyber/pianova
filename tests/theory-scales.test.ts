import { describe, it, expect } from 'vitest';
import {
  scale, degree, spellScale, keySignature, diatonicChords, findKey, noteLabel, SCALE_INTERVALS,
  type ScaleType,
} from '../src/theory';

// pc → name; tonic spelling the library should choose
const MAJOR_KEYS: Record<number, string> = {
  0: 'C', 1: 'D♭', 2: 'D', 3: 'E♭', 4: 'E', 5: 'F', 6: 'F♯', 7: 'G', 8: 'A♭', 9: 'A', 10: 'B♭', 11: 'B',
};
const MINOR_KEYS: Record<number, string> = {
  0: 'C', 1: 'C♯', 2: 'D', 3: 'E♭', 4: 'E', 5: 'F', 6: 'F♯', 7: 'G', 8: 'G♯', 9: 'A', 10: 'B♭', 11: 'B',
};

describe('scale / degree', () => {
  it('returns 7 pitch classes for heptatonic, 5 pentatonic, 6 blues', () => {
    const types = Object.keys(SCALE_INTERVALS) as ScaleType[];
    for (const t of types) {
      const n = t.endsWith('Pentatonic') ? 5 : t === 'blues' ? 6 : 7;
      expect(scale(0, t), t).toHaveLength(n);
    }
  });

  it('known scales', () => {
    expect(scale(0, 'major')).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(scale(9, 'naturalMinor')).toEqual([9, 11, 0, 2, 4, 5, 7]);
    expect(scale(9, 'harmonicMinor')).toEqual([9, 11, 0, 2, 4, 5, 8]);
    expect(scale(9, 'melodicMinor')).toEqual([9, 11, 0, 2, 4, 6, 8]);
    expect(scale(0, 'majorPentatonic')).toEqual([0, 2, 4, 7, 9]);
    expect(scale(9, 'minorPentatonic')).toEqual([9, 0, 2, 4, 7]);
    expect(scale(0, 'blues')).toEqual([0, 3, 5, 6, 7, 10]);
  });

  it('modes are rotations of the major scale', () => {
    const modes: ScaleType[] = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
    const major = scale(0, 'major');
    modes.forEach((m, i) => {
      expect(scale(major[i], m), m).toEqual([...major.slice(i), ...major.slice(0, i)]);
    });
    expect(scale(3, 'ionian')).toEqual(scale(3, 'major'));
    expect(scale(3, 'aeolian')).toEqual(scale(3, 'naturalMinor'));
  });

  it('normalises the tonic', () => {
    expect(scale(60, 'major')).toEqual(scale(0, 'major'));
    expect(scale(-1, 'major')[0]).toBe(11);
  });

  it('degree is semitones above do', () => {
    expect(degree(7, 0)).toBe(7);
    expect(degree(0, 7)).toBe(5);
    expect(degree(66, 7)).toBe(11);
    expect(noteLabel(degree(11, 7), { notation: 'number' })).toBe('3'); // B is the 3rd of G
  });
});

describe('spellScale', () => {
  it('one letter per degree for every heptatonic scale in every tonic', () => {
    const hept: ScaleType[] = [
      'major', 'naturalMinor', 'harmonicMinor', 'melodicMinor',
      'ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian',
    ];
    for (const t of hept) {
      for (let pc = 0; pc < 12; pc++) {
        const names = spellScale(pc, t);
        expect(new Set(names.map((n) => n[0])).size, `${t} ${pc}: ${names}`).toBe(7);
      }
    }
  });

  it('F major spells B♭, never A♯; F♯ major spells E♯', () => {
    expect(spellScale(5, 'major')).toEqual(['F', 'G', 'A', 'B♭', 'C', 'D', 'E']);
    expect(spellScale(6, 'major')).toEqual(['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯']);
  });

  it('all 12 major keys: conventional tonic and diatonic spelling', () => {
    for (let pc = 0; pc < 12; pc++) {
      const names = spellScale(pc, 'major');
      expect(names[0], `major ${pc}`).toBe(MAJOR_KEYS[pc]);
      // spelled names must land on the right pitch classes
      expect(names.map(pcOf)).toEqual(scale(pc, 'major'));
      expect(names.some((n) => n.includes('𝄪') || n.includes('𝄫'))).toBe(false);
    }
    expect(spellScale(1, 'major')).toEqual(['D♭', 'E♭', 'F', 'G♭', 'A♭', 'B♭', 'C']);
  });

  it('all 12 natural-minor keys', () => {
    for (let pc = 0; pc < 12; pc++) {
      const names = spellScale(pc, 'naturalMinor');
      expect(names[0], `minor ${pc}`).toBe(MINOR_KEYS[pc]);
      expect(names.map(pcOf)).toEqual(scale(pc, 'naturalMinor'));
    }
    expect(spellScale(9, 'naturalMinor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(spellScale(3, 'naturalMinor')).toEqual(['E♭', 'F', 'G♭', 'A♭', 'B♭', 'C♭', 'D♭']);
  });

  it('harmonic minor raises the 7th with the right letter', () => {
    expect(spellScale(9, 'harmonicMinor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G♯']);
    expect(spellScale(0, 'harmonicMinor')).toEqual(['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B']);
  });

  it('modes take their parent key name', () => {
    expect(spellScale(2, 'dorian')).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(spellScale(5, 'lydian')).toEqual(['F', 'G', 'A', 'B', 'C', 'D', 'E']);
  });

  it('pentatonic and blues', () => {
    expect(spellScale(5, 'majorPentatonic')).toEqual(['F', 'G', 'A', 'C', 'D']);
    expect(spellScale(9, 'minorPentatonic')).toEqual(['A', 'C', 'D', 'E', 'G']);
    expect(spellScale(0, 'blues')).toEqual(['C', 'E♭', 'F', 'G♭', 'G', 'B♭']);
  });

  it('prefer overrides the conventional choice for black-key tonics', () => {
    expect(spellScale(1, 'major', { prefer: 'sharp' })[0]).toBe('C♯');
    expect(spellScale(6, 'major', { prefer: 'flat' })).toEqual(['G♭', 'A♭', 'B♭', 'C♭', 'D♭', 'E♭', 'F']);
    expect(spellScale(0, 'major', { prefer: 'flat' })[0]).toBe('C');
  });
});

describe('keySignature', () => {
  const MAJOR_COUNTS: Record<number, [string, number]> = {
    0: ['none', 0], 1: ['flat', 5], 2: ['sharp', 2], 3: ['flat', 3], 4: ['sharp', 4], 5: ['flat', 1],
    6: ['sharp', 6], 7: ['sharp', 1], 8: ['flat', 4], 9: ['sharp', 3], 10: ['flat', 2], 11: ['sharp', 5],
  };
  const MINOR_COUNTS: Record<number, [string, number]> = {
    0: ['flat', 3], 1: ['sharp', 4], 2: ['flat', 1], 3: ['flat', 6], 4: ['sharp', 1], 5: ['flat', 4],
    6: ['sharp', 3], 7: ['flat', 2], 8: ['sharp', 5], 9: ['none', 0], 10: ['flat', 5], 11: ['sharp', 2],
  };

  it('all 12 major and minor keys', () => {
    for (let pc = 0; pc < 12; pc++) {
      const maj = keySignature(pc, 'major');
      expect([maj.accidentals, maj.count], `major ${pc}`).toEqual(MAJOR_COUNTS[pc]);
      expect(maj.notes).toHaveLength(maj.count);
      const min = keySignature(pc, 'minor');
      expect([min.accidentals, min.count], `minor ${pc}`).toEqual(MINOR_COUNTS[pc]);
    }
  });

  it('lists notes in signature order', () => {
    expect(keySignature(10, 'major').notes).toEqual(['B♭', 'E♭']);
    expect(keySignature(2, 'major').notes).toEqual(['F♯', 'C♯']);
    expect(keySignature(0, 'major').notes).toEqual([]);
  });

  it('relative keys share a signature', () => {
    for (let pc = 0; pc < 12; pc++) {
      if (pc === 6 || pc === 3) continue; // tied enharmonic keys are named by convention
      expect(keySignature(pc + 9, 'minor'), `${pc}`).toEqual(keySignature(pc, 'major'));
    }
  });

  it('prefer picks the other name for the tied pair', () => {
    expect(keySignature(6, 'major', { prefer: 'flat' })).toMatchObject({ accidentals: 'flat', count: 6 });
  });
});

describe('diatonicChords', () => {
  it('C major triads: I ii iii IV V vi vii°', () => {
    const c = diatonicChords(0, 'major');
    expect(c.map((x) => x.roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    expect(c.map((x) => x.number)).toEqual(['1', '2m', '3m', '4', '5', '6m', '7°']);
    expect(c.map((x) => x.quality)).toEqual(['major', 'minor', 'minor', 'major', 'major', 'minor', 'dim']);
    expect(c.map((x) => x.root)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(c[4].notes).toEqual([7, 11, 2]);
    expect(c.map((x) => x.degree)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('A minor triads', () => {
    const c = diatonicChords(9, 'minor');
    expect(c.map((x) => x.roman)).toEqual(['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII']);
    expect(c.map((x) => x.root)).toEqual([9, 11, 0, 2, 4, 5, 7]);
  });

  it('sevenths', () => {
    const c = diatonicChords(7, 'major', { sevenths: true });
    expect(c.map((x) => x.quality)).toEqual(['maj7', 'min7', 'min7', 'maj7', 'dom7', 'min7', 'm7b5']);
    expect(c.map((x) => x.roman)).toEqual(['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7']);
    expect(c[4].number).toBe('57');
    const m = diatonicChords(9, 'minor', { sevenths: true });
    expect(m.map((x) => x.quality)).toEqual(['min7', 'm7b5', 'maj7', 'min7', 'min7', 'maj7', 'dom7']);
  });

  it('every key: chord tones all belong to the key', () => {
    for (let pc = 0; pc < 12; pc++) {
      for (const mode of ['major', 'minor'] as const) {
        const set = new Set(scale(pc, mode === 'major' ? 'major' : 'naturalMinor'));
        for (const sev of [false, true]) {
          for (const ch of diatonicChords(pc, mode, { sevenths: sev })) {
            expect(ch.notes.every((n) => set.has(n)), `${pc} ${mode} ${ch.roman}`).toBe(true);
          }
        }
      }
    }
  });
});

describe('findKey', () => {
  const C_MAJOR_SCALE = [60, 62, 64, 65, 67, 69, 71, 72];

  it('returns 24 ranked candidates', () => {
    const r = findKey(C_MAJOR_SCALE);
    expect(r).toHaveLength(24);
    for (let i = 1; i < r.length; i++) expect(r[i - 1].score).toBeGreaterThanOrEqual(r[i].score);
  });

  it('empty input has no key', () => {
    expect(findKey([])).toEqual([]);
  });

  it('a C-major scale ranks C major first', () => {
    expect(findKey(C_MAJOR_SCALE)[0]).toMatchObject({ tonic: 0, mode: 'major' });
  });

  it('a major scale ranks its own key first in all 12 keys', () => {
    for (let pc = 0; pc < 12; pc++) {
      const notes = scale(pc, 'major').map((p) => 60 + ((p - 0 + 12) % 12)).concat(60 + pc);
      expect(findKey(notes)[0], `${pc}`).toMatchObject({ tonic: pc, mode: 'major' });
    }
  });

  it('an A-minor tune ranks A minor or C major in the top two', () => {
    // A B C D E . E D C B A — with the tonic and fifth held longer
    const tune = [69, 71, 72, 74, 76, 74, 72, 71, 69, 64, 69];
    const durations = [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4];
    for (const opts of [{}, { durations }]) {
      const top2 = findKey(tune, opts).slice(0, 2).map((k) => `${k.tonic}${k.mode}`);
      expect(top2.some((k) => k === '9minor' || k === '0major'), top2.join()).toBe(true);
    }
    expect(findKey(tune, { durations })[0]).toMatchObject({ tonic: 9, mode: 'minor' });
  });

  it('a G-major tune with F♯ ranks G major first', () => {
    expect(findKey([67, 69, 71, 72, 74, 71, 67, 66, 67])[0]).toMatchObject({ tonic: 7, mode: 'major' });
  });

  it('durations weight the notes', () => {
    // same notes; held C and G favour C, held A and E favour A minor
    const notes = [60, 64, 67, 69, 72, 76];
    const c = findKey(notes, { durations: [4, 2, 2, 1, 1, 1] })[0];
    const a = findKey(notes, { durations: [1, 2, 1, 4, 1, 2] })[0];
    expect(c).toMatchObject({ tonic: 0, mode: 'major' });
    expect(a).toMatchObject({ tonic: 9, mode: 'minor' });
  });

  it('mismatched durations throw', () => {
    expect(() => findKey([60, 62], { durations: [1] })).toThrow(RangeError);
  });

  it('a single repeated pitch class does not produce NaN scores', () => {
    for (const k of findKey([60, 72])) expect(Number.isFinite(k.score)).toBe(true);
  });
});

// Name → pitch class, for checking spelling lands on the right keys.
function pcOf(name: string): number {
  const base: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let pc = base[name[0]];
  for (const ch of name.slice(1)) pc += ch === '♯' ? 1 : ch === '♭' ? -1 : ch === '𝄪' ? 2 : ch === '𝄫' ? -2 : 0;
  return ((pc % 12) + 12) % 12;
}
