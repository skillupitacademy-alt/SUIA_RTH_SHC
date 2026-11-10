import { type NextRequest } from 'next/server';

import { ConfigurationError } from '@quiz/auth';
import { ApiError, unauthorized } from '@/lib/api-error';
import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
import { SHCAuthService, UserNotFoundError } from '@/modules/auth/shc-auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

const SENSITIVE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
};

/**
 * GET /api/shc/auth/me
 * 
 * Get current SHC admin user info.
 * 🔒 SECURITY (R5-17 to R5-20):
 * - Distinguishes invalid/expired tokens (401) from database outages (503).
 * - Distinguishes typed unknown/deleted accounts (404) via UserNotFoundError without text inspection.
 * - Missing secrets or security configuration return 503.
 * - Never leaks internal database connection details or stack traces on outage.
 * - All responses emit Cache-Control: private, no-store.
 */
async function handler(req: NextRequest) {
  const tokenService = new TokenService();
  const accessToken = tokenService.getAccessToken(req);

  if (accessToken === null || accessToken === undefined || accessToken === '') {
    return ApiResponse.error(unauthorized('Authentication required'), 401, undefined, SENSITIVE_CACHE_HEADERS);
  }

  // 1. Verify token cryptographic validity and claims
  let payload;
  try {
    payload = await tokenService.verifyAccessToken(accessToken);
  } catch (err) {
    if (err instanceof ConfigurationError) {
      return ApiResponse.error(
        new ApiError(503, 'Authentication service temporarily unavailable', 'INTERNAL_ERROR'),
        503,
        undefined,
        SENSITIVE_CACHE_HEADERS
      );
    }
    return ApiResponse.error(unauthorized('Invalid or expired token'), 401, undefined, SENSITIVE_CACHE_HEADERS);
  }

  // 2. Verify SHC admin token audience and brand claims
  if (payload.brand !== 'skillhubcore' || payload.aud !== 'shc-admin') {
    return ApiResponse.error(unauthorized('Invalid token claims: unauthorized audience or brand'), 401, undefined, SENSITIVE_CACHE_HEADERS);
  }

  // 3. Query authoritative identity store
  try {
    const shcAuthService = new SHCAuthService();
    const user = await shcAuthService.me(payload.userId);

    if (!user) {
      return ApiResponse.error(new ApiError(404, 'Administrator not found', 'NOT_FOUND'), 404, undefined, SENSITIVE_CACHE_HEADERS);
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
    }, 200, SENSITIVE_CACHE_HEADERS);
  } catch (error) {
    // 🔒 R5-17: Typed domain error for absent account
    if (error instanceof UserNotFoundError) {
      return ApiResponse.error(new ApiError(404, 'Administrator not found', 'NOT_FOUND'), 404, undefined, SENSITIVE_CACHE_HEADERS);
    }

    // 🔒 G4 / R5-18: Database connection errors, network drops, or timeouts return 503 Service Unavailable
    console.error('[SHC_AUTH] Database/identity store outage in me handler:', error instanceof Error ? error.message : 'Unknown error');
    return ApiResponse.error(
      new ApiError(503, 'Identity service temporarily unavailable', 'INTERNAL_ERROR'),
      503,
      undefined,
      SENSITIVE_CACHE_HEADERS
    );
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'shc-auth', operation: 'me' })
  )
);
