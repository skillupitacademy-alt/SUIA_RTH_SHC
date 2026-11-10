import { type NextRequest } from 'next/server';

import { ApiError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
import { SHCAuthService } from '@/modules/auth/shc-auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shc/auth/me
 * 
 * Get current SHC admin user info.
 * 🔒 SECURITY (R4-11, R4-12):
 * - Distinguishes invalid/expired tokens (401) from database outages (503).
 * - Distinguishes unknown/deleted accounts (404).
 * - Never leaks internal database connection details or stack traces on outage.
 */
async function handler(req: NextRequest) {
  const tokenService = new TokenService();
  const accessToken = tokenService.getAccessToken(req);

  if (accessToken === null || accessToken === undefined || accessToken === '') {
    return ApiResponse.error(unauthorized('Authentication required'));
  }

  // 1. Verify token cryptographic validity and claims
  let payload;
  try {
    payload = await tokenService.verifyAccessToken(accessToken);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    return ApiResponse.error(unauthorized(message));
  }

  // 2. Verify SHC admin token audience and brand claims
  if (payload.brand !== 'skillhubcore' || payload.aud !== 'shc-admin') {
    return ApiResponse.error(unauthorized('Invalid token: not an SHC admin token'));
  }

  // 3. Query authoritative identity store
  try {
    const shcAuthService = new SHCAuthService();
    const user = await shcAuthService.me(payload.userId);

    if (!user) {
      return ApiResponse.error(new ApiError(404, 'Administrator not found', 'NOT_FOUND'), 404);
    }

    return ApiResponse.success({ 
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        platform: user.platform,
        isActive: user.isActive,
        isAdmin: true,
        brand: 'skillhubcore',
        onboardingCompleted: true, // SHC admins don't need onboarding
      },
      expiresAt: null, // SHC tokens don't have explicit expiry in response
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.toLowerCase().includes('not found')) {
      return ApiResponse.error(new ApiError(404, 'Administrator not found', 'NOT_FOUND'), 404);
    }

    // 🔒 G4: Database connection errors, network drops, or timeouts return 503 Service Unavailable
    console.error('[SHC_AUTH] Database/identity store outage in me handler:', message);
    return ApiResponse.error(
      new ApiError(503, 'Identity service temporarily unavailable', 'INTERNAL_ERROR'),
      503
    );
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'shc-auth', operation: 'me' })
  )
);
