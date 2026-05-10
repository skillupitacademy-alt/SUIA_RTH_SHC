import { createRBACUser, validateBrandOrThrow } from '@quiz/auth';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import { RBACService } from '@quiz/auth/rbac/rbac.service';
import type { Role } from '@quiz/auth/rbac/roles';
import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import type { RequestBrand } from '@/lib/request-brand';
import { resolveRequestHostnameFromHeaders } from '@/lib/request-brand';
import { withLogging } from '@/lib/withLogging';
import { withObservability } from '@/middleware/observability.middleware';
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
  
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return ApiResponse.error('Unauthorized', 401);
  }

  try {
    const payload = await tokenService.verifyAccessToken(accessToken);
    // CRITICAL: Use the original user ID (not shadow) for session operations
    const userId = payload.userId; // This is the original user ID used for storing tokens
    const brand = (typeof payload.brand === 'string' && payload.brand.length > 0 ? payload.brand : 'realtutorialhub') as RequestBrand;

    // 🔐 BRAND VALIDATION (defense in depth)
    try {
      validateBrandOrThrow({ brand: payload.brand, userId: payload.userId }, _req);
    } catch (brandError) {
      console.error('[GET /api/auth/sessions] Brand validation failed:', brandError);
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
      brand: (brand === 'skillup' ? 'skillup' : 'realtutorialhub') as 'realtutorialhub' | 'skillup',
      email: payload.email,
    });

    try {
      RBACService.requirePermission(rbacUser.roles, PERMISSIONS.PROFILE_READ);
      console.log('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/sessions',
        method: 'GET',
        userId: userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_READ,
        result: 'GRANTED',
      }));
    } catch (rbacError) {
      console.warn('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/sessions',
        method: 'GET',
        userId: userId.slice(0, 8),
        permission: PERMISSIONS.PROFILE_READ,
        result: 'DENIED',
        error: rbacError instanceof Error ? rbacError.message : 'Unknown',
      }));
      return ApiResponse.error({
        code: 'PERMISSION_DENIED',
        message: `Permission required: ${PERMISSIONS.PROFILE_READ}`,
      }, 403);
    }

    // 🔥 CRITICAL: Extract current device ID from request headers
    const currentDeviceId = _req.headers.get('x-device-id') ?? undefined;

    const sessions = await globalLogoutService.getActiveSessions(userId, brand, currentDeviceId);

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
  
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    return ApiResponse.error('Unauthorized', 401);
  }

  try {
    const payload = await tokenService.verifyAccessToken(accessToken);
    // CRITICAL: Use the original user ID (not shadow) for session operations
    const userId = payload.userId; // This is the original user ID used for storing tokens
    const requestHostname = resolveRequestHostnameFromHeaders(_req.headers, _req.nextUrl.hostname);
    const brand = (typeof requestHostname === 'string' && requestHostname.includes('skillup')) ? 'skillup' : (typeof requestHostname === 'string' && requestHostname.includes('skillhubcore')) ? 'skillhubcore' : 'realtutorialhub';

    // 🔐 BRAND VALIDATION (defense in depth)
    try {
      validateBrandOrThrow({ brand: payload.brand, userId: payload.userId }, _req);
    } catch (brandError) {
      console.error('[DELETE /api/auth/sessions] Brand validation failed:', brandError);
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
      brand: (brand === 'skillup' ? 'skillup' : 'realtutorialhub') as 'realtutorialhub' | 'skillup',
      email: payload.email,
    });

    try {
      RBACService.requirePermission(rbacUser.roles, PERMISSIONS.PROFILE_WRITE);
      console.log('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/sessions',
        method: 'DELETE',
        userId: userId.slice(0, 8),
        roles: rbacUser.roles,
        permission: PERMISSIONS.PROFILE_WRITE,
        result: 'GRANTED',
      }));
    } catch (rbacError) {
      console.warn('🔐 RBAC_AUDIT', JSON.stringify({
        route: '/api/auth/sessions',
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

    const result = await globalLogoutService.logoutAllDevices(userId, ip, brand);

    return ApiResponse.success(result);
  } catch (error) {
    console.error('[DELETE /api/auth/sessions] Error:', error);
    return ApiResponse.error('Failed to logout from all devices', 500);
  }
}

import { withCorrelationId } from '@/lib/correlation-id.middleware';

export const GET = withObservability(withCorrelationId(withLogging(getHandler, { component: 'auth', operation: 'get_sessions' })));
export const DELETE = withObservability(withCorrelationId(withLogging(deleteHandler, { component: 'auth', operation: 'global_logout' })));
