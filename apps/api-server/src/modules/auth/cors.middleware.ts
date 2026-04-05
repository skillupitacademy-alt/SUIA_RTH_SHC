import type { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'x-csrf-token',
  'Idempotency-Key',
  'x-portal-identity',
  'x-request-id',
  'x-original-host',
  'accept-version',
  'x-brand',
].join(', ');

export function corsMiddleware(_request: NextRequest, response: NextResponse) {
  const origin = _request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  
  if ((origin !== null && origin !== '') && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  // Pillar 2: Resolve NotSameOrigin for telemetry (Vercel + browser security)
  // Catch all variations: /api/security/report, /api/v1/security/report/
  const isSecurityReport = _request.nextUrl.pathname.toLowerCase().includes('security/report');
  if (isSecurityReport) {
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }

  return response;
}
