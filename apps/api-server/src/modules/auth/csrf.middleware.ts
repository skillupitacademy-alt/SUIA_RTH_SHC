import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto'; // Keep for compatibility per user request

export async function csrfProtection(request: NextRequest) {
  const method = request.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (!isMutation) return null;

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  const allowedOrigins = ['http://localhost:3000', 'https://quiz.realtutorialhub.com'];
  const isAllowed = allowedOrigins.includes(origin || '') || (origin && origin.includes(host || ''));

  if (origin && !isAllowed) {
    return NextResponse.json({ error: 'Origin mismatch' }, { status: 403 });
  }

  const cookieToken = request.cookies.get('csrfToken')?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
  }

  return null;
}

export function setCsrfToken(response: NextResponse) {
  // Use Web Crypto API instead of Node crypto for Edge compatibility
  const array = new Uint8Array(32);
  globalThis.crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  const isProd = process.env.NODE_ENV === 'production';

  response.cookies.set('csrfToken', token, {
    httpOnly: false,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'strict',
    path: '/',
    domain: isProd ? '.realtutorialhub.com' : undefined,
  });
  return token;
}
