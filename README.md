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
- **Pointer input** — mouse, pen and multi-touch chords through Pointer Events, with finger **glide** across keys. QWERTY too.
- **Web MIDI** — plug in a keyboard; MIDI goes down the same path as touch.
- **Music theory** (`pianova/theory`) — chord naming, scales, key signatures, movable-do sol-fa, key finding. No DOM, no audio: works in Node.
- **Key labels, external highlights, and a fit-to-width keyboard.**
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
| `fit` | `{ start, minWhiteKeyPx }` | — | Show as many white keys as fit the container, from `start`. Replaces `range` |
| `labels` | `(midi: number) => string` | note names on white keys | Text on each key. Return `''` for none |
| `glide` | `boolean` | `true` | Sliding a pointer across keys moves the note |
| `viewButtons` | `boolean` | `false` | Fit mode: render ◀ 8va / 8va ▶ buttons that shift the keyboard an octave |

When `onPlayNote`/`onStopNote` are **omitted**, the built-in Web Audio synth is used automatically.

#### Methods

| Method | Signature | Description |
|---|---|---|---|
| `playNote` | `(note: string \| number) => void` | Play a note by name (`'C4'`) or MIDI number (`60`) |
| `stopNote` | `(note: string \| number) => void` | Release a note |
| `setWaveform` | `(type: WaveformType) => void` | Change oscillator shape (synth only) |
| `pitchBend` | `(semitones: number) => void` | Bend all active notes (±2 range) |
| `modulation` | `(depth: number) => void` | Set LFO vibrato depth (0–1) |
| `setActive` | `(midis: Iterable<number>) => void` | Highlight keys from outside (MIDI input, lesson targets), independent of what is pressed |
| `setLabels` | `(fn: ((midi) => string) \| null) => void` | Replace the key labels; `null` restores note names |
| `connectMidi` | `(opts?: { onDevices }) => Promise<MidiConnection>` | Route Web MIDI into the piano, velocity included. User action only. See [Web MIDI](#web-midi) |
| `setViewStart` | `(note: string \| number) => void` | Fit mode: move the lowest key |
| `shiftView` | `(octaves: number) => void` | Fit mode: shift the visible keys by whole octaves |
| `destroy` | `() => void` | Remove DOM, stop audio, disconnect events (idempotent) |

#### Properties

| Property | Type | Description |
|---|---|---|
| `sustain` | `boolean` (get/set) | When `true`, released notes are held until set back to `false` |
| `detune` | `number` (get/set) | Global fine-tune in cents |
| `transpose` | `number` (get/set) | Semitone shift applied to all notes |
| `octaveShift` | `number` (get/set) | Octave shift applied to all notes |
| `lastNote` | `NoteInfo \| null` (readonly) | Most recently played note (reflects transpose & octaveShift) |
| `visibleRange` | `{ low, high }` (readonly) | Lowest and highest keys shown (MIDI numbers) |
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
| `rangeChange` | `{ low, high }` | Fit mode: the container was resized and the visible keys changed |

**`NoteInfo` shape:**

```ts
{
  midi: number;        // 0–127 (adjusted for transpose + octaveShift)
  velocity?: number;   // 0–1, only on noteOn for notes that arrived over MIDI
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
| `--pianova-height` | `200px` | Keyboard height. Set to `auto` inside a flex column to fill the screen |
| `--pianova-black-height` | `62%` | Black key height, relative to the keyboard |

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

## Touch and pointer input

Input uses [Pointer Events](https://developer.mozilla.org/docs/Web/API/Pointer_events) on the keyboard element only. Nothing is attached to `document` for touch, so the page scrolls normally outside the keyboard.

- `pointerdown` plays immediately. Each finger is tracked by `pointerId`, so chords work, and the pointer is captured so lifting outside the keyboard still releases.
- **Glide:** sliding a finger (or a pressed mouse) across keys releases the old key and presses the new one. Turn it off with `glide: false`. Moving off the keys keeps the last note until you lift.
- Notes release on `pointerup`, `pointercancel` and `lostpointercapture`, and everything releases when the page becomes hidden (`visibilitychange`), so a note never sticks.
- The keyboard sets `touch-action: none` and `user-select: none`, and suppresses the long-press context menu (Android).
- The QWERTY shortcuts are unchanged.

> **Wide keyboards on touch screens.** `touch-action: none` means a keyboard wider than its container can no longer be panned by dragging (the scrollbar and wheel still work). On phones, use `fit`, and `viewButtons: true` (or `piano.shiftView(±1)` from your own buttons) to move between octaves.

```ts
// Show as many white keys as fit, at least 56 CSS px wide, starting at C4.
const piano = new Piano({
  root: '#piano',
  fit: { start: 'C4', minWhiteKeyPx: 56 },
});
piano.visibleRange;                       // { low: 60, high: 76 }
piano.on('rangeChange', ({ low, high }) => {});
piano.shiftView(1);                       // up an octave; or pass viewButtons: true for built-in ◀ ▶ buttons
piano.setViewStart('C3');
```

### Labels and external highlights

```ts
import { noteLabel } from 'pianova/theory';

const piano = new Piano({
  root: '#piano',
  labels: (midi) => noteLabel(midi, { notation: 'solfege', key: 7 }), // do = G
});

piano.setLabels((midi) => noteLabel(midi, { notation: 'solfege', key: 0 })); // move do
piano.setActive([60, 64, 67]); // highlight C E G, without sounding or pressing them
piano.setActive([]);           // clear
```

`labels` and `setActive` take the **physical key's** MIDI number, before `transpose` / `octaveShift`.

A pressed key sinks and shows an inner shadow (`.pianova-active`); a highlighted key gets an outline and a dot (`.pianova-lit`). Neither relies on colour alone. Extra theme variables: `--pianova-white-lit`, `--pianova-black-lit`, `--pianova-lit-outline`, `--pianova-lit-dot`, `--pianova-lit-dot-black`, `--pianova-black-label-color`.

---

## Web MIDI

```ts
import { Piano } from 'pianova';

const piano = new Piano({ root: '#piano' });

button.onclick = async () => {            // must be a user action: Chrome prompts for permission
  try {
    await piano.connectMidi({ onDevices: (names) => console.log(names) });
  } catch (err) {
    console.log(err.code, err.message);   // MidiError
  }
};
```

MIDI notes go through the same path as touch: key highlighting, `transpose`, `noteOn`/`noteOff` events, and audio. `noteOn` events and `onPlayNote` carry `velocity` (0–1) for MIDI notes (touch and QWERTY leave it `undefined`), and the built-in synth plays softer notes quieter.

For timestamps, or MIDI without a `Piano`:

```ts
import { connectMidi, midiSupported } from 'pianova';

const conn = await connectMidi({
  onNoteOn: (midi, velocity /* 0–1 */, time /* ms, performance.now() clock */) => {},
  onNoteOff: (midi) => {},
  onDevices: (names) => {},               // now, and on every plug/unplug
});
conn.devices();
conn.close();
```

- Handles hot-plugging. Note-on with velocity 0 counts as note-off.
- **Needs a secure context** (https or `http://localhost`; a LAN IP over plain http does not count).
- **Does not exist in any iPhone or iPad browser.**
- Nothing throws at import time. `connectMidi` rejects with a `MidiError` whose `code` is `'unsupported'`, `'insecure-context'`, `'denied'` or `'failed'`. `midiSupported()` and `midiUnavailableReason()` let you check first without prompting.

---

## Theory: `pianova/theory`

Pure functions, no DOM and no audio. Import from the subpath so the keyboard is not pulled in:

```ts
import { identifyChord, chordLabel, noteLabel, scale, spellScale } from 'pianova/theory';
```

Pitch classes (0–11, C = 0) are the currency; spelling happens only in label functions. The root `pianova` export does not include theory.

### Naming what is held

`identifyChord(midiNotes)` takes **MIDI numbers** (so the bass is known) and returns matches, best first:

```ts
identifyChord([64, 67, 72]);
// [{ kind: 'chord', root: 0, quality: 'major', bass: 4, inversion: 1, score: 16 }]
identifyChord([60, 64]);
// [{ kind: 'interval', bass: 0, top: 4, semitones: 4, score: 0 }]
```

Root in the bass wins; ties go to the more common quality. Two pitch classes are an interval, except a fifth up from the bass, which is a power chord. An unnamed cluster returns `[]`.

```ts
const [m] = identifyChord([64, 67, 72]);
chordLabel(m);                           // { short: 'C/E', long: 'C major, E in the bass', feel: 'bright and happy', detail: 'major' }
chordLabel(m, { notation: 'solfege', key: 7 });
chordLabel(m, { feel: { quality: { major: 'sunshine' }, interval: { 4: 'a bright pair' } } }); // your own copy
```

The `feel` strings are product copy, not theory: override any of them with the `feel` option.

### Labels

```ts
noteLabel(10);                                           // 'A♯'
noteLabel(10, { accidentals: 'flat' });                  // 'B♭'
noteLabel(7, { notation: 'solfege', key: 7 });           // 'do'   (movable do)
noteLabel(10, { notation: 'solfege', accidentals: 'flat' }); // 'ta'
noteLabel(11, { notation: 'number', key: 7 });           // '3'
```

Syllables: do di re ri mi fa fi so si la li **ti**; lowered ra me se le **ta**. Numbers are 1–7 with ♯/♭.

### Scales, keys and chords

| Function | Returns |
|---|---|
| `scale(tonicPc, type)` | Pitch classes: 7 for heptatonic, 5 pentatonic, 6 blues. No octave. Types: `major`, `naturalMinor`, `harmonicMinor`, `melodicMinor` (ascending), `ionian` … `locrian`, `majorPentatonic`, `minorPentatonic`, `blues` |
| `degree(pc, keyPc)` | 0–11 semitones above do |
| `spellScale(tonicPc, type, { prefer? })` | Names with one letter per degree: `spellScale(5, 'major')` → `F G A B♭ C D E`. Picks the conventional key (D♭ major, F♯ major, E♭ minor, G♯ minor); `prefer: 'sharp' \| 'flat'` overrides for black-key tonics. The blues ♭5 and 5 share a letter |
| `keySignature(tonicPc, 'major' \| 'minor')` | `{ accidentals: 'sharp' \| 'flat' \| 'none', count, notes }` |
| `diatonicChords(keyPc, mode, { sevenths? })` | Per degree: `{ degree, root, quality, notes, roman, number }`, e.g. `vii°` / `7°` |
| `findKey(midiNotes, { durations? })` | 24 candidates `{ tonic, mode, score }`, best first (Krumhansl–Schmuckler). Weights by duration if given |

`findKey` correlates a pitch-class histogram with key profiles. A key and its relative (C major / A minor) often score close, so check the top two on short input.

---

## Examples

All examples are in the `examples/` directory and can be served locally:

```bash
npm start   # serves the repo root; open http://localhost:3000/examples/
```

To try touch on a phone, open `http://<your-LAN-IP>:3000/examples/`. Web MIDI needs https or localhost, so `midi.html` will say so over a LAN address.

| Example | Highlights |
|---|---|
| `basic.html` | Minimal setup with default C2–C6 range and built-in synth |
| `piano-ui.html` | **Stage piano UI**, full-screen and touch-friendly: pitch and mod wheels beside a keyboard that fits the window, wave and sustain in the bar, transpose/octave/detune in a Tune panel |
| `custom-audio.html` | User-provided audio callback (triangle wave) |
| `fx.html` | Waveform selector + pitch bend, modulation, detune sliders |
| `themed.html` | Full CSS custom property theming |
| `soundfont.html` | 35 GM instruments via `soundfont-player` + FluidR3_GM |
| `theory.html` | Full-screen, landscape-first: live chord naming, key finder, and a Scales & keys panel (spelling, key signatures, diatonic chords) |
| `solfa-labels.html` | Movable-do labels on a keyboard that fills the screen; highlights the do keys |
| `midi.html` | Connect a MIDI keyboard; shows note name and velocity |

The three 0.2 examples share `spike.css` / `spike-ui.js`, a full-screen layout that sizes the keyboard to the window via `--pianova-height: auto`.

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
│   ├── InputManager.ts     # Pointer Events / QWERTY handling
│   ├── midi.ts             # Web MIDI helper
│   ├── theory/             # pianova/theory entry (no DOM, no audio)
│   ├── EventEmitter.ts     # Typed pub/sub event system
│   └── css.ts              # Injected stylesheet
├── tests/
│   ├── setup.ts            # AudioContext mock for jsdom
│   ├── NoteMap.test.ts     # 25 tests — parsing, MIDI, frequency
│   ├── EventEmitter.test.ts
│   ├── Keyboard.test.ts
│   ├── SynthEngine.test.ts # Pitch bend, detune, modulation
│   ├── InputManager.test.ts
│   ├── InputPointer.test.ts # Pointer events: multi-touch, glide, no stuck notes
│   ├── KeyboardOptions.test.ts # labels, setActive, fit
│   ├── midi.test.ts
│   ├── theory.test.ts / theory-scales.test.ts
│   └── Piano.test.ts       # Integration — events, callbacks, transpose, octaveShift, lastNote
├── examples/               # Live HTML demos (see above)
├── dist/                   # Built output (gitignored)
│   ├── pianova.mjs / .cjs / .min.js
│   ├── theory.mjs / .cjs
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
| ESM / CJS | `dist/theory.mjs` / `dist/theory.cjs` | `import { identifyChord } from 'pianova/theory'` |

### Test Suite

```bash
npm test
```

---

## License

MIT
