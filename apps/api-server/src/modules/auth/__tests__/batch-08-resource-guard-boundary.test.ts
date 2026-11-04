import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _verifyActiveAccount, _verifyAdmin } from '@/modules/auth/rbac.service';
import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { proxy } from '@/proxy';

/**
 * B08-D: Learner-to-Admin and Cross-Tenant Authorization Controls
 *
 * Governing Architecture: audit/FinalAechitecture.md (Administrative Route Guard, Strict Class Preconditions)
 * Governing Task: audit/W1.2_Gemini_Batch_08_Corrections_And_Containment_Task.md (Package D)
 *
 * Verifies:
 * 1. Valid tenant admin principal (matching audience, valid brand, admin claim) -> 200 / proxy forwards to next().
 * 2. Learner access token issued under same signing key (aud: 'user', tokenType: 'user', isAdmin: false) -> denied fail-closed (401).
 * 3. Contradictory / mixed claims:
 *    - aud: 'user' with tokenType: 'admin' -> denied fail-closed (401).
 *    - tokenType: 'admin' with isAdmin: false (isolated) -> denied fail-closed without DB access.
 * 4. Mixed audience array tests:
 *    - aud: ['admin', 'user'] -> denied fail-closed (forbidden audience contamination, zero DB access).
 *    - aud: ['admin', 'infra'] -> denied fail-closed (zero DB access).
 *    - aud: ['admin', 'internal'] -> permitted as valid internal admin.
 * 5. Two canonical conflicting tenant contexts ('skillup' vs 'realtutorialhub'):
 *    - User seeded strictly in 'skillup' evaluated against 'realtutorialhub' returns false fail-closed.
 *    - Tenant admin missing from target DB rejected with 403 Forbidden.
 * 6. Infrastructure / SHC administrative principal attempting to access tenant analytics route -> 403 Forbidden without DB lookup.
 * 7. Missing authorization header / missing cookie -> 401 Unauthorized without DB lookup.
 * 8. Downstream assertion: zero database queries executed on any authorization failure.
 */

const RESOURCE_GUARD_KEY = new TextEncoder().encode('b08d-resource-guard-disposable-key-32b!');
const guardTokenService = new TokenService(RESOURCE_GUARD_KEY, RESOURCE_GUARD_KEY, RESOURCE_GUARD_KEY);

const mockSelect = vi.fn();

// Separate stores for two canonical tenants
const tenantUserStores: Record<string, Map<string, { isBlocked: boolean }>> = {
  skillup: new Map(),
  realtutorialhub: new Map(),
};

vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn((brand: string) => {
    const store = tenantUserStores[brand] ?? new Map();
    return {
      db: {
        select: vi.fn(() => ({
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          where: vi.fn((clause: any) => {
            mockSelect();
            return {
              limit: vi.fn(async () => {
                let targetUserId: string | undefined;
                if (Array.isArray(clause?.queryChunks)) {
                  for (const chunk of clause.queryChunks) {
                    if (typeof chunk === 'string' && chunk !== ' = ' && !chunk.includes('.') && chunk.trim().length > 0) {
                      targetUserId = chunk.trim();
                      break;
                    }
                  }
                }
                if (typeof targetUserId === 'string' && store.has(targetUserId)) {
                  return [store.get(targetUserId)!];
                }
                return [];
              }),
            };
          }),
        })),
      },
      tables: {
        users: { id: `${brand}_users.id`, isBlocked: `${brand}_users.isBlocked` },
        userRoles: { userId: `${brand}_user_roles.userId`, roleId: `${brand}_user_roles.roleId` },
        roles: { id: `${brand}_roles.id`, name: `${brand}_roles.name` },
      },
    };
  }),
  shouldUseBrandBinding: vi.fn(() => true),
}));

