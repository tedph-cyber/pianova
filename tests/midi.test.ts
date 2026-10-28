import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { connectMidi, midiSupported, MidiError } from '../src/midi';

interface FakeInput { name: string; state: string; onmidimessage: ((e: any) => void) | null }

function fakeAccess(names: string[]) {
  const inputs = new Map<string, FakeInput>();
  names.forEach((name, i) => inputs.set(String(i), { name, state: 'connected', onmidimessage: null }));
  return { inputs, onstatechange: null as null | (() => void) };
}
const send = (input: FakeInput, ...data: number[]) => input.onmidimessage!({ data: new Uint8Array(data), timeStamp: 12.5 });

describe('Web MIDI', () => {
  const nav = navigator as any;
  let access: ReturnType<typeof fakeAccess>;

  beforeEach(() => {
    access = fakeAccess(['Keys A']);
    nav.requestMIDIAccess = vi.fn(async () => access);
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  });
  afterEach(() => { delete nav.requestMIDIAccess; });

  const opts = () => ({ onNoteOn: vi.fn(), onNoteOff: vi.fn(), onDevices: vi.fn() });

  it('midiSupported reflects the API and secure context', () => {
    expect(midiSupported()).toBe(true);
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    expect(midiSupported()).toBe(false);
    delete nav.requestMIDIAccess;
    expect(midiSupported()).toBe(false);
  });

  it('rejects with a MidiError when unsupported (no exception at import or call time)', async () => {
    delete nav.requestMIDIAccess;
    const err = await connectMidi(opts()).catch((e) => e);
    expect(err).toBeInstanceOf(MidiError);
    expect(err.code).toBe('unsupported');
    expect(err.message).toMatch(/iPhone/);
  });

  it('rejects with insecure-context over plain http', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    const err = await connectMidi(opts()).catch((e) => e);
    expect(err.code).toBe('insecure-context');
    expect(nav.requestMIDIAccess).not.toHaveBeenCalled();
  });

  it('maps a refused permission to denied, other failures to failed', async () => {
    nav.requestMIDIAccess = vi.fn(async () => { throw Object.assign(new Error('x'), { name: 'SecurityError' }); });
    expect((await connectMidi(opts()).catch((e) => e)).code).toBe('denied');
    nav.requestMIDIAccess = vi.fn(async () => { throw new Error('boom'); });
    const err = await connectMidi(opts()).catch((e) => e);
    expect(err.code).toBe('failed');
    expect(err.cause).toBeInstanceOf(Error);
  });

  it('reports devices on connect', async () => {
    const o = opts();
    const conn = await connectMidi(o);
    expect(o.onDevices).toHaveBeenCalledWith(['Keys A']);
    expect(conn.devices()).toEqual(['Keys A']);
  });

  it('note-on with velocity scaled to 0–1 and the event time', async () => {
    const o = opts();
    await connectMidi(o);
    send(access.inputs.get('0')!, 0x90, 60, 127);
    send(access.inputs.get('0')!, 0x93, 62, 64); // any channel
    expect(o.onNoteOn).toHaveBeenNthCalledWith(1, 60, 1, 12.5);
    expect(o.onNoteOn.mock.calls[1][0]).toBe(62);
    expect(o.onNoteOn.mock.calls[1][1]).toBeCloseTo(64 / 127);
  });

  it('note-off, and note-on with velocity 0 as note-off', async () => {
    const o = opts();
    await connectMidi(o);
    const input = access.inputs.get('0')!;
    send(input, 0x80, 60, 64);
    send(input, 0x90, 62, 0);
    expect(o.onNoteOff.mock.calls).toEqual([[60], [62]]);
    expect(o.onNoteOn).not.toHaveBeenCalled();
  });

  it('ignores other messages and malformed data', async () => {
    const o = opts();
    await connectMidi(o);
    const input = access.inputs.get('0')!;
    send(input, 0xb0, 64, 127); // control change
    send(input, 0xfe); // active sensing
    input.onmidimessage!({ data: null });
    expect(o.onNoteOn).not.toHaveBeenCalled();
    expect(o.onNoteOff).not.toHaveBeenCalled();
  });

  it('hot-plug: a new input is bound and onDevices is called again', async () => {
    const o = opts();
    await connectMidi(o);
    access.inputs.set('1', { name: 'Keys B', state: 'connected', onmidimessage: null });
    access.onstatechange!();
    expect(o.onDevices).toHaveBeenLastCalledWith(['Keys A', 'Keys B']);
    send(access.inputs.get('1')!, 0x90, 70, 100);
    expect(o.onNoteOn).toHaveBeenCalled();
    access.inputs.get('1')!.state = 'disconnected';
    access.onstatechange!();
    expect(o.onDevices).toHaveBeenLastCalledWith(['Keys A']);
  });

  it('close detaches everything and is idempotent', async () => {
    const o = opts();
    const conn = await connectMidi(o);
    conn.close();
    conn.close();
    expect(access.inputs.get('0')!.onmidimessage).toBeNull();
    expect(access.onstatechange).toBeNull();
  });
});
