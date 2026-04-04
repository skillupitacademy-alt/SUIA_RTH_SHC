import type { NextRequest } from 'next/server';

import { forbidden } from '@/lib/api-error';
import { container } from '@/modules/core/container';

import { _verifyAdmin } from './rbac.service';
import { TokenService } from './token.service';

type Audience = 'admin' | 'infra';

/**
 * Derive expected admin-facing audience from portal header.
 * Defaults to 'admin' to preserve existing behavior for legacy callers.
 */
export function getAdminAudience(_req: NextRequest): Audience {
  const portalIdentity = _req.headers.get('x-portal-identity') ?? 'admin';
  return portalIdentity === 'infrastructure' ? 'infra' : 'admin';
}

/**
 * Unified verifier for admin/factory/analytics-admin routes.
 * Enforces the correct audience while allowing both admin & infra roles.
 */
export async function verifyAdminOrInfraToken(_req: NextRequest, token?: string) {
  const expectedAud = getAdminAudience(_req);
  const scopedToken = token ?? container.get(TokenService).getAccessToken(_req, { scope: 'admin' });

  if (scopedToken === undefined || scopedToken === null || scopedToken.trim() === '') {
    throw new Error('Unauthorized');
  }

  const payload = await container.get(TokenService).verifyAdminAccessToken(scopedToken, { audience: expectedAud });
  return { payload, audience: expectedAud };
}

export async function requireAdminRouteAccess(_req: NextRequest) {
  const { payload, audience } = await verifyAdminOrInfraToken(_req);

  if (audience !== 'infra') {
    const hasAdminAccess = await _verifyAdmin(payload);
    if (!hasAdminAccess) {
      throw forbidden('Admin access only');
    }
  }

  return payload;
}
