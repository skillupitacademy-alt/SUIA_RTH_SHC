/**
 * Minimal logging wrapper for Next.js App Router handlers.
 * - Generates/reuses a requestId and attaches it to the response header.
 * - Logs ONLY warnings/errors (no success noise) to keep serverless overhead low.
 * - Never logs bodies/headers/tokens; captures route/method/status/duration.
 * - Redacts PII patterns (emails, tokens).
 * - Returns a generic 500 JSON error for unhandled exceptions.
 */
import { type NextRequest, NextResponse } from 'next/server';

import { logger } from './logger';

type RouteHandler<T = unknown> = (request: NextRequest, context: T) => Promise<Response> | Response;

type LogOptions = {
  component?: string;
  operation?: string;
};

/**
 * Basic PII scrubber for error objects/messages
 */
function scrub(input: unknown): unknown {
  if (typeof input === 'string') {
    // Redact emails
    return input.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');
  }
  if (Array.isArray(input)) {
    return input.map(scrub);
  }
  if (typeof input === 'object' && input !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (['email', 'password', 'token', 'authorization'].includes(key.toLowerCase())) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = scrub(value);
      }
    }
    return out;
  }
  return input;
}

export function withLogging<T = unknown>(handler: RouteHandler<T>, options: LogOptions = {}): RouteHandler<T> {
    return async (request: NextRequest, context: T) => {
        const start = Date.now();
        const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
        const childLogger = logger.child({
            requestId,
            component: options.component,
            operation: options.operation,
        });

        try {
            const response = await handler(request, context);
            const status = response.status ?? 200;
            const durationMs = Date.now() - start;
            const outcome = status >= 500 ? 'failure' : status >= 400 ? 'failure' : 'success';

            // Only log non-success to reduce noise; capture structured fields.
            if (status >= 400 && status < 500) {
                childLogger.warn({
                    route: request.nextUrl.pathname,
                    method: request.method,
                    statusCode: status,
                    requestId,
                    duration_ms: durationMs,
                    outcome,
                    component: options.component ?? 'api',
                }, 'Client error response');
            } else if (status >= 500) {
                childLogger.error({
                    route: request.nextUrl.pathname,
                    method: request.method,
                    statusCode: status,
                    requestId,
                    duration_ms: durationMs,
                    outcome,
                    component: options.component ?? 'api',
                }, 'Server error response');
            }

            // Ensure the requestId is surfaced to callers.
            const headers = new Headers(response.headers);
            headers.set('x-request-id', requestId);
            return new NextResponse(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers,
            });
        } catch (err) {
            const durationMs = Date.now() - start;
            const isProd = process.env.NODE_ENV === 'production';
            const outcome = 'failure';

            childLogger.error({
                route: request.nextUrl.pathname,
                method: request.method,
                statusCode: 500,
                requestId,
                duration_ms: durationMs,
                outcome,
                component: options.component ?? 'api',
                error: err instanceof Error ? scrub(err.message) : 'Unknown error',
                stack: !isProd && err instanceof Error ? scrub(err.stack) : undefined,
            }, 'Unhandled exception in route');

            const body = { _error: 'Internal Server Error', requestId };
            return NextResponse.json(body, { status: 500, headers: { 'x-request-id': requestId } });
        }
    };
}

// Test-only export to validate scrub behavior without changing runtime logic
export const __test__ = { scrub };
