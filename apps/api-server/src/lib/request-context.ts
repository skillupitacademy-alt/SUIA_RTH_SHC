import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();
const genId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

export interface RequestContext {
  requestId: string;
  correlationId: string; // Alias for requestId
  userId?: string;
  ip?: string;
  path?: string;
  startedAt: number;
}

const asyncLocalStorageInstance = asyncLocalStorage;

/** Get the current request context (undefined outside a request) */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage?.getStore();
}

/** Get just the request (correlation) ID for the current request */
export function getRequestId(): string | undefined {
  return asyncLocalStorage?.getStore()?.requestId;
}

/** Alias for getRequestId (backward compatibility) */
export function getCorrelationId(): string | undefined {
    return asyncLocalStorage?.getStore()?.correlationId;
}

/** Get the authenticated user ID for the current request */
export function getUserId(): string | undefined {
  return asyncLocalStorage?.getStore()?.userId;
}

/** Get the request path */
export function getPath(): string | undefined {
    return asyncLocalStorage?.getStore()?.path;
}

/** Set the user ID after authentication middleware runs */
export function setUserId(userId: string): void {
  const store = asyncLocalStorage?.getStore();
  if (store) store.userId = userId;
}

/**
 * Run a function within a request context.
 * All async operations within fn() will have access to this context.
 */
export function withRequestContext<T>(
  context: Partial<RequestContext> & { requestId?: string },
  fn: () => T
): T {
  const requestId = context.requestId ?? context.correlationId ?? genId();
  const fullContext: RequestContext = {
    requestId,
    correlationId: requestId,
    userId: context.userId,
    ip: context.ip,
    path: context.path,
    startedAt: context.startedAt ?? Date.now(),
  };
  if (asyncLocalStorageInstance !== null) {
    return asyncLocalStorageInstance.run(fullContext, fn);
  }
  return fn();
}

/** Backward compatibility alias for withRequestContext */
export const runWithTrace = <T>(arg1: string | Partial<RequestContext>, callback: () => T): T => {
    const context = typeof arg1 === 'string' ? { correlationId: arg1 } : arg1;
    return withRequestContext(context, callback);
};
