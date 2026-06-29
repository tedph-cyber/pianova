import type { KeyElement } from './types';
import { getNoteRange, isWhiteKey, isBlackKey, whiteKeyIndex, midiToNote } from './NoteMap';
import { injectStyles } from './css';

const WK_W = 48;
const WK_H = 200;
const BK_W = 30;
const BK_H = 124;

export interface KeyboardResult {
  container: HTMLElement;
  keys: KeyElement[];
}

export function createKeyboard(
  first: string | number,
  last: string | number,
  root: HTMLElement,
): KeyboardResult {
  const notes = getNoteRange(first, last);
  const whiteNotes = notes.filter((n) => isWhiteKey(n.midi));
  const blackNotes = notes.filter((n) => isBlackKey(n.midi));

  const container = document.createElement('div');
  container.className = 'pianova-keyboard';

  const keys: KeyElement[] = [];
  const whiteIndexMap = new Map<number, number>();

  whiteNotes.forEach((n, i) => {
    whiteIndexMap.set(n.midi, i);

    const el = document.createElement('div');
    el.className = 'pianova-white-key';
    el.dataset.midi = String(n.midi);
    el.style.width = `${WK_W}px`;
    el.style.height = `${WK_H}px`;

    const label = document.createElement('span');
    label.className = 'pianova-key-label';
    label.textContent = n.name;
    el.appendChild(label);

    container.appendChild(el);
    keys.push({ element: el, midi: n.midi, isBlack: false });
  });

  blackNotes.forEach((n) => {
    const leftMidi = n.midi - 1;
    const leftIdx = whiteIndexMap.get(leftMidi);
    if (leftIdx === undefined) return;

    const el = document.createElement('div');
    el.className = 'pianova-black-key';
    el.dataset.midi = String(n.midi);
    el.style.width = `${BK_W}px`;
    el.style.height = `${BK_H}px`;
    el.style.position = 'absolute';
    el.style.left = `${(leftIdx + 1) * WK_W - BK_W / 2}px`;
    el.style.top = '0';
    el.style.zIndex = '10';

    container.appendChild(el);
    keys.push({ element: el, midi: n.midi, isBlack: true });
  });

  container.style.position = 'relative';
  container.style.height = `${WK_H}px`;
  container.style.width = `${whiteNotes.length * WK_W}px`;

  root.appendChild(container);
  injectStyles();

  return { container, keys };
}
