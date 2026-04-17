import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { proxyAuthRequest } from '../../../../../../../src/share-branding/auth/authBffRoute';

export const dynamic = 'force-dynamic';

const FALLBACK_API_BASE = 'https://api.skillupitacademy.com/api';

export async function POST(request: NextRequest) {
  // ✅ Proxy to backend (which clears cookies and revokes tokens)
  const backendResponse = await proxyAuthRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE, 
    authPath: 'logout' 
  });
  
  // ✅ DEFENSE IN DEPTH: Explicitly clear cookies at BFF layer
  // This ensures cookies are cleared even if backend response doesn't propagate correctly
  const response = NextResponse.json(
    await backendResponse.json().catch(() => ({ success: true })),
    { status: backendResponse.status }
  );
  
  // Copy headers from backend response
  backendResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      response.headers.set(key, value);
    }
  });
  
  // Clear cookies at BFF level (defense in depth)
  const clearCookie = (name: string) => {
    response.cookies.set(name, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 0,
      path: '/',
    });
  };
  
  clearCookie('accessToken');
  clearCookie('refreshToken');
  clearCookie('csrfToken');
  
  return response;
}
