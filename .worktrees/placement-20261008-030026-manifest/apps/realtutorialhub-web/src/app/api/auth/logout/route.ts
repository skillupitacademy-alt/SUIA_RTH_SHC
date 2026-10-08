import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { proxyAuthRequest, FALLBACK_API_BASE_RTH } from '../../../../../../../src/share-branding/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // ✅ Proxy to backend (which clears cookies and revokes tokens)
  const backendResponse = await proxyAuthRequest(request, { 
    fallbackApiBase: FALLBACK_API_BASE_RTH, 
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
