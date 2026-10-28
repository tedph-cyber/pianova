import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InputManager } from '../src/InputManager';
import type { KeyElement } from '../src/types';
import { pointerEvent, stubElementFromPoint, setVisibility } from './helpers';

describe('InputManager pointer input', () => {
  let container: HTMLElement;
  let keys: KeyElement[];
  let on: ReturnType<typeof vi.fn>;
  let off: ReturnType<typeof vi.fn>;
  let im: InputManager;
  let restore: () => void;
  let under: Element | null;

  const el = (midi: number) => keys.find((k) => k.midi === midi)!.element;

  beforeEach(() => {
    container = document.createElement('div');
    keys = [60, 62, 64].map((midi) => {
      const element = document.createElement('div');
      element.dataset.midi = String(midi);
      container.appendChild(element);
      return { element, midi, isBlack: false };
    });
    document.body.appendChild(container);
    on = vi.fn();
    off = vi.fn();
    under = null;
    restore = stubElementFromPoint(() => under);
    im = new InputManager({ keys, container, onNoteOn: on, onNoteOff: off });
  });

  afterEach(() => {
    im.destroy();
    restore();
    container.remove();
    setVisibility('visible');
  });

  it('pointerdown plays immediately, pointerup releases', () => {
    pointerEvent('pointerdown', el(60));
    expect(on).toHaveBeenCalledWith(60);
    expect(el(60).classList.contains('pianova-active')).toBe(true);
    pointerEvent('pointerup', container);
    expect(off).toHaveBeenCalledWith(60);
    expect(el(60).classList.contains('pianova-active')).toBe(false);
  });

  it('captures the pointer and prevents the default action', () => {
    container.setPointerCapture = vi.fn();
    const e = pointerEvent('pointerdown', el(62), { id: 7 });
    expect(container.setPointerCapture).toHaveBeenCalledWith(7);
    expect(e.defaultPrevented).toBe(true);
  });

  it('survives setPointerCapture throwing', () => {
    container.setPointerCapture = vi.fn(() => { throw new Error('NotFoundError'); });
    pointerEvent('pointerdown', el(60));
    expect(on).toHaveBeenCalledWith(60);
  });

  it('multi-touch: chords by pointerId, each finger releases only its own key', () => {
    pointerEvent('pointerdown', el(60), { id: 1 });
    pointerEvent('pointerdown', el(64), { id: 2 });
    expect(on).toHaveBeenCalledTimes(2);
    pointerEvent('pointerup', container, { id: 1 });
    expect(off).toHaveBeenCalledTimes(1);
    expect(off).toHaveBeenCalledWith(60);
    expect(el(64).classList.contains('pianova-active')).toBe(true);
    pointerEvent('pointerup', container, { id: 2 });
    expect(off).toHaveBeenCalledWith(64);
  });

  it('two fingers on one key release it only when both lift', () => {
    pointerEvent('pointerdown', el(60), { id: 1 });
    pointerEvent('pointerdown', el(60), { id: 2 });
    expect(on).toHaveBeenCalledTimes(1);
    pointerEvent('pointerup', container, { id: 1 });
    expect(off).not.toHaveBeenCalled();
    pointerEvent('pointerup', container, { id: 2 });
    expect(off).toHaveBeenCalledTimes(1);
  });

  it('glide: moving across keys releases the old key and presses the new one', () => {
    pointerEvent('pointerdown', el(60));
    under = el(62);
    pointerEvent('pointermove', container, { x: 10 });
    expect(off).toHaveBeenCalledWith(60);
    expect(on).toHaveBeenLastCalledWith(62);
    expect(off.mock.invocationCallOrder[0]).toBeLessThan(on.mock.invocationCallOrder[1]);
    pointerEvent('pointerup', container);
    expect(off).toHaveBeenLastCalledWith(62);
  });

  it('glide: staying on the same key or leaving the keys changes nothing', () => {
    pointerEvent('pointerdown', el(60));
    under = el(60);
    pointerEvent('pointermove', container);
    under = document.body;
    pointerEvent('pointermove', container);
    under = null;
    pointerEvent('pointermove', container);
    expect(on).toHaveBeenCalledTimes(1);
    expect(off).not.toHaveBeenCalled();
  });

  it('glide: moves with no pointer down are ignored (hover)', () => {
    under = el(62);
    pointerEvent('pointermove', container);
    expect(on).not.toHaveBeenCalled();
  });

  it('glide: false keeps the first key', () => {
    im.setGlide(false);
    pointerEvent('pointerdown', el(60));
    under = el(62);
    pointerEvent('pointermove', container);
    expect(on).toHaveBeenCalledTimes(1);
    expect(off).not.toHaveBeenCalled();
  });

  it('the glide option is honoured by the constructor', () => {
    im.destroy();
    im = new InputManager({ keys, container, glide: false, onNoteOn: on, onNoteOff: off });
    pointerEvent('pointerdown', el(60));
    under = el(62);
    pointerEvent('pointermove', container);
    expect(on).toHaveBeenCalledTimes(1);
  });

  it('pointercancel releases', () => {
    pointerEvent('pointerdown', el(60));
    pointerEvent('pointercancel', container);
    expect(off).toHaveBeenCalledWith(60);
  });

  it('lostpointercapture releases, and a following pointerup does not release twice', () => {
    pointerEvent('pointerdown', el(60));
    pointerEvent('lostpointercapture', container);
    pointerEvent('pointerup', container);
    expect(off).toHaveBeenCalledTimes(1);
  });

  it('releases every held note when the page becomes hidden', () => {
    pointerEvent('pointerdown', el(60), { id: 1 });
    pointerEvent('pointerdown', el(64), { id: 2 });
    setVisibility('hidden');
    expect(off).toHaveBeenCalledWith(60);
    expect(off).toHaveBeenCalledWith(64);
    // the late pointerup after coming back must not double-release
    setVisibility('visible');
    pointerEvent('pointerup', container, { id: 1 });
    expect(off).toHaveBeenCalledTimes(2);
  });

  it('becoming visible releases nothing', () => {
    pointerEvent('pointerdown', el(60));
    setVisibility('visible');
    expect(off).not.toHaveBeenCalled();
  });

  it('ignores the right mouse button, but not a left click', () => {
    pointerEvent('pointerdown', el(60), { pointerType: 'mouse', button: 2 });
    expect(on).not.toHaveBeenCalled();
    pointerEvent('pointerdown', el(60), { pointerType: 'mouse', button: 0 });
    expect(on).toHaveBeenCalledWith(60);
  });

  it('a press that lands off the keys does nothing and is not prevented', () => {
    const e = pointerEvent('pointerdown', container);
    expect(on).not.toHaveBeenCalled();
    expect(e.defaultPrevented).toBe(false);
  });

  it('prevents the context menu on the keyboard', () => {
    const e = new Event('contextmenu', { bubbles: true, cancelable: true });
    el(60).dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });

  it('does not touch events outside the keyboard', () => {
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const e = pointerEvent('pointerdown', outside);
    const t = new Event('touchstart', { bubbles: true, cancelable: true });
    outside.dispatchEvent(t);
    expect(e.defaultPrevented).toBe(false);
    expect(t.defaultPrevented).toBe(false);
    expect(on).not.toHaveBeenCalled();
    outside.remove();
  });

  it('legacy mouse and touch events no longer play notes', () => {
    el(60).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el(60).dispatchEvent(new Event('touchstart', { bubbles: true }));
    expect(on).not.toHaveBeenCalled();
  });

  it('releaseAll and destroy never leave a stuck note', () => {
    pointerEvent('pointerdown', el(60), { id: 1 });
    pointerEvent('pointerdown', el(62), { id: 2 });
    im.destroy();
    expect(off).toHaveBeenCalledTimes(2);
    pointerEvent('pointerdown', el(64)); // listeners are gone
    expect(on).toHaveBeenCalledTimes(2);
  });

  it('setKeys re-targets a rebuilt keyboard and keeps pressed keys pressed', () => {
    pointerEvent('pointerdown', el(60));
    const fresh = document.createElement('div');
    fresh.dataset.midi = '60';
    container.appendChild(fresh);
    im.setKeys([{ element: fresh as HTMLDivElement, midi: 60, isBlack: false }]);
    expect(fresh.classList.contains('pianova-active')).toBe(true);
    pointerEvent('pointerup', container);
    expect(fresh.classList.contains('pianova-active')).toBe(false);
  });

  it('works without a container (programmatic input only)', () => {
    const bare = new InputManager({ keys, onNoteOn: on, onNoteOff: off });
    bare.pressKey(60);
    expect(on).toHaveBeenCalledWith(60);
    bare.destroy();
  });
});
