import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

interface RefreshRequest {
  examId?: string;
}

export async function POST(_req: NextRequest) {
  try {
    const refreshToken = _req.cookies.get('refreshToken')?.value;
    const adminToken = _req.cookies.get('admin_accessToken')?.value;

    if (typeof refreshToken !== 'string' && typeof adminToken !== 'string') {
      throw new Error('No refresh token');
    }

    const tokenToUse = refreshToken ?? adminToken;
    if (typeof tokenToUse !== 'string') {
       throw new Error('Invalid token');
    }

    const isAdmin = typeof adminToken === 'string' && typeof refreshToken !== 'string';
    const cookieName = isAdmin ? 'admin_refreshToken' : 'refreshToken';

    const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
    
    // Phase 3: Extract examId for grace window extension
    let examId: string | undefined;
    try {
      const body = (await _req.json()) as RefreshRequest;
      examId = body?.examId;
    } catch {
      // Body might be empty, ignore
    }

    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(tokenToUse, ip, examId);
    const expiresAt = TokenService.getExpiration(accessToken);

    // Calculate dynamic maxAge for cookie based on token expiration
    let maxAge = 15 * 60; // 15m default
    if (expiresAt !== null) {
        const expTime = new Date(expiresAt).getTime();
        const now = Date.now();
        maxAge = Math.ceil((expTime - now) / 1000);
    }
    if (maxAge < 0) maxAge = 15 * 60; // Fallback

    const response = NextResponse.json({ success: true, expiresAt });

    const cookieDomain = process.env.COOKIE_DOMAIN;

    // Re-issue Access Token Cookie
    const accessTokenCookieName = isAdmin ? 'admin_accessToken' : 'accessToken';
    response.cookies.set(accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: maxAge, // Dynamic MaxAge
      path: '/',
      domain: cookieDomain,
    });

    // Rotate Refresh Token Cookie
    response.cookies.set(cookieName, newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      domain: cookieDomain,
    });

    return response;
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 401 });
  }
}
