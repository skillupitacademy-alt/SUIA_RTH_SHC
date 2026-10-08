/**
 * Core Application Event Bus (Pub/Sub)
 * Decouples core logic from asynchronous side-effects 
 * (like sending emails, updating analytics, or triggering background jobs).
 */

import { EventEmitter } from 'events';

import { logger } from '@/lib/logger';

import type { DomainEventMap } from './events';

class EventBus extends EventEmitter {
    public log = logger;
    constructor() {
        super();
        this.setMaxListeners(20); // Scale up for many decoupled listeners
    }

    // Override base emit to add logging used by tests
    emit(eventName: string | symbol, ...args: unknown[]): boolean {
        const examId = (args?.[0] as Record<string, unknown>)?.examId;
        this.log.info({ event: eventName, examId }, 'Emitting event');
        try {
            return super.emit(eventName, ...args);
        } catch (err) {
            this.log.error({ err, eventName, payload: args?.[0] }, '[EventBus] emit failed');
            return false;
        }
    }

    /**
     * Type-safe emit method.
     */
    public emitEvent<K extends keyof DomainEventMap>(
        eventName: K, 
        payload: DomainEventMap[K]
    ): boolean {
        this.log.info({ event: eventName, examId: (payload as Record<string, unknown>)?.examId }, 'Emitting event');
        // We still call the base EventEmitter emit under the hood
        try {
          return super.emit(eventName as string, payload);
        } catch (err) {
          this.log.error({ err, eventName, payload }, '[EventBus] emit failed');
          return false;
        }
    }

    /**
     * Type-safe on method.
     */
    public onEvent<K extends keyof DomainEventMap>(
        eventName: K, 
        listener: (payload: DomainEventMap[K]) => void | Promise<void>
    ): this {
        logger.debug(`[EventBus] Registered listener for ${String(eventName)}`);
        // Wrap async listeners to catch unhandled rejections so they don't crash Node
        const safeListener = (payload: DomainEventMap[K]) => {
            try {
              const result = listener(payload);
              if (result && typeof (result as Promise<unknown>).then === 'function') {
                void (result as Promise<unknown>).catch((err) => {
                  this.log.error({ err, eventName, payload }, `[EventBus] Listener failed for ${String(eventName)}`);
                });
              }
            } catch (err) {
              this.log.error({ err, eventName, payload }, `[EventBus] Listener failed for ${String(eventName)}`);
            }
        };

        return super.on(eventName as string, safeListener);
    }
}

// Global Singleton Instance
export const eventBus = new EventBus();
