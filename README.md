# pianova

> A vanilla TypeScript piano keyboard component with built-in Web Audio synthesis. Zero runtime dependencies. Works with any framework — or none.

```
npm install pianova
```

---

## Features

- **Zero dependencies** — no lodash, no jQuery, no React. Just the browser's own APIs.
- **Built-in synth** — Web Audio oscillator with ADSR envelope. Works the moment you call `new Piano()`.
- **Custom audio** — bring your own SoundFont or sampler via `onPlayNote` / `onStopNote` callbacks.
- **Three input modes** — mouse click, multi-touch (chords on mobile), and QWERTY keyboard.
- **Pitch bend** (±2 semitones), **LFO modulation** (vibrato), **sustain pedal**, and **global detune** (cents).
- **Transpose** (±24 semitones) and **octave shift** (±4 octaves) — shifts all played notes in real time.
- **Key identifier** — `piano.lastNote` tracks the most recently played note (with transpose baked in).
- **Themeable** — all visuals controlled via CSS custom properties.
- **Tree-shakeable ESM** + CJS + UMD bundles.
- **Full TypeScript** — including generated `.d.ts` declarations.

---

## Quick Start

### Built-in synth (works immediately)

```ts
import { Piano } from 'pianova';

const piano = new Piano({ root: '#piano' });

piano.on('noteOn', (n) => console.log(n.name));
piano.on('noteOff', (n) => console.log(n.name));
```

### With custom audio (SoundFont, Tone.js, etc.)

```ts
import { Piano } from 'pianova';

const piano = new Piano({
  root: '#piano',
  onPlayNote: (note) => mySoundfontPlayer.play(note.name),
  onStopNote: (note) => mySoundfontPlayer.stop(note.name),
});
```

### Programmatic control

```ts
piano.playNote('C4');      // string notation
piano.playNote(60);         // MIDI number
piano.stopNote('C4');
piano.transpose = 3;        // shift all notes up 3 semitones
piano.octaveShift = -1;     // shift all notes down 1 octave
piano.pitchBend(1.5);       // +1.5 semitones bend
piano.modulation(0.6);      // vibrato depth
piano.sustain = true;       // hold notes on release
piano.sustain = false;      // release all sustained notes
piano.detune = -15;         // fine-tune -15 cents
piano.setWaveform('triangle');
console.log(piano.lastNote); // last played NoteInfo
piano.destroy();            // full cleanup
```

---

## API Reference

### `Piano` class

```ts
import { Piano } from 'pianova';
```

#### Constructor

```ts
const piano = new Piano(options: PianoOptions);
```

| Option | Type | Default | Description |
|---|---|---|---|
| `root` | `HTMLElement \| string` | **required** | Container element or CSS selector |
| `range` | `NoteRange` | `{ first: 'C2', last: 'C6' }` | First and last notes (`'C4'` or MIDI `60`) |
| `waveform` | `'sine' \| 'triangle' \| 'square' \| 'sawtooth'` | `'sine'` | Oscillator shape (built-in synth only) |
| `keyboardShortcuts` | `boolean \| Record<string, number>` | `true` | Enable default QWERTY mapping, or pass custom `{ key: midi }` map |
| `onPlayNote` | `(note: NoteInfo) => void` | — | Custom audio playback callback |
| `onStopNote` | `(note: NoteInfo) => void` | — | Custom audio stop callback |
| `detune` | `number` | `0` | Initial fine-tune offset in cents |
| `transpose` | `number` | `0` | Initial transpose offset in semitones |
| `octaveShift` | `number` | `0` | Initial octave shift (each = 12 semitones) |

When `onPlayNote`/`onStopNote` are **omitted**, the built-in Web Audio synth is used automatically.

#### Methods

| Method | Signature | Description |
|---|---|---|---|
| `playNote` | `(note: string \| number) => void` | Play a note by name (`'C4'`) or MIDI number (`60`) |
| `stopNote` | `(note: string \| number) => void` | Release a note |
| `setWaveform` | `(type: WaveformType) => void` | Change oscillator shape (synth only) |
| `pitchBend` | `(semitones: number) => void` | Bend all active notes (±2 range) |
| `modulation` | `(depth: number) => void` | Set LFO vibrato depth (0–1) |
| `destroy` | `() => void` | Remove DOM, stop audio, disconnect events (idempotent) |

#### Properties

