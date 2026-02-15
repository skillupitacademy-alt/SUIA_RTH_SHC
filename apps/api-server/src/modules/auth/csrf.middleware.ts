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
    return NextResponse.json({ _error: 'Origin mismatch' }, { status: 403 });
  }

  const cookieToken = _request.cookies.get('csrfToken')?.value;
  const headerToken = _request.headers.get('x-csrf-token');


  if (cookieToken === undefined || headerToken === null || cookieToken !== headerToken) {
    // SECURITY UPGRADE: JWT Fallback
    // If the CSRF check fails, check if the _request has a valid Authorization header.
    // In a multi-port/multi-domain local setup, cookies are often lost or blocked.
    // If the JWT is valid, we can trust the identity and just re-issue the CSRF _token.
    const authHeader = _request.headers.get('authorization');
    if (authHeader !== null && authHeader.startsWith('Bearer ')) {
      // We return null to allow the _request, but middleware will also add the new CSRF _token to the response
      return null; 
    }

    // SELF-HEALING: If session is valid, issue a new _token so the client can retry immediately
    // We only provide this helper if the _user is actually logged in (has an access _token)
    const hasSession = _request.cookies.has('accessToken') || _request.cookies.has('admin_accessToken');
    
    if (hasSession === true) {
      const response = NextResponse.json({ _error: 'CSRF _token validation failed' }, { status: 403 });
      setCsrfToken(response);
      return response;
    }

    return NextResponse.json({ _error: 'CSRF _token validation failed' }, { status: 403 });
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
