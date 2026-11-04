import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { _verifyActiveAccount, _verifyAdmin } from '@/modules/auth/rbac.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { proxy } from '@/proxy';

/**
 * B08-D: Learner-to-Admin and Cross-Tenant Authorization Controls
 *
 * Governing Architecture: audit/FinalAechitecture.md (Administrative Route Guard, Strict Class Preconditions)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-D)
 *
 * Verifies:
 * 1. Valid tenant admin principal (matching audience, valid brand, admin claim) -> 200 / proxy forwards to next().
 * 2. Learner access token issued under same signing key (aud: 'user', tokenType: 'user', isAdmin: false) -> denied fail-closed (401/403).
 * 3. Token with contradictory / mixed claims (aud: 'user' with tokenType: 'admin', or aud: 'admin' with isAdmin: false) -> denied fail-closed.
 * 4. Token signed with foreign brand context attempting access against another tenant's route -> denied fail-closed.
 * 5. SHC administrative principal attempting to access tenant learner administrative route (/api/analytics/admin) -> 403 Forbidden without DB lookup.
 * 6. Missing authorization header / missing cookie -> 401 Unauthorized.
 */

const RESOURCE_GUARD_KEY = new TextEncoder().encode('b08d-resource-guard-disposable-key-32b!');
const guardTokenService = new TokenService(RESOURCE_GUARD_KEY, RESOURCE_GUARD_KEY, RESOURCE_GUARD_KEY);

const mockSelect = vi.fn();

vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn((brand: string) => ({
    db: { select: mockSelect },
    tables: {
      users: { id: `${brand}_users.id`, isBlocked: `${brand}_users.isBlocked` },
      userRoles: { userId: `${brand}_user_roles.userId`, roleId: `${brand}_user_roles.roleId` },
      roles: { id: `${brand}_roles.id`, name: `${brand}_roles.name` },
    },
  })),
  shouldUseBrandBinding: vi.fn(() => true),
}));

describe('B08-D: Learner-to-Admin and Cross-Tenant Authorization Controls', () => {
  const previousTokenService = container.get(TokenService);

  beforeEach(() => {
    vi.clearAllMocks();
    container.register(TokenService, guardTokenService);
    TokenService.setInstance(guardTokenService);

    // Default mock: active unblocked tenant user
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ isBlocked: false }]),
    } as any);
  });

  afterEach(() => {
    container.register(TokenService, previousTokenService);
    TokenService.setInstance(previousTokenService);
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
      userId: 'valid-tenant-admin-1',
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
    });

    const res = await proxy(req);
    // Learner token fails admin token verification (audience/key mismatch)
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid or expired token');
  });

  it('Case 3A: Contradictory claims (aud: user with tokenType: admin) -> denied fail-closed', async () => {
    const contradictoryToken = await createSignedToken({
      userId: 'contradictory-user-1',
      brand: 'realtutorialhub',
      tokenType: 'admin',
      aud: 'user', // Contradictory audience
      isAdmin: true,
    });

    const req = createProxyRequest({
      path: '/api/admin/system',
      token: contradictoryToken,
      portalIdentity: 'admin',
    });

    const res = await proxy(req);
    expect(res.status).toBe(401);
  });

  it('Case 3B: Contradictory claims (aud: admin with isAdmin: false) -> denied fail-closed', async () => {
    const contradictoryToken = await createSignedToken({
      userId: 'contradictory-user-2',
      brand: 'realtutorialhub',
      tokenType: 'user',
      aud: 'admin',
      isAdmin: false, // Contradictory admin boolean
    });

    const req = createProxyRequest({
      path: '/api/admin/system',
      token: contradictoryToken,
      portalIdentity: 'admin',
    });

    const res = await proxy(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Invalid or expired token');

    // TokenService verifyAdminAccessToken rejects due to mismatched tokenType
    await expect(
      guardTokenService.verifyAdminAccessToken(contradictoryToken, { audience: 'admin' })
    ).rejects.toThrow('Invalid admin token type');

    // Direct check on _verifyAdmin unit logic with mixed claims (tokenType admin but isAdmin false)
    const isAdminAllowed = await _verifyAdmin({
      userId: 'contradictory-admin-payload',
      brand: 'realtutorialhub',
      aud: 'admin',
      tokenType: 'admin',
      isAdmin: false, // Inconsistent
    } as any);
    expect(isAdminAllowed).toBe(false);
  });

  it('Case 4: Token signed with foreign brand context attempting access against another tenant route -> rejected', async () => {
    // Non-canonical / foreign brand
    const foreignBrandToken = await createSignedToken({
      userId: 'foreign-tenant-admin',
      brand: 'unauthorized-external-brand',
      tokenType: 'admin',
      aud: 'admin',
      isAdmin: true,
    });

    const payload = await guardTokenService.verifyAdminAccessToken(foreignBrandToken, { audience: 'admin' });
    const isAllowed = await _verifyAdmin(payload);
    expect(isAllowed).toBe(false);
    // Foreign brand must never trigger database lookup
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('Case 5: Infrastructure / SHC administrative principal attempting to access tenant analytics route -> 403 Forbidden', async () => {
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
    });

    const res = await proxy(req);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Forbidden: SkillHubCore admin access not permitted for tenant analytics');
    // Pre-database denial
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('Case 6: Missing authorization header / missing cookie -> 401 Unauthorized', async () => {
    const req = createProxyRequest({
      path: '/api/admin/users',
      portalIdentity: 'admin',
      // No token provided
    });

    const res = await proxy(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Authentication required');
    expect(body.scope).toBe('admin');
  });
});
