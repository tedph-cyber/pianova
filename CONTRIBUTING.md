# Contributing

Thanks for considering contributing to pianova!

## Getting Started

```bash
git clone https://github.com/tedph-cyber/pianova.git
cd pianova
npm install
```

## Development

```bash
# Build (ESM + CJS + UMD)
npm run build

# Watch mode
npm run dev

# Test (single run)
npm test

# Test (watch)
npm run test:watch

# Serve examples locally
npm run serve
```

## Guidelines

- **Code style** — matches existing conventions (see any source file)
- **No comments in source** — code should be self-documenting
- **Tests required** — add/update tests for any logic changes
- **Pre-commit** — ensure `npm run build && npm test` passes

## Project Structure

```
src/
  index.ts          # Public API — Piano class
  SynthEngine.ts    # Web Audio synth
  InputManager.ts   # Mouse/touch/keyboard input
  Keyboard.ts       # DOM rendering
  NoteMap.ts        # MIDI/frequency utilities
  EventEmitter.ts   # Typed pub/sub
  css.ts            # Injected stylesheet
  types.ts          # TypeScript interfaces
tests/              # Vitest test suite (jsdom)
examples/           # Live HTML demos
```

## Pull Requests

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/my-thing`)
3. Commit your changes
4. Push and open a PR via GitHub
