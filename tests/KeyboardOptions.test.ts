import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createKeyboard } from '../src/Keyboard';
import { MockResizeObserver } from './setup';

describe('createKeyboard options', () => {
  let root: HTMLElement;
  beforeEach(() => { root = document.createElement('div'); document.body.appendChild(root); });
  afterEach(() => { root.remove(); vi.restoreAllMocks(); });

  const labelOf = (el: Element) => el.querySelector('.pianova-key-label')?.textContent ?? null;
  const key = (r: ReturnType<typeof createKeyboard>, midi: number) => r.keys.find((k) => k.midi === midi)!.element;

  describe('labels', () => {
    it('defaults to note names on white keys only', () => {
      const kb = createKeyboard('C4', 'B4', root);
      expect(labelOf(key(kb, 60))).toBe('C4');
      expect(labelOf(key(kb, 61))).toBeNull();
    });

    it('labels every key from the function, black keys included', () => {
      const kb = createKeyboard('C4', 'B4', root, { labels: (m) => `n${m}` });
      expect(labelOf(key(kb, 60))).toBe('n60');
      expect(labelOf(key(kb, 61))).toBe('n61');
      expect(key(kb, 61).getAttribute('aria-label')).toBe('n61');
    });

    it('an empty string shows no label', () => {
      const kb = createKeyboard('C4', 'B4', root, { labels: (m) => (m === 60 ? 'do' : '') });
      expect(labelOf(key(kb, 60))).toBe('do');
      expect(labelOf(key(kb, 62))).toBeNull();
    });

    it('relabel redraws, and null restores note names', () => {
      const kb = createKeyboard('C4', 'B4', root);
      kb.relabel(() => 'x');
      expect(labelOf(key(kb, 62))).toBe('x');
      kb.relabel(null);
      expect(labelOf(key(kb, 62))).toBe('D4');
      expect(labelOf(key(kb, 61))).toBeNull();
    });
  });

  describe('setActive', () => {
    it('lights keys independently of pressed state', () => {
      const kb = createKeyboard('C4', 'B4', root);
      kb.setActive([60, 61]);
      expect(key(kb, 60).classList.contains('pianova-lit')).toBe(true);
      expect(key(kb, 61).classList.contains('pianova-lit')).toBe(true);
      expect(key(kb, 60).classList.contains('pianova-active')).toBe(false);
    });

    it('replaces the previous set and accepts any iterable', () => {
      const kb = createKeyboard('C4', 'B4', root);
      kb.setActive(new Set([60]));
      kb.setActive(new Set([62]));
      expect(key(kb, 60).classList.contains('pianova-lit')).toBe(false);
      expect(key(kb, 62).classList.contains('pianova-lit')).toBe(true);
      kb.setActive([]);
      expect(root.querySelectorAll('.pianova-lit')).toHaveLength(0);
    });

    it('ignores notes that are not on the keyboard', () => {
      const kb = createKeyboard('C4', 'B4', root);
      expect(() => kb.setActive([10, 120])).not.toThrow();
    });
  });

  describe('fit', () => {
    let width = 480;
    beforeEach(() => {
      width = 480;
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width);
      MockResizeObserver.instances.clear();
    });

    const whites = (kb: ReturnType<typeof createKeyboard>) => kb.keys.filter((k) => !k.isBlack);

    it('shows as many white keys as fit, starting at `start`, ending on a white key', () => {
      const kb = createKeyboard('C2', 'C6', root, { fit: { start: 'C4', minWhiteKeyPx: 50 } });
      expect(whites(kb)).toHaveLength(9); // floor(480 / 50)
      expect(kb.range()).toEqual({ low: 60, high: 60 + 12 + 2 }); // C4 … D5
      expect(kb.keys.find((k) => k.midi === kb.range().high)!.isBlack).toBe(false);
    });

    it('sizes keys in percent so they fill the container', () => {
      const kb = createKeyboard('C2', 'C6', root, { fit: { start: 60, minWhiteKeyPx: 60 } });
      expect(whites(kb)).toHaveLength(8);
      expect(key(kb, 60).style.width).toBe('12.5%');
      expect(kb.container.style.width).toBe('100%');
    });

    it('rounds a black-key start down to the white key below', () => {
      const kb = createKeyboard('C2', 'C6', root, { fit: { start: 'F#4', minWhiteKeyPx: 100 } });
      expect(kb.range().low).toBe(65); // F4
    });

    it('rebuilds on resize, firing onRebuild and onRangeChange', () => {
      const onRebuild = vi.fn();
      const onRangeChange = vi.fn();
      const kb = createKeyboard('C2', 'C6', root, {
        fit: { start: 'C4', minWhiteKeyPx: 60 }, onRebuild, onRangeChange,
      });
      expect(onRebuild).not.toHaveBeenCalled(); // nothing for the first build
      width = 240;
      MockResizeObserver.fireAll();
      expect(whites(kb)).toHaveLength(4);
      expect(onRebuild).toHaveBeenCalledTimes(1);
      expect(onRebuild.mock.calls[0][0]).toBe(kb.keys);
      expect(onRangeChange).toHaveBeenCalledWith({ low: 60, high: 65 });
    });

    it('does not rebuild when the key count is unchanged', () => {
      const onRebuild = vi.fn();
      createKeyboard('C2', 'C6', root, { fit: { start: 'C4', minWhiteKeyPx: 60 }, onRebuild });
      width = 500; // still 8 keys
      MockResizeObserver.fireAll();
      expect(onRebuild).not.toHaveBeenCalled();
    });

    it('keeps lit keys and labels across a rebuild', () => {
      const kb = createKeyboard('C2', 'C6', root, {
        fit: { start: 'C4', minWhiteKeyPx: 60 }, labels: (m) => `n${m}`,
      });
      kb.setActive([62]);
      width = 600;
      MockResizeObserver.fireAll();
      expect(whites(kb)).toHaveLength(10);
      expect(key(kb, 62).classList.contains('pianova-lit')).toBe(true);
      expect(labelOf(key(kb, 64))).toBe('n64');
    });

    it('never goes below one key, and stops at MIDI 127', () => {
      width = 0;
      expect(whites(createKeyboard('C2', 'C6', root, { fit: { start: 'C4', minWhiteKeyPx: 50 } }))).toHaveLength(1);
      width = 5000;
      const kb = createKeyboard('C2', 'C6', root, { fit: { start: 'C9', minWhiteKeyPx: 10 } });
      expect(kb.range().high).toBe(127);
    });

    it('destroy stops observing', () => {
      const kb = createKeyboard('C2', 'C6', root, { fit: { start: 'C4', minWhiteKeyPx: 60 } });
      expect(MockResizeObserver.instances.size).toBe(1);
      kb.destroy();
      expect(MockResizeObserver.instances.size).toBe(0);
    });
  });

  it('the fixed range keyboard is unchanged: 48px white keys, fixed width', () => {
    const kb = createKeyboard('C4', 'B4', root);
    expect(kb.container.style.width).toBe('336px');
    expect(key(kb, 60).style.width).toBe('48px');
    expect(kb.container.style.touchAction).toBe('none');
  });
});
