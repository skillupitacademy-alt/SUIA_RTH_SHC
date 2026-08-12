import { METRICS } from '@quiz/observability';
import type { NextRequest } from 'next/server';

import { forbidden, unauthorized } from '@/lib/api-error';
import { recordCounter, recordTimer } from '@/lib/metrics';
import { container } from '@/modules/core/container';

import { _verifyAdmin } from './rbac.service';
import { TokenService } from './token.service';

type Audience = 'admin' | 'infra' | 'shc-admin';

/**
 * Derive expected admin-facing audience from portal header.
 * Defaults to 'admin' to preserve existing behavior for legacy callers.
 */
export function getAdminAudience(_req: NextRequest): Audience {
  const portalIdentity = _req.headers.get('x-portal-identity') ?? 'admin';
  if (portalIdentity === 'shc-admin') return 'shc-admin';
  return portalIdentity === 'infrastructure' ? 'infra' : 'admin';
}

/**
 * Unified verifier for admin/factory/analytics-admin routes.
 * Enforces the correct audience while allowing both admin & infra roles.
 */
export async function verifyAdminOrInfraToken(_req: NextRequest, token?: string) {
  const startedAt = Date.now();
  const expectedAud = getAdminAudience(_req);
  const route = _req.nextUrl.pathname;
  const scopedToken = token ?? container.get(TokenService).getAccessToken(_req, { scope: 'admin' });

  if (scopedToken === undefined || scopedToken === null || scopedToken.trim() === '') {
    recordCounter(METRICS.AUTH.FAILURE, 1, { scope: expectedAud, route, reason: 'missing_token' });
    recordTimer(METRICS.AUTH.FAILURE + '.duration', Date.now() - startedAt, { scope: expectedAud, route, reason: 'missing_token' });
    throw unauthorized('Unauthorized');
  }

  try {
    const payload = await container.get(TokenService).verifyAdminAccessToken(scopedToken, { audience: expectedAud });
    recordCounter(METRICS.AUTH.LOGIN + '.verify', 1, { scope: expectedAud, route, outcome: 'success' });
    recordTimer(METRICS.AUTH.LOGIN + '.verify.duration', Date.now() - startedAt, { scope: expectedAud, route, outcome: 'success' });
    return { payload, audience: expectedAud };
  } catch (error) {
    recordCounter(METRICS.AUTH.FAILURE, 1, {
      scope: expectedAud,
      route,
      reason: error instanceof Error ? error.message : 'token_invalid',
    });
    recordTimer(METRICS.AUTH.FAILURE + '.duration', Date.now() - startedAt, {
      scope: expectedAud,
      route,
      reason: error instanceof Error ? error.message : 'token_invalid',
    });
    throw error;
  }
}

export async function requireAdminRouteAccess(_req: NextRequest) {
  const startedAt = Date.now();
  const route = _req.nextUrl.pathname;
  const { payload, audience } = await verifyAdminOrInfraToken(_req);

  if (audience === 'shc-admin') {
    const roles = Array.isArray(payload.roles) ? payload.roles.map((role) => role.toLowerCase()) : [];
    const hasSkillHubCoreAdminAccess =
      payload.brand === 'skillhubcore' &&
      payload.isAdmin === true &&
      (roles.includes('admin') || roles.includes('super_admin') || roles.includes('infrastructure'));

    if (!hasSkillHubCoreAdminAccess) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { scope: audience, route, reason: 'rbac_denied' });
      recordTimer(METRICS.AUTH.FAILURE + '.duration', Date.now() - startedAt, { scope: audience, route, reason: 'rbac_denied' });
      throw forbidden('SkillHubCore admin access only');
    }
  } else if (audience !== 'infra') {
    const hasAdminAccess = await _verifyAdmin(payload);
    if (!hasAdminAccess) {
      recordCounter(METRICS.AUTH.FAILURE, 1, { scope: audience, route, reason: 'rbac_denied' });
      recordTimer(METRICS.AUTH.FAILURE + '.duration', Date.now() - startedAt, { scope: audience, route, reason: 'rbac_denied' });
      throw forbidden('Admin access only');
    }
  }

  recordCounter(METRICS.AUTH.LOGIN + '.route_access', 1, { scope: audience, route, outcome: 'success' });
  recordTimer(METRICS.AUTH.LOGIN + '.route_access.duration', Date.now() - startedAt, { scope: audience, route, outcome: 'success' });
  return payload;
}
