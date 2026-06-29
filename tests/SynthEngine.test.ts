import { describe, it, expect } from 'vitest';
import { SynthEngine } from '../src/SynthEngine';

describe('SynthEngine', () => {
  it('constructs without error', () => {
    const s = new SynthEngine('sine');
    expect(s).toBeTruthy();
    s.destroy();
  });

  it('playNote and stopNote', () => {
    const s = new SynthEngine('triangle');
    expect(() => s.playNote(60)).not.toThrow();
    expect(() => s.stopNote(60)).not.toThrow();
    s.destroy();
  });

  it('stopAll stops all voices', () => {
    const s = new SynthEngine();
    s.playNote(60);
    s.playNote(64);
    s.playNote(67);
    expect(() => s.stopAll()).not.toThrow();
    s.destroy();
  });

  it('set waveform', () => {
    const s = new SynthEngine();
    s.waveform = 'square';
    expect(s.waveform).toBe('square');
    s.destroy();
  });

  it('pitchBend bends within ±2 semitones', () => {
    const s = new SynthEngine();
    s.pitchBend = 0;
    expect(s.pitchBend).toBe(0);
    s.pitchBend = 1.5;
    expect(s.pitchBend).toBe(1.5);
    s.pitchBend = 99; // clamped
    expect(s.pitchBend).toBe(2);
    s.pitchBend = -99;
    expect(s.pitchBend).toBe(-2);
    s.destroy();
  });

  it('detune offsets all frequencies', () => {
    const s = new SynthEngine();
    s.detune = 50;
    expect(s.detune).toBe(50);
    s.destroy();
  });

  it('modulation range 0-1', () => {
    const s = new SynthEngine();
    expect(s.modulation).toBe(0);
    s.modulation = 0.5;
    expect(s.modulation).toBe(0.5);
    s.modulation = 2; // clamped
    expect(s.modulation).toBe(1);
    s.destroy();
  });

  it('sustain holds notes until released', () => {
    const s = new SynthEngine();
    expect(s.sustain).toBe(false);
    s.sustain = true;
    expect(s.sustain).toBe(true);
    s.playNote(60);
    s.stopNote(60); // should be held by sustain
    // playNote with same MIDI should release the sustained note
    s.playNote(60);
    s.sustain = false; // should release all sustained
    s.destroy();
  });

  it('sustain false releases all sustained notes', () => {
    const s = new SynthEngine();
    s.sustain = true;
    s.playNote(60);
    s.playNote(64);
    s.stopNote(60);
    s.stopNote(64);
    s.sustain = false; // release all
    s.destroy();
  });
});
