import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';

export function corsMiddleware(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get('origin');
  
  if (origin && config.cors.allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-csrf-token, Idempotency-Key');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}
