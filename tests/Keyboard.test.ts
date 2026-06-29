import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createKeyboard } from '../src/Keyboard';

describe('createKeyboard', () => {
  let root: HTMLElement;

  beforeAll(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
  });

  afterAll(() => {
    root.remove();
  });

  it('renders white and black keys for C4-B4', () => {
    const { container, keys } = createKeyboard('C4', 'B4', root);

    expect(container).toBeTruthy();
    expect(container.classList.contains('pianova-keyboard')).toBe(true);

    const whiteKeys = keys.filter((k) => !k.isBlack);
    const blackKeys = keys.filter((k) => k.isBlack);

    expect(whiteKeys).toHaveLength(7);
    expect(blackKeys).toHaveLength(5);
    expect(keys).toHaveLength(12);
  });

  it('renders correct first and last white keys', () => {
    const { keys } = createKeyboard('C3', 'E3', root);
    const whiteKeys = keys.filter((k) => !k.isBlack);
    expect(whiteKeys[0].midi).toBe(48);  // C3
    expect(whiteKeys[whiteKeys.length - 1].midi).toBe(52); // E3
  });

  it('gives black keys higher z-index than white', () => {
    const { container } = createKeyboard('C4', 'B4', root);
    const blackEls = container.querySelectorAll('.pianova-black-key');
    for (const el of blackEls) {
      expect((el as HTMLElement).style.zIndex).toBe('10');
    }
  });

  it('has data-midi attributes on every key', () => {
    const { container, keys } = createKeyboard('C4', 'B4', root);
    for (const k of keys) {
      const midi = parseInt(k.element.dataset.midi!, 10);
      expect(midi).toBe(k.midi);
    }
  });

  it('adds note labels to white keys', () => {
    const { container } = createKeyboard('C4', 'B4', root);
    const labels = container.querySelectorAll('.pianova-key-label');
    expect(labels).toHaveLength(7);
    expect(labels[0].textContent).toBe('C4');
    expect(labels[6].textContent).toBe('B4');
  });
});
