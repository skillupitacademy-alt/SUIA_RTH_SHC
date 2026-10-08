import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
import { getClientIp } from '@/modules/auth/client-ip';
import { SHCAuthService } from '@/modules/auth/shc-auth.service';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shc/auth/logout
 * 
 * Logout endpoint for SHC admins.
 */
async function handler(req: NextRequest) {
  console.log('[SHC_AUTH] Logout request received');

  try {
    const tokenService = new TokenService();
    const accessToken = tokenService.getAccessToken(req);

    let userId: string | undefined;

    if (accessToken !== null && accessToken !== undefined && accessToken !== '') {
      try {
        const payload = await tokenService.verifyAccessToken(accessToken);
        userId = payload.userId;
      } catch {
        // Token invalid or expired, continue with logout anyway
        console.log('[SHC_AUTH] Token verification failed during logout');
      }
    }

    const ip = getClientIp(req);

    if (userId !== null && userId !== undefined && userId !== '') {
      const shcAuthService = new SHCAuthService();
      await shcAuthService.logout(userId, ip);
      console.log('[SHC_AUTH] Logout successful:', { userId });
    } else {
      console.log('[SHC_AUTH] Logout without user ID');
    }

    // Return success message
    // The SHC admin app proxy will handle clearing cookies
    return ApiResponse.success({ message: 'Logged out successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    console.error('[SHC_AUTH] Logout error:', message);
    
    // Return success even if logout fails
    return ApiResponse.success({ message: 'Logged out' });
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const POST = withObservability(
  withCorrelationId(
    withLogging(handler, { component: 'shc-auth', operation: 'logout' })
  )
);
