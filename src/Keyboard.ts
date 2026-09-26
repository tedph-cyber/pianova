import type { KeyElement, KeyLabels, KeyboardLayout, NoteInfo } from './types';
import { getNoteRange, isWhiteKey, isBlackKey } from './NoteMap';
import { injectStyles } from './css';

const WK_W = 48;
const WK_H = 200;
const BK_W = 30;
const BLACK_HEIGHT_RATIO = 0.62;
const FLUID_BLACK_WIDTH_RATIO = 0.58;
const FLUID_BLACK_HEIGHT = '60%';

export interface KeyboardOptions {
  keyLabels?: KeyLabels;
  layout?: KeyboardLayout;
  keyHeight?: number;
  minWhiteKeyWidth?: number;
}

export interface KeyboardResult {
  container: HTMLElement;
  keys: KeyElement[];
}

function labelFor(n: NoteInfo, white: boolean, keyLabels: KeyLabels): string {
  if (keyLabels === false) return '';
  if (typeof keyLabels === 'function') return keyLabels(n);
  return white ? n.name : '';
}

export function setKeyLabel(el: HTMLElement, text: string): void {
  let span = el.querySelector<HTMLElement>('.pianova-key-label');
  if (!text) {
    span?.remove();
    return;
  }
  if (!span) {
    span = document.createElement('span');
    span.className = 'pianova-key-label';
    el.appendChild(span);
  }
  span.textContent = text;
}

function createKey(n: NoteInfo, black: boolean, label: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = black ? 'pianova-black-key' : 'pianova-white-key';
  el.dataset.midi = String(n.midi);
  el.setAttribute('role', 'button');
  el.tabIndex = 0;
  el.setAttribute('aria-label', n.name);
  setKeyLabel(el, label);
  return el;
}

export function createKeyboard(
  first: string | number,
  last: string | number,
  root: HTMLElement,
  options: KeyboardOptions = {},
): KeyboardResult {
  const { keyLabels = true, layout = 'fixed', keyHeight = WK_H, minWhiteKeyWidth } = options;
  const fluid = layout === 'fluid';
  const notes = getNoteRange(first, last);
  const whiteNotes = notes.filter((n) => isWhiteKey(n.midi));
  const blackNotes = notes.filter((n) => isBlackKey(n.midi));
  const whiteCount = whiteNotes.length;

  const container = document.createElement('div');
  container.className = 'pianova-keyboard';
  if (fluid) container.classList.add('pianova-fluid');

  const keys: KeyElement[] = [];
  const whiteIndexMap = new Map<number, number>();

  whiteNotes.forEach((n, i) => {
    whiteIndexMap.set(n.midi, i);
    const defaultLabel = labelFor(n, true, keyLabels);
    const el = createKey(n, false, defaultLabel);
    if (fluid) el.style.flex = '1 1 0%';
    else el.style.width = `${WK_W}px`;
    el.style.height = `${keyHeight}px`;
    container.appendChild(el);
    keys.push({ element: el, midi: n.midi, isBlack: false, defaultLabel });
  });

  const fluidBlackWidth = (100 / whiteCount) * FLUID_BLACK_WIDTH_RATIO;

  blackNotes.forEach((n) => {
    const leftIdx = whiteIndexMap.get(n.midi - 1);
    if (leftIdx === undefined) return;

    const defaultLabel = labelFor(n, false, keyLabels);
    const el = createKey(n, true, defaultLabel);
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.zIndex = '10';
    if (fluid) {
      el.style.left = `${(((leftIdx + 1) / whiteCount) * 100 - fluidBlackWidth / 2).toFixed(4)}%`;
      el.style.width = `${fluidBlackWidth.toFixed(4)}%`;
      el.style.height = FLUID_BLACK_HEIGHT;
    } else {
      el.style.left = `${(leftIdx + 1) * WK_W - BK_W / 2}px`;
      el.style.width = `${BK_W}px`;
      el.style.height = `${Math.round(keyHeight * BLACK_HEIGHT_RATIO)}px`;
    }

    container.appendChild(el);
    keys.push({ element: el, midi: n.midi, isBlack: true, defaultLabel });
  });

  container.style.position = 'relative';
  container.style.height = `${keyHeight}px`;
  container.style.width = fluid ? '100%' : `${whiteCount * WK_W}px`;
  if (minWhiteKeyWidth) container.style.minWidth = `${whiteCount * minWhiteKeyWidth}px`;

  root.appendChild(container);
  injectStyles();

  return { container, keys };
}
