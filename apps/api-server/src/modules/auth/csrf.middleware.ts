import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto'; // Keep for compatibility per user request
import { config } from '@/config';

export async function csrfProtection(request: NextRequest) {
  const method = request.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (!isMutation) return null;

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // Debug logging (only in development)
  if (config.debug.logCsrf) {
    console.log('[CSRF] Origin:', origin);
    console.log('[CSRF] Host:', host);
  }
  
  // Check if origin is allowed
  const isLocalhost = config.csrf.allowAllLocalhost && 
    (origin?.includes('localhost') || origin?.includes('127.0.0.1'));
  const isAllowed = isLocalhost || 
    config.csrf.allowedOrigins.includes(origin || '') || 
    (origin && origin.includes(host || ''));

  if (config.debug.logCsrf) {
    console.log('[CSRF] isLocalhost:', isLocalhost);
    console.log('[CSRF] isAllowed:', isAllowed);
  }

  if (origin && !isAllowed) {
    if (config.debug.logCsrf) {
      console.log('[CSRF] REJECTED - Origin mismatch');
    }
    return NextResponse.json({ error: 'Origin mismatch' }, { status: 403 });
  }

  const cookieToken = request.cookies.get('csrfToken')?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (config.debug.logCsrf) {
    console.log('[CSRF] Cookie token:', cookieToken ? 'present' : 'missing');
    console.log('[CSRF] Header token:', headerToken ? 'present' : 'missing');
  }

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    if (config.debug.logCsrf) {
      console.log('[CSRF] REJECTED - Token validation failed');
    }
    return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
  }

  if (config.debug.logCsrf) {
    console.log('[CSRF] PASSED');
  }
  return null;
}

export function setCsrfToken(response: NextResponse) {
  // Use Web Crypto API instead of Node crypto for Edge compatibility
  const array = new Uint8Array(32);
  globalThis.crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  response.cookies.set('csrfToken', token, {
    ...config.csrf.cookieSettings,
    path: '/',
  });
  return token;
}
