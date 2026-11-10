import { type NextRequest } from 'next/server';

import { ConfigurationError, type AdminTokenPayload } from '@quiz/auth';
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
 * 🔒 SECURITY (R6-A, R6-B, R6-D):
 * - Scoped TokenService construction and token verification catching ConfigurationError (503).
 * - Enforces full SHC Admin JWT policy (HS256, pinned issuer skillhubcore.in, audience shc-admin,
 *   tokenType admin, brand skillhubcore, finite future exp, valid nbf, valid principal) (401).
 * - Distinguishes invalid/expired tokens (401) from database outages (503).
 * - Authoritative current-account eligibility: inactive, student, and faculty accounts receive 403 Forbidden.
 * - Distinguishes typed unknown/deleted accounts (404) via UserNotFoundError without text inspection.
 * - Missing secrets or security configuration return 503.
 * - Never leaks internal database connection details or stack traces on outage.
 * - All responses emit Cache-Control: private, no-store.
 */
async function handler(req: NextRequest) {
  // 🔒 R6-14: Scoped token-service construction with 503 classification for ConfigurationError
  let tokenService: TokenService;
  let accessToken: string | undefined | null;
  try {
    tokenService = new TokenService();
    accessToken = tokenService.getAccessToken(req);
  } catch (err) {
    if (err instanceof ConfigurationError) {
      return ApiResponse.error(
        new ApiError(503, 'Authentication service temporarily unavailable', 'INTERNAL_ERROR'),
        503,
        undefined,
        SENSITIVE_CACHE_HEADERS
      );
    }
    return ApiResponse.error(
      new ApiError(503, 'Authentication service temporarily unavailable', 'INTERNAL_ERROR'),
      503,
      undefined,
      SENSITIVE_CACHE_HEADERS
    );
  }

  if (accessToken === null || accessToken === undefined || accessToken === '') {
    return ApiResponse.error(unauthorized('Authentication required'), 401, undefined, SENSITIVE_CACHE_HEADERS);
  }

  // 1. Verify token cryptographic validity and claims via verifyAdminAccessToken (R6-06 to R6-09)
  let payload: AdminTokenPayload;
  try {
    payload = await tokenService.verifyAdminAccessToken(accessToken, {
      audience: 'shc-admin',
      issuer: 'skillhubcore.in',
      algorithms: ['HS256'],
    });

    // 🔒 R6-07: Mandatory claim policy
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp <= now) {
      return ApiResponse.error(unauthorized('Token expired or missing expiration claim'), 401, undefined, SENSITIVE_CACHE_HEADERS);
    }
    if (payload.iss !== 'skillhubcore.in') {
      return ApiResponse.error(unauthorized('Invalid issuer claim'), 401, undefined, SENSITIVE_CACHE_HEADERS);
    }
    const audList = Array.isArray(payload.aud) ? payload.aud : (payload.aud ? [payload.aud] : []);
    if (!audList.includes('shc-admin')) {
      return ApiResponse.error(unauthorized('Invalid audience claim'), 401, undefined, SENSITIVE_CACHE_HEADERS);
    }
    if (payload.tokenType !== 'admin') {
      return ApiResponse.error(unauthorized('Invalid token type'), 401, undefined, SENSITIVE_CACHE_HEADERS);
    }
    if (payload.brand !== 'skillhubcore') {
      return ApiResponse.error(unauthorized('Invalid brand claim'), 401, undefined, SENSITIVE_CACHE_HEADERS);
    }
    if (payload.nbf !== undefined && (typeof payload.nbf !== 'number' || !Number.isFinite(payload.nbf) || payload.nbf > now)) {
      return ApiResponse.error(unauthorized('Token not yet valid'), 401, undefined, SENSITIVE_CACHE_HEADERS);
    }
    const principalId = payload.userId || (payload as any).sub;
    if (!principalId || typeof principalId !== 'string' || principalId.trim().length === 0) {
      return ApiResponse.error(unauthorized('Missing or invalid principal identity'), 401, undefined, SENSITIVE_CACHE_HEADERS);
    }
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

  // 2. Query authoritative identity store and enforce current account eligibility (R6-01 to R6-03)
  try {
    const shcAuthService = new SHCAuthService();
    const principalId = payload.userId || (payload as any).sub;
    const user = await shcAuthService.me(principalId);

    if (!user) {
      return ApiResponse.error(new ApiError(404, 'Administrator not found', 'NOT_FOUND'), 404, undefined, SENSITIVE_CACHE_HEADERS);
    }

    // 🔒 R6-02: Authoritative current-account eligibility check
    const isEligible =
      user.isActive === true &&
      user.platform === 'skillhubcore' &&
      (user.role === 'admin' || user.role === 'super_admin');

    if (!isEligible) {
      return ApiResponse.error(
        new ApiError(403, 'Account is not eligible for administrative access', 'FORBIDDEN'),
        403,
        undefined,
        SENSITIVE_CACHE_HEADERS
      );
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
