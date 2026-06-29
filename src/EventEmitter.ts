type Listener = (...args: any[]) => void;

export class EventEmitter<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, Set<Listener>>();

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
    return this;
  }

  off<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): this {
    this.listeners.get(event)?.delete(listener as Listener);
    return this;
  }

  protected emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }
}
