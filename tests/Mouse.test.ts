import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Piano } from '../src/index';

describe('mouse input', () => {
  let root: HTMLElement;
  let piano: Piano;
  const on = vi.fn();
  const off = vi.fn();

  beforeEach(() => {
    on.mockClear();
    off.mockClear();
    root = document.createElement('div');
    document.body.appendChild(root);
    piano = new Piano({ root, range: { first: 'C4', last: 'B4' } });
    piano.on('noteOn', (n) => on(n.midi));
    piano.on('noteOff', (n) => off(n.midi));
  });

  afterEach(() => {
    piano.destroy();
    root.remove();
  });

  const key = (midi: number) => root.querySelector<HTMLElement>(`[data-midi="${midi}"]`)!;
  const mouse = (type: string, target: EventTarget) =>
    target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));

  it('releases the note when the mouse is released on the same key', () => {
    mouse('mousedown', key(60));
    mouse('mouseup', key(60));
    expect(on).toHaveBeenCalledWith(60);
    expect(off).toHaveBeenCalledWith(60);
    expect(key(60).classList.contains('pianova-active')).toBe(false);
  });

  it('releases the note when the mouse is released anywhere else', () => {
    mouse('mousedown', key(62));
    mouse('mouseup', document.body);
    expect(off).toHaveBeenCalledWith(62);
  });

  it('does not release notes held by other inputs', () => {
    piano.playNote(64);
    mouse('mousedown', key(60));
    mouse('mouseup', document.body);
    expect(off).toHaveBeenCalledWith(60);
    expect(off).not.toHaveBeenCalledWith(64);
  });
});
