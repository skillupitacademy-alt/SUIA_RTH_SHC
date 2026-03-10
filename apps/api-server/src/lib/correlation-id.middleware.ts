/**
 * Correlation ID Middleware Wrapper
 * Wraps a Next.js App Router handler (req, context) => Response.
 * Ensures every incoming request gets a unique correlation ID
 * that flows through the system via AsyncLocalStorage.
 */
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

import { withRequestContext } from './request-context';

export function withCorrelationId<TContext = unknown>(
  handler: (req: NextRequest, context: TContext) => Promise<Response> | Response
) {
  return async (req: NextRequest, context: TContext): Promise<Response> => {
    const incomingId = req.headers.get('x-correlation-id') ?? req.headers.get('x-request-id') ?? '';
    const trimmed = incomingId.trim();
    const correlationId = trimmed.length > 0 ? trimmed : crypto.randomUUID();

    return withRequestContext(
      { 
        requestId: correlationId, 
        correlationId,
        path: req.nextUrl.pathname,
        ip: (req as { ip?: string }).ip ?? undefined
      }, 
      async () => {
        const response = await handler(req, context);
        response.headers.set('x-correlation-id', correlationId);
        return response;
      }
    );
  };
}
