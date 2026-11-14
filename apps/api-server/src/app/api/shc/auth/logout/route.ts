import { type AdminTokenPayload,ConfigurationError } from '@quiz/auth';
import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
import { getClientIp } from '@/modules/auth/client-ip';
import { SHCAuthService, ShcSessionInvalidError } from '@/modules/auth/shc-auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shc/auth/logout
 * 
 * Logout endpoint for SHC admins.
 */
async function handler(req: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' };
  let tokenService: TokenService;
  let payload: AdminTokenPayload;
  try {
    tokenService = new TokenService();
    const accessToken = tokenService.getAccessToken(req, { scope: 'admin' });
    if (typeof accessToken !== 'string' || accessToken.length === 0) return ApiResponse.error('Authentication required', 401, undefined, headers);
    payload = await tokenService.verifyAdminAccessToken(accessToken, {
      audience: 'shc-admin', issuer: 'skillhubcore.in', algorithms: ['HS256'],
    });
    if (payload.brand !== 'skillhubcore' || payload.tokenType !== 'admin') {
      return ApiResponse.error('Authentication required', 401, undefined, headers);
    }
  } catch (error) {
    const status = error instanceof ConfigurationError ? 503 : 401;
    return ApiResponse.error(status === 503 ? 'Authentication unavailable' : 'Authentication required', status, undefined, headers);
  }
  try {
    await new SHCAuthService().logout(payload, getClientIp(req));
    return ApiResponse.success({ message: 'Logged out successfully' }, 200, headers);
  } catch (error) {
    if (error instanceof ShcSessionInvalidError) {
      return ApiResponse.error('Administrator session is no longer valid', 401, undefined, headers);
    }
    return ApiResponse.error('Session revocation unavailable', 503, undefined, headers);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const POST = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'shc-auth', operation: 'logout' })
  )
);
