import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../src/EventEmitter';

interface TestEvents {
  foo: string;
  bar: number;
}

describe('EventEmitter', () => {
  it('calls listener on emit', () => {
    const ee = new EventEmitter<TestEvents>();
    const fn = vi.fn();
    ee.on('foo', fn);
    ee.emit('foo', 'hello');
    expect(fn).toHaveBeenCalledWith('hello');
  });

  it('supports off()', () => {
    const ee = new EventEmitter<TestEvents>();
    const fn = vi.fn();
    ee.on('foo', fn);
    ee.off('foo', fn);
    ee.emit('foo', 'x');
    expect(fn).not.toHaveBeenCalled();
  });

  it('supports multiple listeners', () => {
    const ee = new EventEmitter<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    ee.on('foo', a);
    ee.on('foo', b);
    ee.emit('foo', 'x');
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('removeAllListeners clears all', () => {
    const ee = new EventEmitter<TestEvents>();
    const fn = vi.fn();
    ee.on('foo', fn);
    ee.on('bar', fn);
    ee.removeAllListeners();
    ee.emit('foo', 'x');
    ee.emit('bar', 1);
    expect(fn).not.toHaveBeenCalled();
  });

  it('chaining: on returns this', () => {
    const ee = new EventEmitter<TestEvents>();
    expect(ee.on('foo', () => {})).toBe(ee);
    expect(ee.off('foo', () => {})).toBe(ee);
  });
});
