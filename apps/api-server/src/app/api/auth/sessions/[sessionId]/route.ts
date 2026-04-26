import { createRBACUser, validateBrandOrThrow } from '@quiz/auth';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import { RBACService } from '@quiz/auth/rbac/rbac.service';
import type { Role } from '@quiz/auth/rbac/roles';
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
async function deleteHandler(_req: NextRequest, context: { params: Promise<{ sessionId: string }> }) {
  const ip = getClientIp(_req);
  const tokenService = container.get(TokenService);
  const globalLogoutService = container.get(GlobalLogoutService);

  const accessToken = tokenService.getAccessToken(_req, { scope: 'user' });
  
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return ApiResponse.error('Unauthorized', 401);
  }

  try {
    const payload = await tokenService.verifyAccessToken(accessToken);
    const userId = payload.userId;
    const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.nextUrl.hostname);
    const brand = (typeof requestHostname === 'string' && requestHostname.includes('skillup')) ? 'skillup' : 'realtutorialhub';

    // 🔐 BRAND VALIDATION (defense in depth)
    try {
      validateBrandOrThrow({ brand: payload.brand, userId: payload.userId }, _req);
    } catch (brandError) {
      console.error('[DELETE /api/auth/sessions/:id] Brand validation failed:', brandError);
      return ApiResponse.error({
        code: 'BRAND_MISMATCH',
        message: brandError instanceof Error ? brandError.message : 'Brand validation failed',
      }, 403);
    }

    // 🔐 RBAC CHECK
    const normalizedRoles = (Array.isArray(payload.roles) ? payload.roles : []).map(r => r.toLowerCase().trim()).filter((r): r is Role => r.length > 0);
    const rbacUser = createRBACUser({
      isAuthenticated: true,
      userId: payload.userId,
      originalUserId: payload.userId,
      shadowUserId: payload.userId,
      roles: normalizedRoles,
      brand: brand as 'realtutorialhub' | 'skillup',
      email: payload.email,
    });

    try {
      RBACService.requirePermission(rbacUser.roles, PERMISSIONS.PROFILE_WRITE);
      console.log('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/sessions/:id',
        method: 'DELETE',
        userId: userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_WRITE,
        result: 'GRANTED',
      }));
    } catch (rbacError) {
      console.warn('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/sessions/:id',
        method: 'DELETE',
        userId: userId.slice(0, 8),
        permission: PERMISSIONS.PROFILE_WRITE,
        result: 'DENIED',
        error: rbacError instanceof Error ? rbacError.message : 'Unknown',
      }));
      return ApiResponse.error({
        code: 'PERMISSION_DENIED',
        message: `Permission required: ${PERMISSIONS.PROFILE_WRITE}`,
      }, 403);
    }

    const params = await context.params;
    const sessionId = params.sessionId;

    const result = await globalLogoutService.revokeSession(userId, sessionId, ip, brand);

    if (typeof result === 'object' && result !== null) {
      return ApiResponse.success(result);
    }
    
    return ApiResponse.error('Session not found', 404);
  } catch (error) {
    console.error('[DELETE /api/auth/sessions/:id] Error:', error);
    return ApiResponse.error('Failed to revoke session', 500);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const DELETE = withCorrelationId(withLogging(deleteHandler, { component: 'auth', operation: 'revoke_session' }));
