import { logger } from '@/lib/logger';

import { type DomainEventMap } from './events';

/**
 * Typed in-process Event Bus (publish/subscribe).
 * Enables decoupled communication between services.
 */
type EventHandler<T> = (payload: T) => Promise<void> | void;

class EventBus {
  private handlers = new Map<string, EventHandler<unknown>[]>();

  /** 
   * Type-safe subscribe to an event.
   * Internal listeners are wrapped to isolate errors.
   */
  onEvent<K extends keyof DomainEventMap>(
    event: K, 
    handler: (payload: DomainEventMap[K]) => Promise<void> | void
  ): void {
    if (!this.handlers.has(event as string)) this.handlers.set(event as string, []);
    
    const safeHandler = async (payload: unknown) => {
      try {
        await Promise.resolve(handler(payload as DomainEventMap[K]));
      } catch (err) {
        logger.error({ err, event, payload }, `[EventBus] Handler failed for ${String(event)}`);
      }
    };
    
    this.handlers.get(event as string)!.push(safeHandler as EventHandler<unknown>);
  }

  /** Alias for backward compatibility */
  on<T>(event: string, handler: EventHandler<T>): void {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler as EventHandler<unknown>);
  }

  /** Emit an event — all handlers run concurrently, errors are isolated */
  async emit<T>(event: string, payload: T): Promise<void> {
    const eventHandlers = this.handlers.get(event) ?? [];
    if (eventHandlers.length > 0) {
      logger.debug({ event, payload }, `[EventBus] Emitting ${String(event)}`);
      await Promise.allSettled(eventHandlers.map(h => Promise.resolve(h(payload as unknown))));
    }
  }

  /** Type-safe emit */
  async emitEvent<K extends keyof DomainEventMap>(
    event: K, 
    payload: DomainEventMap[K]
  ): Promise<void> {
    return this.emit(event as string, payload);
  }

  /** Remove all handlers (use in tests) */
  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
