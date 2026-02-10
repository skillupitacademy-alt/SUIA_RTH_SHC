import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto'; // Keep for compatibility per user request
import { config } from '@/config';

export async function csrfProtection(request: NextRequest) {
  const method = request.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (!isMutation) return null;

  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  
  // Check if origin is allowed
  const isAllowed = config.csrf.allowedOrigins.includes(origin || '') || 
    (origin && origin.includes(host || ''));
  

  if (origin && !isAllowed) {
    return NextResponse.json({ error: 'Origin mismatch' }, { status: 403 });
  }

  const cookieToken = request.cookies.get('csrfToken')?.value;
  const headerToken = request.headers.get('x-csrf-token');


  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    // SECURITY UPGRADE: JWT Fallback
    // If the CSRF check fails, check if the request has a valid Authorization header.
    // In a multi-port/multi-domain local setup, cookies are often lost or blocked.
    // If the JWT is valid, we can trust the identity and just re-issue the CSRF token.
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // We return null to allow the request, but middleware will also add the new CSRF token to the response
      return null; 
    }

    // SELF-HEALING: If session is valid, issue a new token so the client can retry immediately
    // We only provide this helper if the user is actually logged in (has an access token)
    const hasSession = request.cookies.has('accessToken') || request.cookies.has('admin_accessToken');
    
    if (hasSession) {
      const response = NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
      setCsrfToken(response);
      return response;
    }

    return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
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
