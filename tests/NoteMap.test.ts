import { describe, it, expect } from 'vitest';
import {
  parseNote,
  midiToNote,
  midiToFrequency,
  getNoteRange,
  isBlackKey,
  isWhiteKey,
  whiteKeyIndex,
  midiToNoteName,
} from '../src/NoteMap';

describe('parseNote', () => {
  it('parses C4', () => {
    const n = parseNote('C4');
    expect(n.midi).toBe(60);
    expect(n.note).toBe('C');
    expect(n.octave).toBe(4);
    expect(n.name).toBe('C4');
  });

  it('parses A4 (reference)', () => {
    const n = parseNote('A4');
    expect(n.midi).toBe(69);
    expect(n.frequency).toBeCloseTo(440, 1);
  });

  it('parses MIDI numbers directly', () => {
    const n = parseNote(69);
    expect(n.name).toBe('A4');
  });

  it('parses sharps', () => {
    expect(parseNote('C#4').midi).toBe(61);
    expect(parseNote('F#3').midi).toBe(54);
  });

  it('parses flats as equivalent sharps', () => {
    expect(parseNote('Db4').midi).toBe(61);
    expect(parseNote('Gb3').midi).toBe(54);
  });

  it('parses low and high octaves', () => {
    expect(parseNote('C0').midi).toBe(12);
    expect(parseNote('C8').midi).toBe(108);
    expect(parseNote('A0').midi).toBe(21);
  });

  it('throws on invalid input', () => {
    expect(() => parseNote('X5')).toThrow();
    expect(() => parseNote('C')).toThrow();
  });
});

describe('midiToNote', () => {
  it('converts MIDI 60 to C4', () => {
    expect(midiToNote(60).name).toBe('C4');
  });

  it('converts MIDI 0 to C-1', () => {
    expect(midiToNote(0).name).toBe('C-1');
  });
});

describe('midiToFrequency', () => {
  it('A4 = 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440, 5);
  });

  it('A5 = 880 Hz', () => {
    expect(midiToFrequency(81)).toBeCloseTo(880, 5);
  });

  it('A3 = 220 Hz', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220, 5);
  });
});

describe('getNoteRange', () => {
  it('2 notes = C4, D4', () => {
    const r = getNoteRange('C4', 'D4');
    expect(r).toHaveLength(3);
    expect(r[0].name).toBe('C4');
    expect(r[1].name).toBe('C#4');
    expect(r[2].name).toBe('D4');
  });

  it('full octave C4-B4 = 12 notes', () => {
    expect(getNoteRange('C4', 'B4')).toHaveLength(12);
  });

  it('handles reverse order', () => {
    const r = getNoteRange('B4', 'C4');
    expect(r).toHaveLength(12);
    expect(r[0].name).toBe('C4');
  });
});

describe('isBlackKey / isWhiteKey', () => {
  it('C is white', () => expect(isWhiteKey(60)).toBe(true));
  it('C# is black', () => expect(isBlackKey(61)).toBe(true));
  it('D is white', () => expect(isWhiteKey(62)).toBe(true));
  it('E is white', () => expect(isWhiteKey(64)).toBe(true));
  it('F is white', () => expect(isWhiteKey(65)).toBe(true));
  it('B is white', () => expect(isWhiteKey(71)).toBe(true));
});

describe('whiteKeyIndex', () => {
  it('C4 = white key 35 (0-indexed from C-1)', () => {
    expect(whiteKeyIndex(60)).toBe(35);
  });

  it('C0 = white key 7', () => {
    expect(whiteKeyIndex(12)).toBe(7);
  });

  it('C-1 = white key 0', () => {
    expect(whiteKeyIndex(0)).toBe(0);
  });

  it('returns -1 for black keys', () => {
    expect(whiteKeyIndex(61)).toBe(-1);
  });
});

describe('midiToNoteName', () => {
  it('returns correct string', () => {
    expect(midiToNoteName(60)).toBe('C4');
    expect(midiToNoteName(61)).toBe('C#4');
  });
});
