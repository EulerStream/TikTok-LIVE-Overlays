type EventHandler = (data: unknown) => void;

/**
 * Simple internal event emitter for self-contained overlays.
 * Does not depend on external WebcastEventEmitter.
 */
export class InternalEventEmitter {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(eventName: string, handler: EventHandler): void {
    if (!this.handlers.has(eventName)) {
      this.handlers.set(eventName, new Set());
    }
    this.handlers.get(eventName)!.add(handler);
  }

  off(eventName: string, handler: EventHandler): void {
    this.handlers.get(eventName)?.delete(handler);
  }

  emit(eventName: string, data: unknown): void {
    this.handlers.get(eventName)?.forEach((handler) => handler(data));
  }
}
