# Changelog

## 0.2.0

### Added
- **`pianova/theory`** (new subpath export, no DOM, no audio, usable in Node): `identifyChord`, `chordLabel`, `noteLabel` (letters, movable-do sol-fa, numbers), `scale`, `degree`, `spellScale`, `keySignature`, `diatonicChords`, `findKey` (Krumhansl–Schmuckler), plus `QUALITIES`, `INTERVALS`, `SCALE_INTERVALS`, `mod12`, `pitchClasses` and types. Ported from the Masteric core-loop spike. The `feel` copy in `chordLabel` is overridable via the `feel` option.
- **Web MIDI**: `connectMidi()`, `midiSupported()`, `midiUnavailableReason()`, `MidiError`, and `piano.connectMidi()`, which routes MIDI into the same note path as touch. It always works (no option to set), must be called from a user action, and rejects with a `MidiError` instead of throwing at import time. MIDI velocity (0–1) reaches `noteOn` events, `onPlayNote` (`NoteInfo.velocity`) and the built-in synth's level.
- **Octave shifting** for `fit` keyboards, since touch can no longer pan: `viewButtons: true` renders ◀ 8va / 8va ▶ buttons; `piano.shiftView(octaves)` and `piano.setViewStart(note)` do it from code.
- **Keyboard options**: `labels`, `piano.setLabels()`, `piano.setActive()` (external highlight, `.pianova-lit`), `fit: { start, minWhiteKeyPx }`, `piano.visibleRange` and the `rangeChange` event.
- `glide` option.
- Examples: `theory.html`, `solfa-labels.html`, `midi.html`. `piano-ui.html` is rebuilt as a full-screen, landscape-first page (its wheels used mouse events only, and its keyboard was shrunk with a CSS transform, which left tiny keys on phones). All four share `examples/spike.css`.

### Changed
- **Input now uses Pointer Events on the keyboard element only**, replacing `mousedown`/`mouseup` and the document-level `touchstart`/`touchend`. Multi-touch by `pointerId`, pointer capture, glide across keys, release on `pointerup` / `pointercancel` / `lostpointercapture`, and release-all when the page becomes hidden. Touches outside the keyboard are no longer intercepted.
- The keyboard sets `touch-action: none` and `user-select: none`, and suppresses the context menu. A keyboard wider than its container can therefore no longer be panned by touch drag; use `fit` with `viewButtons`.
- Key heights come from CSS variables `--pianova-height` (default `200px`) and `--pianova-black-height` (default `62%`) instead of inline pixel heights, so a keyboard can fill its container. Defaults look the same as before.
- Pressed keys now sink and show an inner shadow, not only a colour change.
- `InputManager` accepts optional `container` and `glide` config, and has `setKeys()` and `setGlide()`. `createKeyboard` takes an optional options argument and returns `relabel`, `setActive`, `range` and `destroy` alongside `container` and `keys`.
- `npm start` / `npm run serve` now serve the repo root (open `/examples/`); the examples import `../dist/`, which was a 404 when only `examples/` was served.

### Compatibility
No breaking changes to the root API. `Piano`, `parseNote` and the other existing exports are unchanged.