| Property | Type | Description |
|---|---|---|
| `sustain` | `boolean` (get/set) | When `true`, released notes are held until set back to `false` |
| `detune` | `number` (get/set) | Global fine-tune in cents |
| `transpose` | `number` (get/set) | Semitone shift applied to all notes |
| `octaveShift` | `number` (get/set) | Octave shift applied to all notes |
| `lastNote` | `NoteInfo \| null` (readonly) | Most recently played note (reflects transpose & octaveShift) |
| `options` | `PianoOptions` (readonly) | Raw options passed to constructor |

#### Events

```ts
piano.on('noteOn', (info: NoteInfo) => {});
piano.on('noteOff', (info: NoteInfo) => {});
```

| Event | Payload | Description |
|---|---|---|
| `noteOn` | `NoteInfo` | A note started playing (transposed) |
| `noteOff` | `NoteInfo` | A note stopped playing (transposed) |

**`NoteInfo` shape:**

```ts
{
  midi: number;        // 0–127 (adjusted for transpose + octaveShift)
  note: NoteName;      // 'C' | 'C#' | 'D' | … | 'B'
  octave: number;      // e.g. 4
  frequency: number;   // Hz (A4 = 440)
  name: string;        // e.g. 'C#4'
}
```

#### Static Utilities

```ts
import { parseNote, midiToNote, midiToFrequency, midiToNoteName } from 'pianova';
```

| Function | Signature | Description |
|---|---|---|
| `parseNote` | `(input: string \| number) => NoteInfo` | Parse `'C#4'` or `60` → full `NoteInfo` |
| `midiToNote` | `(midi: number) => NoteInfo` | MIDI number → `NoteInfo` |
| `midiToFrequency` | `(midi: number) => number` | MIDI number → frequency in Hz |
| `midiToNoteName` | `(midi: number) => string` | MIDI number → `'C#4'` |

---

## Theming via CSS Custom Properties

All visual styles are controlled through CSS custom properties on the `.pianova-keyboard` container. Override them anywhere in your stylesheet:

```css
.pianova-keyboard {
  --pianova-white-bg: #e8e8f0;
  --pianova-white-hover: #d0d8e8;
  --pianova-white-active: #7a9bcb;
  --pianova-black-bg: #0f3460;
  --pianova-black-hover: #1a4a7a;
  --pianova-black-active: #e94560;
  --pianova-key-border: #c8c8c8;
  --pianova-black-border: #333;
  --pianova-label-color: #999;
  --pianova-font: system-ui, sans-serif;
}
```

| Property | Default | Controls |
|---|---|---|
| `--pianova-white-bg` | `#ffffff` | White key rest color |
| `--pianova-white-hover` | `#f2f2f2` | White key hover |
| `--pianova-white-active` | `#b0d0f0` | White key pressed |
| `--pianova-black-bg` | `#1a1a1a` | Black key rest color |
| `--pianova-black-hover` | `#333` | Black key hover |
| `--pianova-black-active` | `#4a7ab5` | Black key pressed |
| `--pianova-key-border` | `#c8c8c8` | White key border |
| `--pianova-black-border` | `#333` | Black key border |
| `--pianova-label-color` | `#999` | Note label text |
| `--pianova-font` | `system-ui` | Label font family |

---

## Keyboard Shortcuts

### Default QWERTY mapping

Middle C (C4) is on the **Q** key. White keys are on the home row; black keys are the number row above.

```
                 C# D#    F# G# A#    C# D#    F# G# A#    C# D#
  Black (upper):  2  3      5  6  7      9  0      -  =

  White (home):  Q  W  E   R  T  Y  U   I  O  P   [  ]  \
                 C4 D4 E4  F4 G4 A4 B4  C5 D5 E5  F5 G5 A5

  White (lower): Z     X  C  V  B  N  M
                 C3    D3 E3 F3 G3 A3 B3

  Black (lower):  S  D        G  H  J
                  C#3 D#3     F#3 G#3 A#3
```

The mapping spans from C3 to A5, giving roughly 2.5 octaves under your fingers.

### Custom mapping

```ts
const piano = new Piano({
  root: '#piano',
  keyboardShortcuts: {
    a: 60,   // 'a' key → C4
    w: 61,   // 'w' key → C#4
    s: 62,   // 's' key → D4
    // …
  },
});
```

Disable keyboard entirely:

```ts
const piano = new Piano({ root: '#piano', keyboardShortcuts: false });
```

---

## Audio Architecture

### Built-in Synth

When no `onPlayNote`/`onStopNote` callbacks are provided, pianova creates a `SynthEngine` internally:

- **Oscillator** — sine, triangle, square, or sawtooth (configurable via `waveform`)
- **ADSR envelope** — attack 4 ms, decay 80 ms, sustain 50%, release 250 ms
- **Sustain pedal** — toggling `sustain` on holds released notes indefinitely; turning it off releases all held notes
- **Pitch bend** — instantaneous frequency shift on all active notes (±2 semitones)
- **LFO modulation** — 5.5 Hz sine wave routed to oscillator frequency for vibrato (0–100% depth)
- **Global detune** — cents offset applied to all notes

