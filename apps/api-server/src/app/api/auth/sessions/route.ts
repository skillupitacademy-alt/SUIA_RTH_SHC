import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { getClientIp } from '@/modules/auth/client-ip';
import { GlobalLogoutService } from '@/modules/auth/global-logout.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/sessions
 * Get all active sessions for the current user
 */
async function getHandler(_req: NextRequest) {
  const tokenService = container.get(TokenService);
  const globalLogoutService = container.get(GlobalLogoutService);

  const accessToken = tokenService.getAccessToken(_req, { scope: 'user' });
  
  if (!accessToken) {
    return ApiResponse.error('Unauthorized', 401);
  }

  try {
    const payload = await tokenService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    const brand = (payload.brand ?? 'realtutorialhub') as 'skillup' | 'realtutorialhub';

    const sessions = await globalLogoutService.getActiveSessions(userId, brand);

    return ApiResponse.success({ sessions });
  } catch (error) {
    console.error('[GET /api/auth/sessions] Error:', error);
    return ApiResponse.error('Failed to fetch sessions', 500);
  }
}

/**
 * DELETE /api/auth/sessions
 * Logout from all devices (global logout)
 */
async function deleteHandler(_req: NextRequest) {
  const ip = getClientIp(_req);
  const tokenService = container.get(TokenService);
  const globalLogoutService = container.get(GlobalLogoutService);

  const accessToken = tokenService.getAccessToken(_req, { scope: 'user' });
  
  if (!accessToken) {
    return ApiResponse.error('Unauthorized', 401);
  }

  try {
    const payload = await tokenService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.nextUrl.hostname);
    const brand = requestHostname?.includes('skillup') ? 'skillup' : 'realtutorialhub';

    const result = await globalLogoutService.logoutAllDevices(userId, ip, brand);

    return ApiResponse.success(result);
  } catch (error) {
    console.error('[DELETE /api/auth/sessions] Error:', error);
    return ApiResponse.error('Failed to logout from all devices', 500);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withCorrelationId(withLogging(getHandler, { component: 'auth', operation: 'get_sessions' }));
export const DELETE = withCorrelationId(withLogging(deleteHandler, { component: 'auth', operation: 'global_logout' }));
