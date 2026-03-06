import { AsyncLocalStorage } from 'node:async_hooks';

interface TraceContext {
  correlationId: string;
}

const traceStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Initializes a new asynchronous context containing the provided correlation ID.
 * Any asynchronous operations originating from the provided callback will have access
 * to this context.
 */
export function runWithTrace<T>(correlationId: string, callback: () => T): T {
  return traceStorage.run({ correlationId }, callback);
}

/**
 * Retrieves the currently active correlation ID for the execution context, if any.
 */
export function getCorrelationId(): string | undefined {
  const store = traceStorage.getStore();
  return store?.correlationId;
}
