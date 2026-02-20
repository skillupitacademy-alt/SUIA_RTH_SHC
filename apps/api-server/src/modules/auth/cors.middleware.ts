import type { NextRequest, NextResponse } from 'next/server';

import { config } from '@/config';

export function corsMiddleware(_request: NextRequest, response: NextResponse) {
  const origin = _request.headers.get('origin');
  
  if ((origin !== null && origin !== '') && config.cors.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, Idempotency-Key, x-portal-identity');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}
