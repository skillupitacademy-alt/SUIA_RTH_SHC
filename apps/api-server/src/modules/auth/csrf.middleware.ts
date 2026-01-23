import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function csrfProtection(request: NextRequest) {
  const method = request.method;
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (!isMutation) return null;

  // 1. Origin/Referer Check (Foundation)
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  if (origin && !origin.includes(host || '')) {
    return NextResponse.json({ error: 'Origin mismatch' }, { status: 403 });
  }

  // 2. Double-Submit Cookie Pattern
  // In a robust implementation, the frontend would receive this token via a cookie
  // and send it back in a custom header.
  const cookieToken = request.cookies.get('csrfToken')?.value;
  const headerToken = request.headers.get('x-csrf-token');

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
  }

  return null;
}

// Helper to generate a new CSRF token response
export function setCsrfToken(response: NextResponse) {
  const token = crypto.randomBytes(32).toString('hex');
  response.cookies.set('csrfToken', token, {
    httpOnly: false, // Must be readable by client for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  return token;
}
