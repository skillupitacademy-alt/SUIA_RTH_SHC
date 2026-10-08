import { type NextRequest } from 'next/server';

import { unauthorized } from '@/lib/api-error';
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
 */
async function handler(req: NextRequest) {
  console.log('[SHC_AUTH] Me request received');

  try {
    const tokenService = new TokenService();
    const accessToken = tokenService.getAccessToken(req);

    if (accessToken === null || accessToken === undefined || accessToken === '') {
      console.log('[SHC_AUTH] No access token found');
      return ApiResponse.error(unauthorized('Authentication required'));
    }

    // Verify token
    const payload = await tokenService.verifyAccessToken(accessToken);

    // Verify this is an SHC admin token
    if (payload.brand !== 'skillhubcore' || payload.aud !== 'shc-admin') {
      console.log('[SHC_AUTH] Invalid token brand or audience:', {
        brand: payload.brand,
        aud: payload.aud,
      });
      return ApiResponse.error(unauthorized('Invalid token'));
    }

    console.log('[SHC_AUTH] Token verified:', { userId: payload.userId });

    const shcAuthService = new SHCAuthService();
    const user = await shcAuthService.me(payload.userId);

    console.log('[SHC_AUTH] User info retrieved:', { userId: user.id, role: user.role });

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
    const message = error instanceof Error ? error.message : 'Failed to get user info';
    console.error('[SHC_AUTH] Me error:', message);
    return ApiResponse.error(unauthorized(message));
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'shc-auth', operation: 'me' })
  )
);
