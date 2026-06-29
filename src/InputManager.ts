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

export type NoteOnCallback = (midi: number) => void;
export type NoteOffCallback = (midi: number) => void;

export interface InputConfig {
  keys: KeyElement[];
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

  private midiElements = new Map<number, HTMLElement>();
  private activeMidi = new Set<number>();
  private touchMap = new Map<number, number>();

  private boundMouseDown: (e: MouseEvent) => void;
  private boundMouseUp: (e: MouseEvent) => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;

  constructor(config: InputConfig) {
    this.keys = config.keys;
    this.onNoteOn = config.onNoteOn;
    this.onNoteOff = config.onNoteOff;

    for (const k of config.keys) {
      this.midiElements.set(k.midi, k.element);
    }

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

    this.boundMouseDown = this.onMouseDown.bind(this);
    this.boundMouseUp = this.onMouseUp.bind(this);
    this.boundTouchStart = this.onTouchStart.bind(this);
    this.boundTouchEnd = this.onTouchEnd.bind(this);
    this.boundKeyDown = this.onKeyDown.bind(this);
    this.boundKeyUp = this.onKeyUp.bind(this);

    this.attachEvents();
  }

  private attachEvents(): void {
    for (const k of this.keys) {
      k.element.addEventListener('mousedown', this.boundMouseDown);
    }
    window.addEventListener('mouseup', this.boundMouseUp);
    // Use document for touch to capture all touches
    document.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    document.addEventListener('touchend', this.boundTouchEnd, { passive: false });

    if (this.keyboardMap) {
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
    }
  }

  private detachEvents(): void {
    for (const k of this.keys) {
      k.element.removeEventListener('mousedown', this.boundMouseDown);
    }
    window.removeEventListener('mouseup', this.boundMouseUp);
    document.removeEventListener('touchstart', this.boundTouchStart);
    document.removeEventListener('touchend', this.boundTouchEnd);

    if (this.keyboardMap) {
      window.removeEventListener('keydown', this.boundKeyDown);
      window.removeEventListener('keyup', this.boundKeyUp);
    }
  }

  private onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    const el = (e.currentTarget as HTMLElement);
    const midi = parseInt(el.dataset.midi!, 10);
    this.noteOn(midi);
  }

  private onMouseUp(e: MouseEvent): void {
    // Check if mouse is over a key
    const el = (e.target as HTMLElement).closest('[data-midi]') as HTMLElement | null;
    if (el) return;
    // Release all mouse-activated notes
    for (const m of this.activeMidi) {
      this.noteOff(m);
    }
  }

  private onTouchStart(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const el = document.elementFromPoint(t.clientX, t.clientY)?.closest('[data-midi]') as HTMLElement | null;
      if (el) {
        e.preventDefault();
        const midi = parseInt(el.dataset.midi!, 10);
        this.touchMap.set(t.identifier, midi);
        this.noteOn(midi);
      }
    }
  }

  private onTouchEnd(e: TouchEvent): void {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const midi = this.touchMap.get(t.identifier);
      if (midi !== undefined) {
        this.touchMap.delete(t.identifier);
        this.noteOff(midi);
      }
    }
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

  private noteOn(midi: number): void {
    if (this.activeMidi.has(midi)) return;
    this.activeMidi.add(midi);
    this.midiElements.get(midi)?.classList.add(ACTIVE_CLASS);
    this.onNoteOn(midi);
  }

  private noteOff(midi: number): void {
    if (!this.activeMidi.has(midi)) return;
    this.activeMidi.delete(midi);
    this.midiElements.get(midi)?.classList.remove(ACTIVE_CLASS);
    this.onNoteOff(midi);
  }

  pressKey(midi: number): void {
    this.noteOn(midi);
  }

  releaseKey(midi: number): void {
    this.noteOff(midi);
  }

  releaseAll(): void {
    for (const m of [...this.activeMidi]) {
      this.noteOff(m);
    }
  }

  destroy(): void {
    this.releaseAll();
    this.detachEvents();
    this.midiElements.clear();
    this.touchMap.clear();
  }
}
