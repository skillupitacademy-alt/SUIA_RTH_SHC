import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refreshToken')?.value;
    const adminToken = req.cookies.get('admin_refreshToken')?.value;
    
    if (!refreshToken && !adminToken) throw new Error('No refresh token');

    const tokenToUse = refreshToken || adminToken;
    const isAdmin = !!adminToken && !refreshToken; // Heuristic based on which cookie is present
    const cookieName = isAdmin ? 'admin_refreshToken' : 'refreshToken';

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || '';
    
    // Phase 3: Extract examId for grace window extension
    let examId: string | undefined;
    try {
      const body = await req.json();
      examId = body?.examId;
    } catch {
      // Body might be empty, ignore
    }

    const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(tokenToUse!, ip, examId);
    const expiresAt = TokenService.getExpiration(accessToken);

    // Calculate dynamic maxAge for cookie based on token expiration
    let maxAge = 15 * 60; // 15m default
    if (expiresAt) {
        const expTime = new Date(expiresAt).getTime();
        const now = Date.now();
        maxAge = Math.ceil((expTime - now) / 1000);
        if (maxAge < 0) maxAge = 15 * 60; // Fallback
    }

    const response = NextResponse.json({ success: true, expiresAt });

    const cookieDomain = process.env.COOKIE_DOMAIN || '.realtutorialhub.com';
    const isProd = process.env.NODE_ENV === 'production';

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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
