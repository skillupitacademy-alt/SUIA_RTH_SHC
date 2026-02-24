import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

/**
 * TEMPORARY DEBUG ENDPOINT
 * Returns the userId/email from the current access token
 * to diagnose the empty dashboard issue.
 * 
 * TODO: REMOVE after debugging is complete.
 */
export async function GET(_req: NextRequest) {
  try {
    // Check user token
    const userToken = _req.cookies.get('accessToken')?.value;
    const adminToken = _req.cookies.get('admin_accessToken')?.value;
    const infraToken = _req.cookies.get('infra_accessToken')?.value;
    
    const result: Record<string, unknown> = {
      cookies: {
        hasAccessToken: typeof userToken === 'string' && userToken !== '',
        hasAdminAccessToken: typeof adminToken === 'string' && adminToken !== '',
        hasInfraAccessToken: typeof infraToken === 'string' && infraToken !== '',
      },
      timestamp: new Date().toISOString()
    };

    if (typeof userToken === 'string' && userToken !== '') {
      try {
        const payload = await TokenService.verifyAccessToken(userToken, false);
        result.userTokenPayload = {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles,
          aud: payload.aud,
          iat: payload.iat,
          exp: payload.exp,
        };
      } catch (err) {
        result.userTokenError = err instanceof Error ? err.message : 'Failed to verify';
      }
    }

    if (typeof adminToken === 'string' && adminToken !== '') {
      try {
        const payload = await TokenService.verifyAccessToken(adminToken, true);
        result.adminTokenPayload = {
          userId: payload.userId,
          email: payload.email,
          roles: payload.roles,
          aud: payload.aud,
        };
      } catch (err) {
        result.adminTokenError = err instanceof Error ? err.message : 'Failed to verify';
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}
