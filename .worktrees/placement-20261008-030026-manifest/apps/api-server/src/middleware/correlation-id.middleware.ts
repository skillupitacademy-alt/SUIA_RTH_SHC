import { randomUUID } from 'crypto';
import { type NextRequest } from 'next/server';

import { withRequestContext } from '@/lib/request-context';

/**
 * Correlation ID middleware.
 * Wraps a Next.js App Router handler (req, context) => Response.
 */
export function withCorrelationId<TContext = unknown>(
  handler: (req: NextRequest, context: TContext) => Promise<Response> | Response
) {
  return async (req: NextRequest, context: TContext): Promise<Response> => {
    const requestId = req.headers.get('x-request-id') ?? randomUUID();
    return withRequestContext({ requestId }, () => handler(req, context));
  };
}
