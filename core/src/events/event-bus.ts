export interface PignalEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export type EventListener = (event: PignalEvent) => Promise<void>;

export class EventBus {
  private listeners = new Map<string, EventListener[]>();

  /** Register a listener for an event type. Supports wildcards: "*" listens to all. */
  on(eventType: string, listener: EventListener): void {
    const existing = this.listeners.get(eventType);
    if (existing) {
      existing.push(listener);
    } else {
      this.listeners.set(eventType, [listener]);
    }
  }

  /** Remove a listener. */
  off(eventType: string, listener: EventListener): void {
    const existing = this.listeners.get(eventType);
    if (!existing) return;

    const index = existing.indexOf(listener);
    if (index !== -1) {
      existing.splice(index, 1);
    }

    if (existing.length === 0) {
      this.listeners.delete(eventType);
    }
  }

  /** Emit an event. All matching listeners fire concurrently. Errors are caught and logged. */
  async emit(event: PignalEvent): Promise<void> {
    const targets: EventListener[] = [];

    const exact = this.listeners.get(event.type);
    if (exact) {
      targets.push(...exact);
    }

    const wildcard = this.listeners.get('*');
    if (wildcard) {
      targets.push(...wildcard);
    }

    if (targets.length === 0) return;

    const results = await Promise.allSettled(
      targets.map((listener) => listener(event)),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        // eslint-disable-next-line no-console
        console.error(
          `EventBus listener error for "${event.type}":`,
          result.reason,
        );
      }
    }
  }
}

/** Create a PignalEvent with the current timestamp. */
export function createEvent(
  type: string,
  payload: Record<string, unknown>,
): PignalEvent {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}
