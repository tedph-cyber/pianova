import type { KeyElement } from './types';

const ACTIVE_CLASS = 'pianova-active';

// Q = C4 (middle C), home row = natural white keys
const DEFAULT_KEY_MAP: Record<string, number> = {
  // Lower octave (C3–B3) — white keys on bottom row
  z: 48, x: 50, c: 52, v: 53, b: 55, n: 57, m: 59,
  // Lower octave sharps
  s: 49, d: 51, g: 54, h: 56, j: 58,

  // Middle octave (C4–B4) — Q = C4
  q: 60, w: 62, e: 64, r: 65, t: 67, y: 69, u: 71,
  // Middle octave sharps
  '2': 61, '3': 63, '5': 66, '6': 68, '7': 70,

  // Upper octave (C5–B5)
  i: 72, o: 74, p: 76, '[': 77, ']': 79, '\\': 81,
  // Upper octave sharps
  '9': 73, '0': 75, '-': 78, '=': 80,

  // Extra keys (C6+)
  a: 84,
};

/** `velocity` (0–1) is only present for MIDI input; touch, mouse and QWERTY leave it out. */
export type NoteOnCallback = (midi: number, velocity?: number) => void;
export type NoteOffCallback = (midi: number) => void;

export interface InputConfig {
  keys: KeyElement[];
  /** The keyboard element. Pointer events are attached here and nowhere else. Omit for programmatic/QWERTY input only. */
  container?: HTMLElement;
  /** Sliding a pointer across keys releases the old key and presses the new one. Default `true`. */
  glide?: boolean;
  keyboardMap?: boolean | Record<string, number>;
  onNoteOn: NoteOnCallback;
  onNoteOff: NoteOffCallback;
}

export class InputManager {
  private keys: KeyElement[];
  private onNoteOn: NoteOnCallback;
  private onNoteOff: NoteOffCallback;
  private keyboardMap: Record<string, number> | null = null;
  private midiToKey = new Map<number, string[]>();

  private container: HTMLElement | null;
  private glide: boolean;
  private midiElements = new Map<number, HTMLElement>();
  private activeMidi = new Set<number>();
  /** pointerId → the key it is currently on. */
  private pointers = new Map<number, number>();
  /** midi → how many pointers hold it, so two fingers on one key release it only when both lift. */
  private pointerHolds = new Map<number, number>();

  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerEnd: (e: PointerEvent) => void;
  private boundContextMenu: (e: Event) => void;
  private boundVisibility: () => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundKeyActivate: (e: KeyboardEvent) => void;

  constructor(config: InputConfig) {
    this.keys = config.keys;
    this.onNoteOn = config.onNoteOn;
    this.onNoteOff = config.onNoteOff;
    this.container = config.container ?? null;
    this.glide = config.glide ?? true;

    this.setKeys(config.keys);

    // Keyboard mapping
    if (config.keyboardMap) {
      if (typeof config.keyboardMap === 'object') {
        this.keyboardMap = config.keyboardMap;
      } else if (config.keyboardMap === true) {
        this.keyboardMap = { ...DEFAULT_KEY_MAP };
      }
      if (this.keyboardMap) {
        for (const [key, midi] of Object.entries(this.keyboardMap)) {
          const existing = this.midiToKey.get(midi) || [];
          existing.push(key);
          this.midiToKey.set(midi, existing);
        }
      }
    }

    this.boundPointerDown = this.onPointerDown.bind(this);
    this.boundPointerMove = this.onPointerMove.bind(this);
    this.boundPointerEnd = this.onPointerEnd.bind(this);
    this.boundContextMenu = (e) => e.preventDefault(); // Android long-press menu
    this.boundVisibility = this.onVisibilityChange.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);
    this.boundKeyActivate = this.onKeyActivate.bind(this);

