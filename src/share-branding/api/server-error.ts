import { NextRequest, NextResponse } from 'next/server';

/** Return an opaque failure that can be correlated with the server log. */
export function serverErrorResponse(
  request: NextRequest,
  status: number,
  message: string,
  error?: unknown,
) {
  const suppliedId = request.headers.get('x-request-id');
  const requestId = suppliedId && /^[0-9a-f-]{36}$/i.test(suppliedId)
    ? suppliedId
    : crypto.randomUUID();
  const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
  const errorCode = typeof code === 'string' && /^(?:[0-9A-Z]{5}|E[A-Z]{3,20})$/.test(code)
    ? code
    : undefined;

  console.error('BFF request failed', {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method,
    status,
    errorCode,
  });
  return NextResponse.json({ error: message, requestId }, {
    status,
    headers: { 'Cache-Control': 'private, no-store', 'X-Request-ID': requestId },
  });
}