Notes are de-duplicated per MIDI number (holding the same key twice doesn't double the sound).

### Custom Audio (SoundFonts, Samplers, Tone.js)

Pass `onPlayNote`/`onStopNote` to integrate any audio library:

```ts
new Piano({
  root: '#piano',
  onPlayNote: (note) => {
    // Play a single note
    synth.triggerAttackRelease(note.name, '8n');
  },
  onStopNote: (note) => {
    // Optional per-note release
  },
});
```

When custom callbacks are provided, the built-in synth is **not** instantiated — zero overhead.

**Recommended SoundFont sources:**

| Library | Type | Link |
|---|---|---|
| `soundfont-player` | General MIDI (128 instruments) | [npm](https://www.npmjs.com/package/soundfont-player) |
| `tone.js` | Full synthesis + instrument library | [tonejs.github.io](https://tonejs.github.io/) |
| WebAudioFont | Pre-sampled SoundFont player | [github](https://github.com/surikov/webaudiofont) |

See `examples/soundfont.html` for a working demo with 35 selectable instruments.

---

## Examples

All examples are in the `examples/` directory and can be served locally:

```bash
npm run serve
```

| Example | Highlights |
|---|---|
| `basic.html` | Minimal setup with default C2–C6 range and built-in synth |
| `piano-ui.html` | **Stage piano UI** — pitch wheel, mod wheel, sustain pedal, digital display, transpose/octave/detune controls, note identifier |
| `custom-audio.html` | User-provided audio callback (triangle wave) |
| `fx.html` | Waveform selector + pitch bend, modulation, detune sliders |
| `themed.html` | Full CSS custom property theming |
| `soundfont.html` | 35 GM instruments via `soundfont-player` + FluidR3_GM |

---

## Development

```bash
# Build (ESM + CJS + UMD)
npm run build

# Development watch mode
npm run dev

# Test (single run)
npm test

# Test (watch)
npm run test:watch

# Test (browser UI)
npm run test:ui

# Serve examples
npm run serve

# Verify before publish (build + test)
npm run prepublishOnly
```

### Project Structure

```
pianova/
├── src/
│   ├── index.ts            # Public API — Piano class
│   ├── types.ts            # All TypeScript interfaces
│   ├── NoteMap.ts          # Note parsing, MIDI conversion, frequency
│   ├── Keyboard.ts         # DOM rendering of white/black keys
│   ├── SynthEngine.ts      # Web Audio oscillator + LFO + ADSR
│   ├── InputManager.ts     # Mouse / touch / QWERTY event handling
│   ├── EventEmitter.ts     # Typed pub/sub event system
│   └── css.ts              # Injected stylesheet
├── tests/
│   ├── setup.ts            # AudioContext mock for jsdom
│   ├── NoteMap.test.ts     # 25 tests — parsing, MIDI, frequency
│   ├── EventEmitter.test.ts
│   ├── Keyboard.test.ts
│   ├── SynthEngine.test.ts # Pitch bend, detune, modulation
│   ├── InputManager.test.ts
│   └── Piano.test.ts       # Integration — events, callbacks, transpose, octaveShift, lastNote
├── examples/               # Live HTML demos (see above)
├── dist/                   # Built output (gitignored)
│   ├── pianova.mjs          # ESM (16 KB)
│   ├── pianova.cjs          # CJS (16 KB)
│   ├── pianova.min.js       # UMD (9.7 KB minified)
│   └── types/              # .d.ts declarations
├── package.json
├── tsconfig.json
├── rollup.config.js
└── vitest.config.ts
```

### Build Output

| Format | File | Entry |
|---|---|---|---|
| ESM | `dist/pianova.mjs` | `import { Piano } from 'pianova'` |
| CJS | `dist/pianova.cjs` | `const { Piano } = require('pianova')` |
| UMD | `dist/pianova.min.js` | `<script src="…"> Pianova.Piano` |

### Test Suite (69 tests)

```
 ✓ tests/NoteMap.test.ts       (26 tests)
 ✓ tests/EventEmitter.test.ts  ( 5 tests)
 ✓ tests/Keyboard.test.ts      ( 5 tests)
 ✓ tests/SynthEngine.test.ts   ( 9 tests)
 ✓ tests/InputManager.test.ts  ( 5 tests)
 ✓ tests/Piano.test.ts         (19 tests)
```

---

## License

MIT
