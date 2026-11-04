import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { requireAdminRouteAccess } from '@/modules/auth/admin-audience.util';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';
import { proxy } from '@/proxy';

// Disposable keys for realistic cryptographic isolation
const PROXY_KEY = new TextEncoder().encode('admin-01-proxy-test-disposable-32b!');
const proxyTokenService = new TokenService(PROXY_KEY, PROXY_KEY, PROXY_KEY);

const mockSelect = vi.fn();

vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn(() => ({
    db: { select: mockSelect },
    tables: {
      users: { id: 'id', isBlocked: 'isBlocked' },
      userRoles: { userId: 'userId', roleId: 'roleId' },
      roles: { id: 'id', name: 'name' },
    },
  })),
  shouldUseBrandBinding: vi.fn(() => true),
}));

describe('ADMIN-01: API Proxy & Admin Audience Route-Guard Regression Matrix', () => {
  const previousTokenService = container.get(TokenService);

  beforeEach(() => {
    vi.clearAllMocks();
    container.register(TokenService, proxyTokenService);

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
    return proxyTokenService.generateAccessToken({
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
    headers.set('host', 'realtutorialhub.test');

    return new NextRequest(`https://realtutorialhub.test${options.path}`, {
      method: 'GET',
      headers,
    });
  }

  describe('Proxy Routing Branches across admin / factory / analytics', () => {
    it('SHC Admin on /api/analytics/admin is explicitly denied before tenant lookup', async () => {
      const shcToken = await createSignedToken({
        userId: 'shc-admin-1',
        brand: 'skillhubcore',
        tokenType: 'admin',
        aud: 'shc-admin',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/analytics/admin/summary',
        portalIdentity: 'shc-admin',
        token: shcToken,
      });

      const res = await proxy(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Forbidden: SkillHubCore admin access not permitted for tenant analytics');
      // Invariant: Zero tenant database lookups executed!
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('SHC Admin on /api/admin is permitted for SkillHubCore governance', async () => {
      const shcToken = await createSignedToken({
        userId: 'shc-admin-1',
        brand: 'skillhubcore',
        tokenType: 'admin',
        aud: 'shc-admin',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/admin/system',
        portalIdentity: 'shc-admin',
        token: shcToken,
      });

      const res = await proxy(req);
      // Status 200 / next() forwarding (not error response)
      expect(res.status).toBe(200);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('Infra on /api/admin preserves machine-identity compatibility without tenant lookup', async () => {
      const infraToken = await createSignedToken({
        userId: 'infra-machine-1',
        brand: 'realtutorialhub',
        tokenType: 'admin',
        aud: 'infra',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/admin/maintenance',
        portalIdentity: 'infrastructure',
        token: infraToken,
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
      // Invariant: Does NOT hit tenant users table
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it('Infra on /api/factory routes through permissions and requires active tenant record', async () => {
      const infraToken = await createSignedToken({
        userId: 'infra-worker-1',
        brand: 'realtutorialhub',
        tokenType: 'admin',
        aud: 'infra',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/factory/generate',
        portalIdentity: 'infrastructure',
        token: infraToken,
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
      // Invariant: _verifyActiveAccount called on tenant DB!
      expect(mockSelect).toHaveBeenCalled();
    });

    it('Infra on /api/factory denies when tenant record is blocked', async () => {
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isBlocked: true }]),
      } as any);

      const infraToken = await createSignedToken({
        userId: 'infra-worker-blocked',
        brand: 'realtutorialhub',
        tokenType: 'admin',
        aud: 'infra',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/factory/generate',
        portalIdentity: 'infrastructure',
        token: infraToken,
      });

      const res = await proxy(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Forbidden: Tenant account is inactive or missing');
    });

    it('Infra on /api/factory denies when tenant record is missing', async () => {
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      const infraToken = await createSignedToken({
        userId: 'infra-worker-missing',
        brand: 'realtutorialhub',
        tokenType: 'admin',
        aud: 'infra',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/factory/generate',
        portalIdentity: 'infrastructure',
        token: infraToken,
      });

      const res = await proxy(req);
      expect(res.status).toBe(403);
    });

    it('Tenant admin with missing x-portal-identity preserves path-based compatibility', async () => {
      const adminToken = await createSignedToken({
        userId: 'admin-path-compat',
        brand: 'realtutorialhub',
        tokenType: 'admin',
        aud: 'admin',
        roles: ['admin'],
      });

      // Missing x-portal-identity header
      const req = createProxyRequest({
        path: '/api/admin/courses',
        token: adminToken,
      });

      const res = await proxy(req);
      expect(res.status).toBe(200);
      expect(mockSelect).toHaveBeenCalled();
    });

    it('Learner token on administrative route is rejected by proxy', async () => {
      const learnerToken = await createSignedToken({
        userId: 'learner-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
        roles: ['student'],
      });

      const req = createProxyRequest({
        path: '/api/admin/settings',
        portalIdentity: 'admin',
        token: learnerToken,
      });

      const res = await proxy(req);
      // Fails verification against expectedAudience: 'admin'
      expect(res.status).toBe(401);
    });
  });

  describe('admin-audience.util.ts: requireAdminRouteAccess integration', () => {
    it('denies SHC admin on /api/analytics/admin via requireAdminRouteAccess', async () => {
      const shcToken = await createSignedToken({
        userId: 'shc-admin-util',
        brand: 'skillhubcore',
        tokenType: 'admin',
        aud: 'shc-admin',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/analytics/admin/heatmap',
        portalIdentity: 'shc-admin',
        token: shcToken,
      });

      await expect(requireAdminRouteAccess(req)).rejects.toThrow(
        'SkillHubCore admin access not permitted for tenant analytics'
      );
    });

    it('requires active tenant account for infra caller on /api/factory', async () => {
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ isBlocked: true }]),
      } as any);

      const infraToken = await createSignedToken({
        userId: 'infra-blocked-util',
        brand: 'realtutorialhub',
        tokenType: 'admin',
        aud: 'infra',
        roles: ['admin'],
      });

      const req = createProxyRequest({
        path: '/api/factory/build',
        portalIdentity: 'infrastructure',
        token: infraToken,
      });

      await expect(requireAdminRouteAccess(req)).rejects.toThrow(
        'Forbidden: Tenant account is inactive or missing'
      );
    });
  });
});
