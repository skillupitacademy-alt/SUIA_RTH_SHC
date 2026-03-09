/**
 * Correlation ID Middleware
 * Ensures every incoming request gets a unique correlation ID
 * that flows through the system via AsyncLocalStorage.
 */
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { runWithTrace } from './trace.context';

export async function withCorrelationId(
    req: NextRequest, 
    handler: (req: NextRequest) => Promise<NextResponse>
) {
    const incomingId = req.headers.get('x-correlation-id');
    const correlationId =
      incomingId !== null && incomingId !== undefined && incomingId.trim() !== ''
        ? incomingId
        : crypto.randomUUID();

    // Reattach the header so it flows to upstream services if needed
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-correlation-id', correlationId);

    // Create a new request object with the updated headers
    const newReq = new NextRequest(req, {
        headers: requestHeaders
    });

    const contextData = {
        correlationId,
        path: req.nextUrl.pathname
    };

    return runWithTrace(contextData, async () => {
        const response = await handler(newReq);
        response.headers.set('x-correlation-id', correlationId);
        return response;
    });
}
