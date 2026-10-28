import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Piano } from '../src/index';
import { MockResizeObserver } from './setup';

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

describe('Piano 0.2 options', () => {
  let root: HTMLElement;
  beforeEach(() => { root = document.createElement('div'); document.body.appendChild(root); });
  afterEach(() => { root.remove(); delete (navigator as any).requestMIDIAccess; });

  const make = (extra: Partial<ConstructorParameters<typeof Piano>[0]> = {}) =>
    new Piano({ root, range: { first: 'C4', last: 'B4' }, onPlayNote: () => {}, ...extra });

  it('labels option and setLabels', () => {
    const p = make({ labels: (m) => `n${m}` });
    expect(root.querySelector('[data-midi="61"] .pianova-key-label')!.textContent).toBe('n61');
    p.setLabels(() => 'z');
    expect(root.querySelector('[data-midi="60"] .pianova-key-label')!.textContent).toBe('z');
    p.destroy();
  });

  it('setActive lights keys without sounding or pressing them', () => {
    const onPlayNote = vi.fn();
    const p = make({ onPlayNote });
    p.setActive([60, 64]);
    expect(root.querySelectorAll('.pianova-lit')).toHaveLength(2);
    expect(root.querySelectorAll('.pianova-active')).toHaveLength(0);
    expect(onPlayNote).not.toHaveBeenCalled();
    p.destroy();
  });

  it('visibleRange reports the shown keys', () => {
    const p = make();
    expect(p.visibleRange).toEqual({ low: 60, high: 71 });
    p.destroy();
  });

  const fakeMidi = () => {
    const inputs = new Map([['0', { name: 'K', state: 'connected', onmidimessage: null as any }]]);
    (navigator as any).requestMIDIAccess = async () => ({ inputs, onstatechange: null });
    return inputs.get('0')!;
  };

  it('connectMidi works without any option and routes MIDI through the touch note path', async () => {
    const input = fakeMidi();
    const onPlayNote = vi.fn();
    const onStopNote = vi.fn();
    const p = make({ onPlayNote, onStopNote, transpose: 2 });
    const names = vi.fn();
    await p.connectMidi({ onDevices: names });
    expect(names).toHaveBeenCalledWith(['K']);

    input.onmidimessage({ data: new Uint8Array([0x90, 60, 127]), timeStamp: 0 });
    expect(onPlayNote).toHaveBeenCalledWith(expect.objectContaining({ midi: 62, velocity: 1 }));
    expect(root.querySelector('[data-midi="60"]')!.classList.contains('pianova-active')).toBe(true);
    input.onmidimessage({ data: new Uint8Array([0x80, 60, 0]), timeStamp: 0 });
    expect(onStopNote).toHaveBeenCalledWith(expect.objectContaining({ midi: 62 }));

    p.destroy();
    expect(input.onmidimessage).toBeNull();
  });

  it('velocity reaches noteOn events and the synth; touch notes carry none', async () => {
    const input = fakeMidi();
    const p = new Piano({ root, range: { first: 'C4', last: 'B4' } });
    const seen: any[] = [];
    p.on('noteOn', (n) => seen.push(n));
    await p.connectMidi();
    input.onmidimessage({ data: new Uint8Array([0x90, 60, 64]), timeStamp: 0 });
    p.playNote(62);
    expect(seen[0].velocity).toBeCloseTo(64 / 127);
    expect(seen[1].velocity).toBeUndefined();
    p.destroy();
  });

  it('connectMidi on a destroyed piano rejects with a MidiError', async () => {
    const p = make();
    p.destroy();
    const err = await p.connectMidi().catch((e) => e);
    expect(err.code).toBe('failed');
  });

  it('fit mode emits rangeChange on resize and keeps input working', () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
    let width = 300;
    const onPlayNote = vi.fn();
    const p = make({ fit: { start: 'C4', minWhiteKeyPx: 50 }, onPlayNote });
    expect(p.visibleRange).toEqual({ low: 60, high: 69 }); // 6 whites: C D E F G A
    const seen = vi.fn();
    p.on('rangeChange', seen);
    width = 400;
    MockResizeObserver.fireAll();
    expect(seen).toHaveBeenCalledWith({ low: 60, high: 72 });
    p.playNote(62);
    expect(root.querySelector('[data-midi="62"]')!.classList.contains('pianova-active')).toBe(true);
    p.destroy();
    vi.restoreAllMocks();
  });
});

describe('Piano view shifting (fit mode)', () => {
  let root: HTMLElement;
  let width = 300;
  beforeEach(() => {
    width = 300;
    root = document.createElement('div');
    document.body.appendChild(root);
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
  });
  afterEach(() => { root.remove(); vi.restoreAllMocks(); });

  const make = (extra = {}) =>
    new Piano({ root, fit: { start: 'C4', minWhiteKeyPx: 50 }, onPlayNote: () => {}, ...extra });

  it('shiftView moves the keyboard by octaves and emits rangeChange', () => {
    const p = make();
    const seen = vi.fn();
    p.on('rangeChange', seen);
    p.shiftView(1);
    expect(p.visibleRange).toEqual({ low: 72, high: 81 });
    expect(seen).toHaveBeenCalledWith({ low: 72, high: 81 });
    p.shiftView(-2);
    expect(p.visibleRange.low).toBe(48);
    p.destroy();
  });

  it('setViewStart rounds a black key down and clamps to the MIDI range', () => {
    const p = make();
    p.setViewStart('F#4');
    expect(p.visibleRange.low).toBe(65);
    p.setViewStart(-50);
    expect(p.visibleRange.low).toBe(0);
    p.destroy();
  });

  it('pressed keys survive a view shift and input goes to the new keys', () => {
    const onPlayNote = vi.fn();
    const p = make({ onPlayNote });
    p.playNote(60);
    p.shiftView(-1);
    p.playNote(50);
    expect(root.querySelector('[data-midi="50"]')!.classList.contains('pianova-active')).toBe(true);
    p.stopNote(60);
    p.destroy();
  });

  it('viewButtons renders working ◀ ▶ buttons that disable at the edges', () => {
    const p = make({ viewButtons: true });
    const [down, up] = Array.from(root.querySelectorAll<HTMLButtonElement>('.pianova-view-btn'));
    expect(down.getAttribute('aria-label')).toMatch(/down/);
    up.click();
    expect(p.visibleRange.low).toBe(72);
    down.click();
    down.click();
    down.click();
    down.click();
    expect(p.visibleRange.low).toBe(24);
    p.setViewStart(0);
    expect(down.disabled).toBe(true);
    p.destroy();
    expect(root.querySelector('.pianova-view-bar')).toBeNull();
  });

  it('no buttons without fit, and shiftView is a no-op on a fixed range', () => {
    const p = new Piano({ root, range: { first: 'C4', last: 'B4' }, viewButtons: true, onPlayNote: () => {} });
    expect(root.querySelector('.pianova-view-bar')).toBeNull();
    p.shiftView(1);
    expect(p.visibleRange).toEqual({ low: 60, high: 71 });
    p.destroy();
  });
});
