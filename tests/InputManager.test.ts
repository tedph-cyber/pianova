import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../src/InputManager';
import type { KeyElement } from '../src/types';

function makeKeyEl(midi: number, black = false): KeyElement {
  const el = document.createElement('div');
  el.dataset.midi = String(midi);
  el.className = black ? 'pianova-black-key' : 'pianova-white-key';
  return { element: el, midi, isBlack: black };
}

describe('InputManager', () => {
  let onNoteOn: ReturnType<typeof vi.fn>;
  let onNoteOff: ReturnType<typeof vi.fn>;
  let keys: KeyElement[];

  beforeEach(() => {
    onNoteOn = vi.fn();
    onNoteOff = vi.fn();
    keys = [makeKeyEl(60), makeKeyEl(61), makeKeyEl(62)];
  });

  afterEach(() => {
    document.querySelectorAll('.pianova-active').forEach((el) => el.classList.remove('pianova-active'));
  });

  it('pressKey / releaseKey triggers callbacks', () => {
    const im = new InputManager({ keys, onNoteOn, onNoteOff });
    im.pressKey(60);
    expect(onNoteOn).toHaveBeenCalledWith(60);

    im.releaseKey(60);
    expect(onNoteOff).toHaveBeenCalledWith(60);

    im.destroy();
  });

  it('pressKey adds active class', () => {
    const im = new InputManager({ keys, onNoteOn, onNoteOff });
    im.pressKey(60);
    expect(keys[0].element.classList.contains('pianova-active')).toBe(true);
    im.releaseKey(60);
    expect(keys[0].element.classList.contains('pianova-active')).toBe(false);
    im.destroy();
  });

  it('does not duplicate noteOn for already-pressed key', () => {
    const im = new InputManager({ keys, onNoteOn, onNoteOff });
    im.pressKey(60);
    im.pressKey(60);
    expect(onNoteOn).toHaveBeenCalledTimes(1);
    im.destroy();
  });

  it('releaseAll releases all active notes', () => {
    const im = new InputManager({ keys, onNoteOn, onNoteOff });
    im.pressKey(60);
    im.pressKey(62);
    im.releaseAll();
    expect(onNoteOff).toHaveBeenCalledWith(60);
    expect(onNoteOff).toHaveBeenCalledWith(62);
    im.destroy();
  });

  it('destroy releases all and removes listeners', () => {
    const im = new InputManager({ keys, onNoteOn, onNoteOff });
    im.pressKey(60);
    im.destroy();
    // Can call destroy again without error
    expect(() => im.destroy()).not.toThrow();
  });
});
