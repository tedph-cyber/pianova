import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Piano } from '../src/index';

describe('Piano', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterEach(() => {
    document.body.querySelectorAll('.pianova-keyboard').forEach((el) => el.remove());
  });

  it('constructs and renders keyboard', () => {
    const p = new Piano({ range: { first: 'C4', last: 'B4' }, root });
    expect(root.querySelector('.pianova-keyboard')).toBeTruthy();
    p.destroy();
  });

  it('defaults range to C2-C6 when not provided', () => {
    const p = new Piano({ root });
    const keys = root.querySelectorAll('[data-midi]');
    const midis = Array.from(keys).map((el) => parseInt(el.getAttribute('data-midi')!, 10));
    // C2 = 36, C6 = 84
    expect(Math.min(...midis)).toBe(36);
    expect(Math.max(...midis)).toBe(84);
    // 5 octaves = 5*12+1 = 61 notes... wait, C2 to C6 is 49 notes including both ends
    // C2(36), C#2, ..., C6(84) = 84-36+1 = 49
    expect(midis.length).toBe(49);
    p.destroy();
  });

  it('emits noteOn and noteOff events', () => {
    const p = new Piano({ range: { first: 'C4', last: 'B4' }, root });
    const onFn = vi.fn();
    const offFn = vi.fn();
    p.on('noteOn', onFn);
    p.on('noteOff', offFn);
    p.playNote('C4');
    expect(onFn).toHaveBeenCalledWith(expect.objectContaining({ midi: 60, name: 'C4' }));
    p.stopNote('C4');
    expect(offFn).toHaveBeenCalledWith(expect.objectContaining({ midi: 60, name: 'C4' }));
    p.destroy();
  });

  it('accepts custom onPlayNote / onStopNote callbacks', () => {
    const playFn = vi.fn();
    const stopFn = vi.fn();
    const p = new Piano({ range: { first: 'C4', last: 'B4' }, root, onPlayNote: playFn, onStopNote: stopFn });
    p.playNote('D4');
    expect(playFn).toHaveBeenCalledWith(expect.objectContaining({ midi: 62 }));
    p.stopNote('D4');
    expect(stopFn).toHaveBeenCalledWith(expect.objectContaining({ midi: 62 }));
    p.destroy();
  });

  it('pitchBend method delegates to synth', () => {
    const p = new Piano({ root });
    expect(() => p.pitchBend(1)).not.toThrow();
    p.destroy();
  });

  it('modulation method delegates to synth', () => {
    const p = new Piano({ root });
    expect(() => p.modulation(0.5)).not.toThrow();
    p.destroy();
  });

  it('detune getter/setter', () => {
    const p = new Piano({ root, detune: 25 });
    expect(p.detune).toBe(25);
    p.detune = -10;
    expect(p.detune).toBe(-10);
    p.destroy();
  });

  it('sustain getter/setter', () => {
    const p = new Piano({ root });
    expect(p.sustain).toBe(false);
    p.sustain = true;
    expect(p.sustain).toBe(true);
    p.sustain = false;
    expect(p.sustain).toBe(false);
    p.destroy();
  });

  it('destroy cleans up DOM and is idempotent', () => {
    const p = new Piano({ root });
    p.destroy();
    expect(root.querySelector('.pianova-keyboard')).toBeNull();
    expect(() => p.destroy()).not.toThrow();
  });

  it('accepts root as a CSS selector string', () => {
    root.id = 'test-piano';
    const p = new Piano({ range: { first: 'C4', last: 'B4' }, root: '#test-piano' });
    expect(p).toBeTruthy();
    p.destroy();
  });

  it('throws if root element is not found', () => {
    expect(() => new Piano({ range: { first: 'C4', last: 'B4' }, root: '#nonexistent' })).toThrow('pianova');
  });

  describe('transpose', () => {
    it('get/set', () => {
      const p = new Piano({ root, transpose: 3 });
      expect(p.transpose).toBe(3);
      p.transpose = -2;
      expect(p.transpose).toBe(-2);
      p.destroy();
    });

    it('shifts noteOn event MIDI', () => {
      const p = new Piano({ range: { first: 'C4', last: 'B4' }, root, transpose: 2 });
      const fn = vi.fn();
      p.on('noteOn', fn);
      p.playNote('C4');
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ midi: 62, name: 'D4' }));
      p.destroy();
    });

    it('shifts noteOff event MIDI', () => {
      const p = new Piano({ range: { first: 'C4', last: 'B4' }, root, transpose: -1 });
      const fn = vi.fn();
      p.on('noteOff', fn);
      p.playNote('D4');
      p.stopNote('D4');
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ midi: 61, name: 'C#4' }));
      p.destroy();
    });
  });

  describe('octaveShift', () => {
    it('get/set', () => {
      const p = new Piano({ root, octaveShift: 1 });
      expect(p.octaveShift).toBe(1);
      p.octaveShift = -1;
      expect(p.octaveShift).toBe(-1);
      p.destroy();
    });

    it('shifts note by octaves', () => {
      const p = new Piano({ range: { first: 'C4', last: 'B4' }, root, octaveShift: 1 });
      const fn = vi.fn();
      p.on('noteOn', fn);
      p.playNote('C4');
      expect(fn).toHaveBeenCalledWith(expect.objectContaining({ midi: 72, name: 'C5' }));
      p.destroy();
    });
  });

  describe('lastNote', () => {
    it('returns null before any note played', () => {
      const p = new Piano({ root });
      expect(p.lastNote).toBeNull();
      p.destroy();
    });

    it('returns last played note', () => {
      const p = new Piano({ range: { first: 'C4', last: 'B4' }, root });
      p.playNote('E4');
      expect(p.lastNote).toMatchObject({ midi: 64, name: 'E4' });
      p.destroy();
    });

    it('reflects transpose', () => {
      const p = new Piano({ range: { first: 'C4', last: 'B4' }, root, transpose: 5 });
      p.playNote('C4');
      expect(p.lastNote).toMatchObject({ midi: 65, name: 'F4' });
      p.destroy();
    });
  });
});
