import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

interface RefreshRequest {
  examId?: string;
}

async function handler(_req: NextRequest) {
  try {
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
    
    const body = await _req.json().catch(() => ({})) as RefreshRequest;
    const examId = typeof body?.examId === 'string' && body.examId !== '' ? body.examId : undefined;

    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(tokenToUse, ip, examId, audience);
    const expiresAt = TokenService.getExpiration(accessToken);

    let maxAge = 15 * 60; 
    if (expiresAt !== null) {
        const expTime = new Date(expiresAt).getTime();
        const now = Date.now();
        maxAge = Math.ceil((expTime - now) / 1000);
    }
    if (maxAge < 0) maxAge = 15 * 60; 

    const response = NextResponse.json({ success: true, expiresAt });

    const rawDomain = process.env.COOKIE_DOMAIN;
    const cookieDomain = rawDomain === undefined || rawDomain === null || rawDomain === '' ? undefined : rawDomain;

    const accessTokenCookieName = portalIdentity === 'infrastructure' ? 'infra_accessToken' : portalIdentity === 'admin' ? 'admin_accessToken' : 'accessToken';
    response.cookies.set(accessTokenCookieName, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: maxAge, 
      path: '/',
      domain: cookieDomain,
    });

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

export const POST = withLogging(handler, { component: 'auth', operation: 'refresh_tokens' });
