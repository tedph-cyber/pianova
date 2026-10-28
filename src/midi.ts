export type MidiErrorCode =
  | 'unsupported'      // no navigator.requestMIDIAccess (e.g. every iPhone/iPad browser)
  | 'insecure-context' // Web MIDI needs https or localhost
  | 'denied'           // the user (or a permissions policy) refused access
  | 'failed';          // anything else the browser threw

/** Rejection value of `connectMidi`. Check `code` to pick a message. */
export class MidiError extends Error {
  readonly code: MidiErrorCode;

  constructor(code: MidiErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'MidiError';
    this.code = code;
    if (options && 'cause' in options) (this as { cause?: unknown }).cause = options.cause;
  }
}

export interface MidiOptions {
  /** `velocity` is 0–1; `time` is the event's DOMHighResTimeStamp (ms, same clock as `performance.now()`). */
  onNoteOn: (midi: number, velocity: number, time: number) => void;
  onNoteOff: (midi: number) => void;
  /** Called with the names of the connected inputs now, and again on every plug or unplug. */
  onDevices?: (names: string[]) => void;
}

export interface MidiConnection {
  readonly access: MIDIAccess;
  /** Names of the currently connected inputs. */
  devices(): string[];
  /** Stop listening and detach from every input. */
  close(): void;
}

/** Why MIDI is unavailable here, or `null` if it looks usable. Never throws. */
export function midiUnavailableReason(): MidiError | null {
  if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
    return new MidiError('unsupported', 'pianova: Web MIDI is not available in this browser (iPhone and iPad browsers do not support it).');
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return new MidiError('insecure-context', 'pianova: Web MIDI needs a secure context (https:// or http://localhost).');
  }
  return null;
}

export const midiSupported = (): boolean => midiUnavailableReason() === null;

/**
 * Listen to MIDI keyboards. Call it from a user action (a button click): Chrome
 * shows a permission prompt. Needs a secure context and does not exist in iPhone
 * or iPad browsers; the returned promise rejects with a `MidiError` instead of
 * throwing at import time. Handles hot-plugging; note-on with velocity 0 is a
 * note-off.
 */
export async function connectMidi(options: MidiOptions): Promise<MidiConnection> {
  const unavailable = midiUnavailableReason();
  if (unavailable) throw unavailable;

  let access: MIDIAccess;
  try {
    access = await navigator.requestMIDIAccess();
  } catch (err) {
    const denied = err instanceof Error && (err.name === 'SecurityError' || err.name === 'NotAllowedError');
    throw new MidiError(
      denied ? 'denied' : 'failed',
      denied ? 'pianova: MIDI access was denied.' : 'pianova: could not open MIDI access.',
      { cause: err },
    );
  }

  const handle = (e: MIDIMessageEvent) => {
    const data = e.data;
    if (!data || data.length < 2) return;
    const cmd = data[0] & 0xf0;
    const note = data[1];
    const velocity = data[2] ?? 0;
    if (cmd === 0x90 && velocity > 0) options.onNoteOn(note, velocity / 127, e.timeStamp);
    else if (cmd === 0x80 || cmd === 0x90) options.onNoteOff(note);
  };

  let closed = false;
  let names: string[] = [];
  const bind = () => {
    if (closed) return;
    names = [];
    access.inputs.forEach((input) => {
      input.onmidimessage = handle;
      if (input.state !== 'disconnected') names.push(input.name ?? 'MIDI input');
    });
    options.onDevices?.([...names]);
  };
  access.onstatechange = bind;
  bind();

  return {
    access,
    devices: () => [...names],
    close() {
      if (closed) return;
      closed = true;
      access.onstatechange = null;
      access.inputs.forEach((input) => { input.onmidimessage = null; });
    },
  };
}
