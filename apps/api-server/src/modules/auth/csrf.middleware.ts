import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

 // Keep for compatibility per _user _request
import { config } from '@/config';

export async function csrfProtection(_request: NextRequest) {
  const method = _request.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (isMutation === false) return null;

  const origin = _request.headers.get('origin');
  const host = _request.headers.get('host');
  
  
  // Check if origin is allowed
  const isAllowed = config.csrf.allowedOrigins.includes(origin ?? '') || 
    (origin !== null && origin.includes(host ?? ''));
  

  if (origin !== null && isAllowed === false) {
    return NextResponse.json({ error: 'CSRF validation failed', message: 'Origin mismatch' }, { status: 403 });
  }

  const cookieToken = _request.cookies.get('csrfToken')?.value;
  const headerToken = _request.headers.get('x-csrf-token');
  const internalKey = _request.headers.get('x-internal-key');
  const isValidInternal = internalKey !== null && internalKey === process.env.INTERNAL_API_KEY;

  if (!isValidInternal && (cookieToken === undefined || headerToken === null || cookieToken !== headerToken)) {
    return NextResponse.json({ error: 'CSRF validation failed', message: 'Missing or invalid CSRF token' }, { status: 403 });
  }

  return null;
}

export function setCsrfToken(response: NextResponse) {
  // Use Web Crypto API instead of Node crypto for Edge compatibility
  const array = new Uint8Array(32);
  globalThis.crypto.getRandomValues(array);
  const _token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  response.cookies.set('csrfToken', _token, {
    ...config.csrf.cookieSettings,
    path: '/',
  });
  return _token;
}
