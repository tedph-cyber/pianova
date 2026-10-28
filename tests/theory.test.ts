import { describe, it, expect } from 'vitest';
import {
  identifyChord, chordLabel, noteLabel, pitchClasses, QUALITIES, mod12,
  type Match, type ChordMatch, type ChordLabelOptions,
} from '../src/theory';

const best = (notes: number[], opts?: ChordLabelOptions) => {
  const [m] = identifyChord(notes);
  return m ? chordLabel(m, opts) : null;
};

describe('identifyChord / chordLabel (ported from the Masteric spike)', () => {
  it('fewer than two pitch classes names no chord', () => {
    expect(identifyChord([])).toEqual([]);
    expect(identifyChord([60])).toEqual([]);
    expect(identifyChord([48, 60, 72])).toEqual([]);
  });

  it('root-position triads', () => {
    expect(best([60, 64, 67])!.long).toBe('C major');
    expect(best([60, 64, 67])!.short).toBe('C');
    expect(best([57, 60, 64])!.long).toBe('A minor');
    expect(best([59, 62, 65])!.long).toBe('B diminished');
    expect(best([60, 64, 68])!.long).toBe('C augmented');
  });

  it('inversions name the bass note', () => {
    const first = identifyChord([64, 67, 72])[0] as ChordMatch;
    expect(first.inversion).toBe(1);
    expect(chordLabel(first).short).toBe('C/E');
    expect(chordLabel(first).long).toBe('C major, E in the bass');
    expect(best([67, 72, 76])!.short).toBe('C/G');
  });

  it('the bass decides between chords with the same notes', () => {
    expect(best([60, 64, 67, 69])!.short).toBe('C6');
    expect(best([57, 60, 64, 67])!.short).toBe('Am7');
    expect(best([60, 62, 67])!.short).toBe('Csus2');
    expect(best([55, 60, 62])!.short).toBe('Gsus4');
  });

  it('sevenths', () => {
    expect(best([55, 59, 62, 65])!.long).toBe('G seven');
    expect(best([60, 64, 67, 71])!.short).toBe('Cmaj7');
    expect(best([62, 65, 69, 72])!.short).toBe('Dm7');
    expect(best([59, 62, 65, 69])!.short).toBe('Bm7♭5');
  });

  it('two notes: interval, or power chord for a fifth', () => {
    const ce = best([60, 64])!;
    expect(ce.long).toBe('C and E');
    expect(ce.feel).toBe('a happy pair');
    expect(ce.detail).toBe('major third');
    expect(best([60, 67])!.long).toBe('C power chord');
    expect(best([67, 72])!.detail).toBe('fourth');
    expect(best([60, 76])!.detail).toBe('major third');
  });

  it('an unnamed cluster returns nothing', () => {
    expect(identifyChord([60, 61, 62])).toEqual([]);
    expect(pitchClasses([60, 61, 62])).toHaveLength(3);
  });

  it('labels: accidentals and notations', () => {
    expect(noteLabel(10)).toBe('A♯');
    expect(noteLabel(10, { accidentals: 'flat' })).toBe('B♭');
    expect(noteLabel(7, { notation: 'solfege' })).toBe('so');
    expect(noteLabel(7, { notation: 'solfege', key: 7 })).toBe('do');
    expect(noteLabel(11, { notation: 'solfege' })).toBe('ti');
    expect(noteLabel(10, { notation: 'solfege', accidentals: 'flat' })).toBe('ta');
    expect(noteLabel(11, { notation: 'number', key: 7 })).toBe('3');
    expect(noteLabel(3, { notation: 'number', accidentals: 'flat' })).toBe('♭3');
    expect(best([67, 71, 74], { notation: 'solfege', key: 7 })!.long).toBe('do major');
    expect(best([62, 65, 69], { notation: 'number' })!.long).toBe('2 minor');
  });
});

describe('every quality, every root, every inversion', () => {
  // Stack the chord tones upward from the bass tone, so the bass is the lowest note.
  const voice = (root: number, ivals: readonly number[], inversion: number): number[] => {
    const tones = [0, ...ivals].map((i) => mod12(root + i));
    const order = [...tones.slice(inversion), ...tones.slice(0, inversion)];
    const out = [48 + order[0]];
    for (const pc of order.slice(1)) {
      let m = out[out.length - 1] + 1;
      while (mod12(m) !== pc) m++;
      out.push(m);
    }
    return out;
  };

  for (const q of QUALITIES.filter((x) => x.id !== 'power')) {
    it(`${q.id}: all 12 roots in all inversions`, () => {
      for (let root = 0; root < 12; root++) {
        for (let inv = 0; inv <= q.ivals.length; inv++) {
          const matches = identifyChord(voice(root, q.ivals, inv));
          const expected = matches.find((m) => m.kind === 'chord' && m.quality === q.id && m.root === root);
          expect(expected, `${q.id} root ${root} inv ${inv}`).toBeDefined();
          expect((expected as ChordMatch).inversion).toBe(inv);
          if (inv === 0) expect(matches[0]).toEqual(expected); // root in the bass wins
          expect(matches.every((m) => m.kind === 'chord' && m.bass === mod12(48 + mod12(root + [0, ...q.ivals][inv]) - 48))).toBe(true);
        }
      }
    });
  }

  it('power chord: a fifth up from the bass, any root', () => {
    for (let root = 0; root < 12; root++) {
      const [m] = identifyChord([48 + root, 55 + root]) as ChordMatch[];
      expect(m).toMatchObject({ kind: 'chord', quality: 'power', root, inversion: 0 });
    }
  });

  it('two pitch classes: every non-fifth gap is an interval measured from the bass', () => {
    for (let s = 1; s <= 11; s++) {
      if (s === 7) continue;
      const [m] = identifyChord([60, 60 + s]) as Match[];
      expect(m).toMatchObject({ kind: 'interval', bass: 0, top: s, semitones: s });
      expect(chordLabel(m).detail.length).toBeGreaterThan(0);
    }
  });

  it('the earlier table entry wins an exact tie', () => {
    // C E G A over E: min7 (Am7/E) ranks above six (C6/E)
    const [m] = identifyChord([52, 55, 57, 60]) as ChordMatch[];
    expect(m.quality).toBe('min7');
  });
});

describe('chordLabel feel overrides', () => {
  it('overrides quality and interval copy, leaving the rest alone', () => {
    const feel = { quality: { major: 'sunshine' }, interval: { 4: 'a bright pair' } };
    expect(best([60, 64, 67], { feel })!.feel).toBe('sunshine');
    expect(best([57, 60, 64], { feel })!.feel).toBe('a little sad');
    expect(best([60, 64], { feel })!.feel).toBe('a bright pair');
    expect(best([60, 63], { feel })!.feel).toBe('a slightly sad pair');
  });
});
