/**
 * Request Context via AsyncLocalStorage (Upgraded from simple trace context for T71)
 * Allows accessing request-scoped data (like correlationId or userId) 
 * anywhere in the call stack without prop-drilling.
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContextData {
    correlationId: string;
    userId?: string;
    path?: string;
}

const traceStorage = new AsyncLocalStorage<RequestContextData>();

/**
 * Returns the current request context, if any.
 */
export function getRequestContext(): RequestContextData | undefined {
    return traceStorage.getStore();
}

/**
 * Returns the current correlation ID, or a fallback if not in a request context.
 */
export function getCorrelationId(): string | undefined {
    return getRequestContext()?.correlationId;
}

/**
 * Initializes a new asynchronous context containing the provided data.
 * Any asynchronous operations originating from the provided callback will have access
 * to this context.
 */
export function runWithTrace<T>(correlationId: string, callback: () => T): T;
export function runWithTrace<T>(data: RequestContextData, callback: () => T): T;
export function runWithTrace<T>(arg1: string | RequestContextData, callback: () => T): T {
    const data = typeof arg1 === 'string' ? { correlationId: arg1 } : arg1;
    return traceStorage.run(data, callback);
}
