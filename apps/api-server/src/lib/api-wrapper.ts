import crypto from 'crypto';
import type { NextRequest } from 'next/server';

import { runWithTrace } from './trace.context';

/**
 * A higher-order function that wraps Next.js API route handlers to automatically
 * initialize and seed the `AsyncLocalStorage` trace context.
 * 
 * If the incoming request has an 'x-correlation-id' header, it uses that.
 * Otherwise, it provisions a fresh UUID for the request lifecycle.
 * 
 * @param handler The original Next.js Route Handler
 */
export function withTracing<T>(handler: (req: NextRequest, ...args: unknown[]) => Promise<T>) {
  return async (req: NextRequest, ...args: unknown[]): Promise<T> => {
    // 1. Extract or generate Correlation ID
    const incomingCorrelationId = req.headers.get('x-correlation-id');
    const correlationId =
      incomingCorrelationId !== null && incomingCorrelationId !== ''
        ? incomingCorrelationId
        : crypto.randomUUID();
    
    // 2. Execute the handler entirely enclosed within the AsyncLocalStorage
    return runWithTrace(correlationId, () => handler(req, ...args));
  };
}
