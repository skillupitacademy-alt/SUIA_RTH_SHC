/**
 * Core Application Event Bus (Pub/Sub)
 * Decouples core logic from asynchronous side-effects 
 * (like sending emails, updating analytics, or triggering background jobs).
 */

import { EventEmitter } from 'events';

import { logger } from '@/lib/logger';

import type { DomainEventMap } from './events';

class EventBus extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(20); // Scale up for many decoupled listeners
    }

    /**
     * Type-safe emit method.
     */
    public emitEvent<K extends keyof DomainEventMap>(
        eventName: K, 
        payload: DomainEventMap[K]
    ): boolean {
        logger.debug({ eventName, payload }, `[EventBus] Emitting ${String(eventName)}`);
        // We still call the base EventEmitter emit under the hood
        return super.emit(eventName as string, payload);
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
            void Promise.resolve(listener(payload)).catch((err) => {
                logger.error({ err, eventName, payload }, `[EventBus] Listener failed for ${String(eventName)}`);
            });
        };

        return super.on(eventName as string, safeListener);
    }
}

// Global Singleton Instance
export const eventBus = new EventBus();
