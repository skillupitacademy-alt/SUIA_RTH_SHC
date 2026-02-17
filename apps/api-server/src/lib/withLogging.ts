/**
 * Minimal logging wrapper for Next.js App Router handlers.
 * - Generates/reuses a requestId and attaches it to the response header.
 * - Logs ONLY warnings/errors (no success noise) to keep serverless overhead low.
 * - Never logs bodies/headers/tokens; captures route/method/status/duration.
 * - Returns a generic 500 JSON error for unhandled exceptions.
 */
import { randomUUID } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';

import { logger } from './logger';

type RouteHandler<T = unknown> = (request: NextRequest, context: T) => Promise<Response> | Response;

export function withLogging<T = unknown>(handler: RouteHandler<T>): RouteHandler<T> {
    return async (request: NextRequest, context: T) => {
        const start = Date.now();
        const requestId = request.headers.get('x-request-id') ?? randomUUID();
        const childLogger = logger.child({ requestId });

        try {
            const response = await handler(request, context);
            const status = response.status ?? 200;

            // Only warn on client errors; no logging for successes.
            if (status >= 400 && status < 500) {
                childLogger.warn({
                    route: request.nextUrl.pathname,
                    method: request.method,
                    statusCode: status,
                    requestId,
                    durationMs: Date.now() - start,
                }, 'Client error response');
            } else if (status >= 500) {
                childLogger.error({
                    route: request.nextUrl.pathname,
                    method: request.method,
                    statusCode: status,
                    requestId,
                    durationMs: Date.now() - start,
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

            childLogger.error({
                route: request.nextUrl.pathname,
                method: request.method,
                statusCode: 500,
                requestId,
                durationMs,
                error: err instanceof Error ? err.message : 'Unknown error',
                stack: !isProd && err instanceof Error ? err.stack : undefined,
            }, 'Unhandled exception in route');

            const body = { _error: 'Internal Server Error', requestId };
            return NextResponse.json(body, { status: 500, headers: { 'x-request-id': requestId } });
        }
    };
}
