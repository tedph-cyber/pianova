import type { KeyElement, FitOptions, VisibleRange } from './types';
import { getNoteRange, isWhiteKey, isBlackKey, parseNote } from './NoteMap';
import { injectStyles } from './css';

const WK_W = 48;
const BK_W = 30;
const BK_RATIO = BK_W / WK_W;

export interface KeyboardOptions {
  /** Text on each key. Without it white keys show their note name. */
  labels?: (midi: number) => string;
  /** Show as many white keys as fit the container; `first`/`last` are ignored. */
  fit?: FitOptions;
  /** Fit mode: called with the new key elements after every rebuild (not the first). */
  onRebuild?: (keys: KeyElement[]) => void;
  /** Fit mode: called when the visible range changes after a resize (not the first build). */
  onRangeChange?: (range: VisibleRange) => void;
}

export interface KeyboardResult {
  container: HTMLElement;
  /** The current key elements. In fit mode this changes when the container is resized. */
  readonly keys: KeyElement[];
  /** Replace the label function (`null` restores note names) and redraw the labels. */
  relabel(fn: ((midi: number) => string) | null): void;
  /** Fit mode: move the lowest key (a black key rounds down to the white key below). No-op otherwise. */
  setStart(note: string | number): void;
  /** Fit mode: the lowest key's MIDI number; `null` for a fixed range. */
  start(): number | null;
  /** Highlight keys independently of what is pressed. Replaces the previous set. */
  setActive(midis: Iterable<number>): void;
  range(): VisibleRange;
  destroy(): void;
}

const LIT_CLASS = 'pianova-lit';

function whiteAtOrBelow(midi: number): number {
  let m = Math.min(127, Math.max(0, midi));
  while (m > 0 && isBlackKey(m)) m--;
  return m;
}

export function createKeyboard(
  first: string | number,
  last: string | number,
  root: HTMLElement,
  options: KeyboardOptions = {},
): KeyboardResult {
  const container = document.createElement('div');
  container.className = 'pianova-keyboard';
  container.style.position = 'relative';
  container.style.touchAction = 'none';

  let labels = options.labels ?? null;
  let keys: KeyElement[] = [];
  let lit = new Set<number>();
  let observer: ResizeObserver | null = null;
  let built = false;
  let fitWhites = 0;
  let fitStart = 0;

  function setLabel(el: HTMLElement, midi: number, black: boolean): void {
    const text = labels ? labels(midi) : black ? '' : parseNote(midi).name;
    let span = el.querySelector<HTMLElement>('.pianova-key-label');
    if (!text) {
      span?.remove();
      el.removeAttribute('aria-label');
      return;
    }
    if (!span) {
      span = document.createElement('span');
      span.className = 'pianova-key-label';
      el.appendChild(span);
    }
    span.textContent = text;
    if (labels) el.setAttribute('aria-label', text);
    else el.removeAttribute('aria-label');
  }

  function build(notes: ReturnType<typeof getNoteRange>, whiteCount: number, percent: boolean): void {
    container.textContent = '';
    keys = [];
    const whiteIndexMap = new Map<number, number>();
    const whiteNotes = notes.filter((n) => isWhiteKey(n.midi));
    const blackNotes = notes.filter((n) => isBlackKey(n.midi));

    whiteNotes.forEach((n, i) => {
      whiteIndexMap.set(n.midi, i);
      const el = document.createElement('div');
      el.className = 'pianova-white-key';
      el.dataset.midi = String(n.midi);
      el.style.width = percent ? `${100 / whiteCount}%` : `${WK_W}px`;
      setLabel(el, n.midi, false);
      container.appendChild(el);
      keys.push({ element: el, midi: n.midi, isBlack: false });
    });

    blackNotes.forEach((n) => {
      const leftIdx = whiteIndexMap.get(n.midi - 1);
      if (leftIdx === undefined) return;
      const el = document.createElement('div');
      el.className = 'pianova-black-key';
      el.dataset.midi = String(n.midi);
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.zIndex = '10';
      if (percent) {
        const w = (100 / whiteCount) * BK_RATIO;
        el.style.width = `${w}%`;
        el.style.left = `${((leftIdx + 1) / whiteCount) * 100 - w / 2}%`;
      } else {
        el.style.width = `${BK_W}px`;
        el.style.left = `${(leftIdx + 1) * WK_W - BK_W / 2}px`;
      }
      setLabel(el, n.midi, true);
      container.appendChild(el);
      keys.push({ element: el, midi: n.midi, isBlack: true });
    });

    paintLit();
  }

  function paintLit(): void {
    for (const k of keys) k.element.classList.toggle(LIT_CLASS, lit.has(k.midi));
  }

  function range(): VisibleRange {
    if (!keys.length) return { low: 0, high: 0 };
    const midis = keys.map((k) => k.midi);
    return { low: Math.min(...midis), high: Math.max(...midis) };
  }

  let refit: ((force?: boolean) => void) | null = null;

  if (options.fit) {
    const { start, minWhiteKeyPx } = options.fit;
    fitStart = whiteAtOrBelow(parseNote(start).midi);
    container.style.width = '100%';
    container.style.overflow = 'hidden';

    const fit = (force = false) => {
      const want = Math.max(1, Math.floor(container.clientWidth / Math.max(1, minWhiteKeyPx)));
      // fitStart is a white key; walk up to the nth white key, stopping at MIDI 127.
      let hi = fitStart;
      let whites = 1;
      while (whites < want && hi < 127) { hi++; if (isWhiteKey(hi)) whites++; }
      if (built && !force && whites === fitWhites) return;
      fitWhites = whites;
      build(getNoteRange(fitStart, hi), whites, true);
      if (built) {
        options.onRebuild?.(keys);
        options.onRangeChange?.(range());
      }
      built = true;
    };

    refit = fit;
    root.appendChild(container);
    injectStyles();
    fit();
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => fit());
      observer.observe(container);
    }
  } else {
    const notes = getNoteRange(first, last);
    const whiteCount = notes.filter((n) => isWhiteKey(n.midi)).length;
    build(notes, whiteCount, false);
    container.style.width = `${whiteCount * WK_W}px`;
    root.appendChild(container);
    injectStyles();
    built = true;
  }

  return {
    container,
    get keys() { return keys; },
    relabel(fn) {
      labels = fn;
      for (const k of keys) setLabel(k.element, k.midi, k.isBlack);
    },
    setActive(midis) {
      lit = new Set(midis);
      paintLit();
    },
    setStart(note) {
      if (!options.fit) return;
      const next = whiteAtOrBelow(parseNote(note).midi);
      if (next === fitStart) return;
      fitStart = next;
      refit?.(true);
    },
    start: () => (options.fit ? fitStart : null),
    range,
    destroy() {
      observer?.disconnect();
      observer = null;
    },
  };
}