describe('B08-D: Learner-to-Admin and Cross-Tenant Authorization Controls', () => {
  let previousTokenServiceInstance: TokenService | null = null;
  let previousContainerTokenService: any = null;

  beforeEach(() => {
    vi.clearAllMocks();
    tenantUserStores.skillup.clear();
    tenantUserStores.realtutorialhub.clear();

    try {
      previousTokenServiceInstance = TokenService.getInstance();
    } catch {
      previousTokenServiceInstance = null;
    }
    try {
      previousContainerTokenService = container.get(TokenService);
    } catch {
      previousContainerTokenService = null;
    }

    container.register(TokenService, guardTokenService);
    TokenService.setInstance(guardTokenService);

    // Seed legitimate RTH admin in realtutorialhub tenant store
    tenantUserStores.realtutorialhub.set('valid-rth-admin', { isBlocked: false });

    // Seed legitimate SUIA admin in skillup tenant store
    tenantUserStores.skillup.set('valid-suia-admin', { isBlocked: false });
  });

  afterEach(() => {
    if (previousTokenServiceInstance) {
      TokenService.setInstance(previousTokenServiceInstance);
    }
    if (previousContainerTokenService) {
      container.register(TokenService, previousContainerTokenService);
    }
    vi.restoreAllMocks();
  });

  async function createSignedToken(payload: {
    userId: string;
    brand: string;
    tokenType: 'admin' | 'user';
    aud: string | string[];
    roles?: string[];
    isAdmin?: boolean;
  }) {
    const isAdmin = payload.isAdmin ?? (payload.tokenType === 'admin');
    return guardTokenService.generateAccessToken({
      userId: payload.userId,
      originalUserId: payload.userId,
      shadowUserId: `shadow-${payload.userId}`,
      email: `${payload.userId}@example.test`,
      roles: payload.roles ?? (isAdmin ? ['admin'] : ['student']),
      brand: payload.brand as any,
      isAdmin,
      tokenType: payload.tokenType,
      aud: payload.aud as any,
    });
  }

  function createProxyRequest(options: {
    path: string;
    host?: string;
    portalIdentity?: string;
    token?: string;
  }): NextRequest {
    const headers = new Headers();
    if (options.token) {
      headers.set('authorization', `Bearer ${options.token}`);
    }
    if (options.portalIdentity) {
      headers.set('x-portal-identity', options.portalIdentity);
    }
    const host = options.host ?? 'realtutorialhub.test';
    headers.set('host', host);

    return new NextRequest(`https://${host}${options.path}`, {
      method: 'GET',
      headers,
    });
  }

  it('Case 1: Valid admin principal with matching audience, valid brand, and admin claim -> 200 forwarded', async () => {
    const adminToken = await createSignedToken({
      userId: 'valid-rth-admin',
      brand: 'realtutorialhub',
      tokenType: 'admin',
      aud: 'admin',
      isAdmin: true,
      roles: ['admin'],
    });

    const req = createProxyRequest({
      path: '/api/admin/courses',
      token: adminToken,
      portalIdentity: 'admin',
      host: 'realtutorialhub.test',
    });

    const res = await proxy(req);
    expect(res.status).toBe(200);
    expect(mockSelect).toHaveBeenCalled();
  });

  it('Case 2: Learner access token issued under same signing key requesting admin route -> 401/403 denied fail-closed', async () => {
    const learnerToken = await createSignedToken({
      userId: 'learner-elevation-attempt-1',
      brand: 'realtutorialhub',
      tokenType: 'user',
      aud: 'user',
      isAdmin: false,
      roles: ['student'],
    });

    const req = createProxyRequest({
      path: '/api/admin/system',
      token: learnerToken,
      portalIdentity: 'admin',
      host: 'realtutorialhub.test',
    });

    const res = await proxy(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid or expired token');

    // Downstream privileged database lookup must NOT have occurred
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('Case 3A: Contradictory claims (aud: user with tokenType: admin) -> denied fail-closed', async () => {
    const contradictoryToken = await createSignedToken({
      userId: 'contradictory-user-1',
      brand: 'realtutorialhub',
      tokenType: 'admin',
      aud: 'user',
      isAdmin: true,
    });

    const req = createProxyRequest({
      path: '/api/admin/system',
      token: contradictoryToken,
      portalIdentity: 'admin',
    });

    const res = await proxy(req);
    expect(res.status).toBe(401);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('Case 3B: Isolated tokenType admin with isAdmin false -> denied fail-closed without DB access', async () => {
    // Isolated check on tokenType === 'admin' but isAdmin === false
    const isAllowed = await _verifyAdmin({
      userId: 'admin-with-false-flag',
      brand: 'realtutorialhub',
      aud: 'admin',
      tokenType: 'admin', // Token type is admin
      isAdmin: false, // BUT boolean claim is false
    } as any);

    expect(isAllowed).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('Case 4: Mixed audience arrays tested against strict admin boundary', async () => {
    // A. Mixed ['admin', 'user'] must be rejected fail-closed
    const mixedUserAllowed = await _verifyAdmin({
      userId: 'mixed-admin-user',
      brand: 'realtutorialhub',
      aud: ['admin', 'user'],
      tokenType: 'admin',
      isAdmin: true,
    } as any);
    expect(mixedUserAllowed).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();

    // B. Mixed ['admin', 'infra'] must be rejected fail-closed
    const mixedInfraAllowed = await _verifyAdmin({
      userId: 'mixed-admin-infra',
      brand: 'realtutorialhub',
      aud: ['admin', 'infra'],
      tokenType: 'admin',
      isAdmin: true,
    } as any);
    expect(mixedInfraAllowed).toBe(false);
    expect(mockSelect).not.toHaveBeenCalled();

    // C. Legitimate internal admin ['admin', 'internal'] is permitted
    const internalAllowed = await _verifyAdmin({
      userId: 'valid-rth-admin',
      brand: 'realtutorialhub',
      aud: ['admin', 'internal'],
      tokenType: 'admin',
      isAdmin: true,
    } as any);
    expect(internalAllowed).toBe(true);
    expect(mockSelect).toHaveBeenCalled();
  });

  it('Case 5: Canonical conflicting tenant contexts (skillup vs realtutorialhub)', async () => {
    // 1. Cross-tenant eligibility check:
    // A user that exists strictly in 'skillup' evaluated against 'realtutorialhub'
    const suiaUserInRth = await _verifyActiveAccount('valid-suia-admin', 'realtutorialhub');
    // RealTutorialHub store has no entry for valid-suia-admin -> returns false fail-closed
    expect(suiaUserInRth).toBe(false);

    // 2. An admin user missing from tenant database is denied by proxy (403 Forbidden)
    const missingAdminToken = await createSignedToken({
      userId: 'ghost-admin-user',
      brand: 'realtutorialhub',
      tokenType: 'admin',
      aud: 'admin',
      isAdmin: true,
      roles: ['admin'],
    });

    const req = createProxyRequest({
      path: '/api/admin/users',
      token: missingAdminToken,
      portalIdentity: 'admin',
      host: 'realtutorialhub.test',
    });

    const res = await proxy(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Forbidden: Admin access only');
  });

  it('Case 6: Infrastructure / SHC administrative principal attempting to access tenant analytics route -> 403 Forbidden', async () => {
    const shcToken = await createSignedToken({
      userId: 'shc-governance-admin-1',
      brand: 'skillhubcore',
      tokenType: 'admin',
      aud: 'shc-admin',
      roles: ['admin'],
    });

    const req = createProxyRequest({
      path: '/api/analytics/admin/traffic',
      portalIdentity: 'shc-admin',
      token: shcToken,
      host: 'realtutorialhub.test',
    });

    const res = await proxy(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden: SkillHubCore admin access not permitted for tenant analytics');
    // Pre-database denial
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('Case 7: Missing authorization header / missing cookie -> 401 Unauthorized', async () => {
    const req = createProxyRequest({
      path: '/api/admin/users',
      portalIdentity: 'admin',
    });

    const res = await proxy(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Authentication required');
    expect(body.scope).toBe('admin');
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('signed tenant admin cannot use a conflicting canonical request tenant', async () => {
    const token = await createSignedToken({ userId: 'valid-rth-admin', brand: 'realtutorialhub', tokenType: 'admin', aud: 'admin', isAdmin: true, roles: ['admin'] });
    const req = createProxyRequest({ path: '/api/admin/courses', token, portalIdentity: 'admin', host: 'skillupitacademy.com' });
    req.headers.set('x-brand', 'skillup');
    const privilegedOperation = vi.fn();
    const gate = await proxy(req);
    if (gate.headers.get('x-middleware-next') === '1') {
      try {
        await requireAdminRouteAccess(req);
        privilegedOperation();
      } catch { /* Guard denial prevents the operation. */ }
    }
    expect.soft(gate.status).toBe(403);
    expect(privilegedOperation).not.toHaveBeenCalled();
  });
});