    this.attachEvents();
  }

  private attachEvents(): void {
    const c = this.container;
    if (c) {
      c.addEventListener('pointerdown', this.boundPointerDown);
      c.addEventListener('pointermove', this.boundPointerMove);
      c.addEventListener('pointerup', this.boundPointerEnd);
      c.addEventListener('pointercancel', this.boundPointerEnd);
      c.addEventListener('lostpointercapture', this.boundPointerEnd);
      c.addEventListener('contextmenu', this.boundContextMenu);
      c.addEventListener('keydown', this.boundKeyActivate);
      c.addEventListener('keyup', this.boundKeyActivate);
    }
    document.addEventListener('visibilitychange', this.boundVisibility);

    if (this.keyboardMap) {
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
    }
  }

  private detachEvents(): void {
    const c = this.container;
    if (c) {
      c.removeEventListener('pointerdown', this.boundPointerDown);
      c.removeEventListener('pointermove', this.boundPointerMove);
      c.removeEventListener('pointerup', this.boundPointerEnd);
      c.removeEventListener('pointercancel', this.boundPointerEnd);
      c.removeEventListener('lostpointercapture', this.boundPointerEnd);
      c.removeEventListener('contextmenu', this.boundContextMenu);
      c.removeEventListener('keydown', this.boundKeyActivate);
      c.removeEventListener('keyup', this.boundKeyActivate);
    }
    document.removeEventListener('visibilitychange', this.boundVisibility);

    if (this.keyboardMap) {
      window.removeEventListener('keydown', this.boundKeyDown);
      window.removeEventListener('keyup', this.boundKeyUp);
    }
  }

  /** The key under a DOM node, if it is one of ours. */
  private midiOf(node: EventTarget | Element | null | undefined): number | null {
    const hit = (node as Element | null | undefined)?.closest?.('[data-midi]') as HTMLElement | null | undefined;
    if (!hit || !this.container?.contains(hit)) return null;
    const midi = parseInt(hit.dataset.midi!, 10);
    return Number.isNaN(midi) ? null : midi;
  }

  /** Enter or Space on a focused key plays it, like a button. */
  private onKeyActivate(e: KeyboardEvent): void {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const midi = this.midiOf(e.target);
    if (midi === null) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'keyup') this.noteOff(midi);
    else if (!e.repeat) this.noteOn(midi);
  }

  private onPointerDown(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const midi = this.midiOf(e.target);
    if (midi === null) return;
    e.preventDefault();
    try {
      this.container!.setPointerCapture?.(e.pointerId); // keep move/up for this finger
    } catch {
      // synthetic or already-gone pointer: ignore
    }
    this.pointers.set(e.pointerId, midi);
    this.holdPointer(midi);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.glide) return;
    const prev = this.pointers.get(e.pointerId);
    if (prev === undefined) return;
    // With capture on, e.target is the container, so hit-test by position.
    const midi = this.midiOf(document.elementFromPoint?.(e.clientX, e.clientY));
    if (midi === null || midi === prev) return; // off the keys: keep the last note until lift
    this.pointers.set(e.pointerId, midi);
    this.releasePointer(prev);
    this.holdPointer(midi);
  }

  private onPointerEnd(e: PointerEvent): void {
    const midi = this.pointers.get(e.pointerId);
    if (midi === undefined) return;
    this.pointers.delete(e.pointerId);
    this.releasePointer(midi);
  }

  private onVisibilityChange(): void {
    if (document.visibilityState === 'hidden') this.releaseAll();
  }

  private holdPointer(midi: number): void {
    const n = this.pointerHolds.get(midi) ?? 0;
    this.pointerHolds.set(midi, n + 1);
    if (n === 0) this.noteOn(midi);
  }

  private releasePointer(midi: number): void {
    const n = (this.pointerHolds.get(midi) ?? 0) - 1;
    if (n > 0) {
      this.pointerHolds.set(midi, n);
      return;
    }
    this.pointerHolds.delete(midi);
    this.noteOff(midi);
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    if (!this.keyboardMap) return;
    const key = e.key.toLowerCase();
    const midi = this.keyboardMap[key];
    if (midi !== undefined) {
      e.preventDefault();
      this.noteOn(midi);
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    if (!this.keyboardMap) return;
    const key = e.key.toLowerCase();
    const midi = this.keyboardMap[key];
    if (midi !== undefined) {
      this.noteOff(midi);
    }
  }

  private noteOn(midi: number, velocity?: number): void {
    if (this.activeMidi.has(midi)) return;
    this.activeMidi.add(midi);
    this.midiElements.get(midi)?.classList.add(ACTIVE_CLASS);
    if (velocity === undefined) this.onNoteOn(midi);
    else this.onNoteOn(midi, velocity);
  }

  private noteOff(midi: number): void {
    if (!this.activeMidi.has(midi)) return;
    this.activeMidi.delete(midi);
    this.midiElements.get(midi)?.classList.remove(ACTIVE_CLASS);
    this.onNoteOff(midi);
  }

  pressKey(midi: number, velocity?: number): void {
    this.noteOn(midi, velocity);
  }

  releaseKey(midi: number): void {
    this.noteOff(midi);
  }

  releaseAll(): void {
    this.pointers.clear();
    this.pointerHolds.clear();
    for (const m of [...this.activeMidi]) {
      this.noteOff(m);
    }
  }

  setGlide(on: boolean): void {
    this.glide = on;
  }

  /** Point at a new set of key elements (the keyboard was rebuilt); pressed keys stay pressed. */
  setKeys(keys: KeyElement[]): void {
    for (const m of this.activeMidi) this.midiElements.get(m)?.classList.remove(ACTIVE_CLASS);
    this.keys = keys;
    this.midiElements.clear();
    for (const k of keys) this.midiElements.set(k.midi, k.element);
    for (const m of this.activeMidi) this.midiElements.get(m)?.classList.add(ACTIVE_CLASS);
  }

  destroy(): void {
    this.releaseAll();
    this.detachEvents();
    this.midiElements.clear();
    this.pointers.clear();
    this.pointerHolds.clear();
  }
}
