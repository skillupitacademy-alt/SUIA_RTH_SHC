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
    // Detect Portal Tier
    const portalIdentity = _req.headers.get('x-portal-identity') ?? 'user';
    const audience = portalIdentity === 'infrastructure' ? 'infra' : portalIdentity === 'admin' ? 'admin' : 'user';

    const infraRefresh = _req.cookies.get('infra_refreshToken')?.value;
    const adminRefresh = _req.cookies.get('admin_refreshToken')?.value;
    const userRefresh = _req.cookies.get('refreshToken')?.value;

    const tokenToUse = portalIdentity === 'infrastructure' ? infraRefresh : portalIdentity === 'admin' ? adminRefresh : userRefresh;
    
    if (tokenToUse === undefined || tokenToUse === null || tokenToUse === '') {
      throw new Error(`No refresh token for scope: ${portalIdentity}`);
    }

    const cookieName = portalIdentity === 'infrastructure' ? 'infra_refreshToken' : portalIdentity === 'admin' ? 'admin_refreshToken' : 'refreshToken';

    const ip = _req.headers.get('x-forwarded-for') ?? '0.0.0.0';
    
    // Phase 3: Extract examId for grace window extension
    let examId: string | undefined;
    try {
      const body = (await _req.json()) as RefreshRequest;
      examId = body?.examId;
    } catch {
      // Body might be empty, ignore
    }

    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(tokenToUse, ip, examId, audience);
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

    const rawDomain = process.env.COOKIE_DOMAIN;
    const cookieDomain = rawDomain === undefined || rawDomain === null || rawDomain === '' ? undefined : rawDomain;

    // Re-issue Access Token Cookie with Tier Isolation
    const accessTokenCookieName = portalIdentity === 'infrastructure' ? 'infra_accessToken' : portalIdentity === 'admin' ? 'admin_accessToken' : 'accessToken';
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
