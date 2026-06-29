class MockAudioParam {
  _value = 0;
  private _cbs: Array<(v: number) => void> = [];

  get value() { return this._value; }
  set value(v: number) {
    this._value = v;
    this._cbs.forEach((fn) => fn(v));
  }

  setValueAtTime(v: number) { this._value = v; }
  linearRampToValueAtTime() {}
  exponentialRampToValueAtTime() {}
  cancelScheduledValues() {}
}

class MockOscillatorNode {
  type = 'sine';
  frequency = new MockAudioParam();
  private _connected: any[] = [];
  private _started = false;

  connect(dest: any) {
    this._connected.push(dest);
    return dest;
  }
  disconnect(dest?: any) {
    if (dest) {
      const idx = this._connected.indexOf(dest);
      if (idx !== -1) this._connected.splice(idx, 1);
    } else {
      this._connected = [];
    }
  }
  start() { this._started = true; }
  stop() { this._started = false; }
}

class MockGainNode {
  gain = new MockAudioParam();
  private _connected: any[] = [];

  connect(dest: any) {
    this._connected.push(dest);
    return dest;
  }
  disconnect(dest?: any) {
    if (dest) {
      const idx = this._connected.indexOf(dest);
      if (idx !== -1) this._connected.splice(idx, 1);
    } else {
      this._connected = [];
    }
  }
}

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};

  resume() {}
  close() {}

  createOscillator() { return new MockOscillatorNode(); }
  createGain() { return new MockGainNode(); }
}

// @ts-ignore
globalThis.AudioContext = MockAudioContext;
