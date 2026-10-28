import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Piano } from '../src/index';

const key = (root: HTMLElement, midi: number): HTMLElement =>
  root.querySelector<HTMLElement>(`[data-midi="${midi}"]`)!;

describe('key state', () => {
  let root: HTMLElement;
  let piano: Piano;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    piano = new Piano({ root, range: { first: 'C4', last: 'C5' } });
  });

  afterEach(() => {
    piano.destroy();
    root.remove();
  });

  it('colours a key without playing it', () => {
    const played: number[] = [];
    piano.on('noteOn', (n) => played.push(n.midi));
    piano.setKeyState(60, { color: 'gold' });
    const el = key(root, 60);
    expect(el.classList.contains('pianova-colored')).toBe(true);
    expect(el.style.getPropertyValue('--pianova-key-color')).toBe('gold');
    expect(played).toEqual([]);
  });

  it('accepts note names as well as MIDI numbers', () => {
    piano.setKeyState('E4', { mark: true });
    expect(key(root, 64).classList.contains('pianova-marked')).toBe(true);
  });

  it('shows a badge, e.g. a finger number', () => {
    piano.setKeyState(62, { badge: 3 });
    expect(key(root, 62).querySelector('.pianova-key-badge')?.textContent).toBe('3');
  });

  it('overrides the label on a key', () => {
    piano.setKeyState(60, { label: 'home' });
    expect(key(root, 60).querySelector('.pianova-key-label')?.textContent).toBe('home');
  });

  it('replaces the previous state rather than merging', () => {
    piano.setKeyState(60, { color: 'gold', mark: true, badge: 1, label: 'x' });
    piano.setKeyState(60, { mark: true });
    const el = key(root, 60);
    expect(el.classList.contains('pianova-colored')).toBe(false);
    expect(el.style.getPropertyValue('--pianova-key-color')).toBe('');
    expect(el.classList.contains('pianova-marked')).toBe(true);
    expect(el.querySelector('.pianova-key-badge')).toBeNull();
    expect(el.querySelector('.pianova-key-label')?.textContent).toBe('C4');
  });

  it('clears one key with null, and every key with clearKeyStates', () => {
    piano.setKeyState(60, { mark: true });
    piano.setKeyState(61, { color: 'blue', badge: 2 });
    piano.setKeyState(60, null);
    expect(key(root, 60).classList.contains('pianova-marked')).toBe(false);
    piano.clearKeyStates();
    expect(key(root, 61).classList.contains('pianova-colored')).toBe(false);
    expect(key(root, 61).querySelector('.pianova-key-badge')).toBeNull();
  });

  it('ignores keys outside the range', () => {
    expect(() => piano.setKeyState(20, { mark: true })).not.toThrow();
  });
});

describe('accessibility', () => {
  it('exposes each key as a named button', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const p = new Piano({ root, range: { first: 'C4', last: 'C#4' } });
    expect(key(root, 60).getAttribute('role')).toBe('button');
    expect(key(root, 60).textContent).toBe('C4');
    expect(key(root, 61).getAttribute('aria-label')).toBe('C#4');
    p.destroy();
    root.remove();
  });

  it('keeps key state across a fit-mode rebuild', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const p = new Piano({ root, fit: { start: 'C4', minWhiteKeyPx: 40 } });
    p.setKeyState(60, { mark: true, label: 'x' });
    p.setLabels(() => 'y');
    expect(key(root, 60).classList.contains('pianova-marked')).toBe(true);
    expect(key(root, 60).querySelector('.pianova-key-label')?.textContent).toBe('x');
    p.destroy();
    root.remove();
  });

  it('lets a focused key be played with Enter or Space', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const p = new Piano({ root, range: { first: 'C4', last: 'D4' }, keyboardShortcuts: false });
    const played: string[] = [];
    p.on('noteOn', (n) => played.push(`on ${n.midi}`));
    p.on('noteOff', (n) => played.push(`off ${n.midi}`));
    const el = key(root, 62);
    expect(el.tabIndex).toBe(0);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
    expect(played).toEqual(['on 62', 'off 62', 'on 62', 'off 62']);
    p.destroy();
    root.remove();
  });
});
