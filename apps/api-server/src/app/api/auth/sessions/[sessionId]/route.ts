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
 * DELETE /api/auth/sessions/[sessionId]
 * Revoke a specific session (logout from specific device)
 */
async function deleteHandler(_req: NextRequest, { params }: { params: { sessionId: string } }) {
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

    const sessionId = params.sessionId;

    const result = await globalLogoutService.revokeSession(userId, sessionId, ip, brand);

    return ApiResponse.success(result);
  } catch (error) {
    console.error('[DELETE /api/auth/sessions/:id] Error:', error);
    return ApiResponse.error('Failed to revoke session', 500);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const DELETE = withCorrelationId(withLogging(deleteHandler, { component: 'auth', operation: 'revoke_session' }));
