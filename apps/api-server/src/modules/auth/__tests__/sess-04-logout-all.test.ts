import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/auth/logout-all/route';
import { AuditService } from '@/modules/auth/audit.service';
import {
  GlobalLogoutService,
  PresenceStageError,
  RevocationStageError,
} from '@/modules/auth/global-logout.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

// Disposable keys for realistic cryptographic isolation
const DISPOSABLE_KEY = new TextEncoder().encode('sess-04-disposable-key-32-bytes!');
const realTokenService = new TokenService(DISPOSABLE_KEY, DISPOSABLE_KEY, DISPOSABLE_KEY);

describe('SESS-04: Legacy Logout-All Adapter & Real Engine State (Offline Matrix)', () => {
  const previousTokenService = container.get(TokenService);
  const previousGlobalLogout = container.get(GlobalLogoutService);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    container.register(TokenService, previousTokenService);
    container.register(GlobalLogoutService, previousGlobalLogout);
    vi.restoreAllMocks();
  });

  async function generateToken(payload: {
    userId: string;
    brand: string;
    tokenType: 'user' | 'admin';
    aud: string | string[];
    roles?: string[];
  }) {
    const isAdmin = payload.tokenType === 'admin';
    return realTokenService.generateAccessToken({
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

  function createRequest(options?: {
    authHeader?: string;
    cookie?: string;
    origin?: string;
    host?: string;
    protocol?: string;
    brandHeader?: string;
  }): NextRequest {
    const headers = new Headers();
    if (options?.authHeader) {
      headers.set('authorization', options.authHeader);
    }
    if (options?.cookie) {
      headers.set('cookie', options.cookie);
    }
    if (options?.origin) {
      headers.set('origin', options.origin);
    }
    const host = options?.host ?? 'skillup.test';
    headers.set('host', host);
    headers.set('x-brand', options?.brandHeader ?? 'skillup');

    const protocol = options?.protocol ?? 'https:';
    return new NextRequest(`${protocol}//${host}/api/auth/logout-all`, {
      method: 'POST',
      headers,
    });
  }

  describe('Part 1: Audience & Class Boundary Controls', () => {
    let mockEngine: {
      getActiveSessions: ReturnType<typeof vi.fn>;
      logoutAllDevices: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockEngine = {
        getActiveSessions: vi.fn(async () => [{ id: 'sess-1' }]),
        logoutAllDevices: vi.fn(async () => ({ success: true, message: 'Logged out from all devices' })),
      };
      container.register(TokenService, realTokenService);
      container.register(GlobalLogoutService, mockEngine as any);
    });

    it('permits valid user token with aud:user and reaches revocation engine', async () => {
      const jwt = await generateToken({
        userId: 'u1',
        brand: 'skillup',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'skillup.test',
        brandHeader: 'skillup',
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.revokedSessions).toBe(1);
      expect(mockEngine.logoutAllDevices).toHaveBeenCalledTimes(1);
      expect(mockEngine.logoutAllDevices).toHaveBeenCalledWith('u1', expect.any(String), 'skillup');
    });

    it('permits valid admin token with aud:admin and reaches revocation engine', async () => {
      const jwt = await generateToken({
        userId: 'admin-1',
        brand: 'skillup',
        tokenType: 'admin',
        aud: 'admin',
      });

      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'skillup.test',
        brandHeader: 'skillup',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockEngine.logoutAllDevices).toHaveBeenCalledTimes(1);
    });

    it('permits admin token with audience array containing admin', async () => {
      const jwt = await generateToken({
        userId: 'admin-1',
        brand: 'skillup',
        tokenType: 'admin',
        aud: ['admin', 'internal'],
      });

      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'skillup.test',
        brandHeader: 'skillup',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
    });

    it('rejects infra-audience token even though tokenType is admin', async () => {
      const jwt = await generateToken({
        userId: 'infra-1',
        brand: 'skillup',
        tokenType: 'admin',
        aud: 'infra',
      });

      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'skillup.test',
        brandHeader: 'skillup',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.getActiveSessions).not.toHaveBeenCalled();
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('rejects shc-admin audience token', async () => {
      const jwt = await generateToken({
        userId: 'shc-1',
        brand: 'skillup',
        tokenType: 'admin',
        aud: 'shc-admin',
      });

      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'skillup.test',
        brandHeader: 'skillup',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('rejects contradictory audience/class pairing (tokenType:user with aud:admin)', async () => {
      const jwt = await generateToken({
        userId: 'u1',
        brand: 'skillup',
        tokenType: 'user',
        aud: 'admin',
      });

      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'skillup.test',
        brandHeader: 'skillup',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });
  });

  describe('Part 2: Cookie-Authenticated Exact Origin & Credential Selection', () => {
    let mockEngine: {
      getActiveSessions: ReturnType<typeof vi.fn>;
      logoutAllDevices: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockEngine = {
        getActiveSessions: vi.fn(async () => [{ id: 'sess-1' }]),
        logoutAllDevices: vi.fn(async () => ({ success: true, message: 'Logged out from all devices' })),
      };
      container.register(TokenService, realTokenService);
      container.register(GlobalLogoutService, mockEngine as any);
    });

    it('allows cookie-authenticated request with exact same-origin match', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        origin: 'https://realtutorialhub.test',
        host: 'realtutorialhub.test',
        protocol: 'https:',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockEngine.logoutAllDevices).toHaveBeenCalledTimes(1);
    });

    it('denies cookie-authenticated request with mismatched scheme', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      // Request is http, origin is https
      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        origin: 'https://realtutorialhub.localhost:3003',
        host: 'realtutorialhub.localhost:3003',
        protocol: 'http:',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('denies cookie-authenticated request with mismatched port', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        origin: 'http://localhost:3001',
        host: 'localhost:3003',
        protocol: 'http:',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('denies cookie-authenticated request from another tenant origin', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        origin: 'https://skillup.test',
        host: 'realtutorialhub.localhost:3003',
        protocol: 'http:',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('denies cookie-authenticated request with foreign origin', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        origin: 'https://foreign.example.invalid',
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('denies cookie-authenticated request with deceptive substring host origin', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        origin: 'https://realtutorialhub.test.attacker.com',
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('denies cookie-authenticated request with userinfo in origin', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        origin: 'https://attacker:secret@realtutorialhub.test',
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('denies cookie-authenticated request with missing origin header', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('authoritative cookie credential cannot be displaced by bearer to bypass foreign origin check', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      // Browser sends cookie while attacker injects Bearer header and foreign origin
      const req = createRequest({
        cookie: `accessToken=${jwt}`,
        authHeader: `Bearer ${jwt}`,
        origin: 'https://foreign.example.invalid',
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('preserves legitimate non-browser bearer compatibility without requiring origin', async () => {
      const jwt = await generateToken({
        userId: 'bearer-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      // Programmatic client sends Bearer token with no cookie and no origin header
      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockEngine.logoutAllDevices).toHaveBeenCalledTimes(1);
    });

    it('pure bearer caller with invalid token fails fast without cookie fallback', async () => {
      const req = createRequest({
        authHeader: 'Bearer completely-invalid-jwt-token',
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });
  });

  describe('Part 3: Real GlobalLogoutService Engine State & Tenant Partitioning', () => {
    type StoredToken = { id: string; userId: string; brand: string; revoked: boolean };
    type StoredUser = { id: string; brand: string; lastActiveAt: Date };

    // Tenant-partitioned independent stores
    let tokenStores: Record<string, StoredToken[]>;
    let userStores: Record<string, StoredUser[]>;

    let inMemTokenRepo: any;
    let inMemUserRepo: any;
    let mockAuditService: any;
    let realGlobalLogoutService: GlobalLogoutService;

    beforeEach(() => {
      tokenStores = {
        skillup: [
          { id: 'suia-sess-1', userId: '100', brand: 'skillup', revoked: false },
          { id: 'suia-sess-2', userId: '100', brand: 'skillup', revoked: false },
          { id: 'suia-other-sess', userId: '200', brand: 'skillup', revoked: false },
        ],
        realtutorialhub: [
          // Colliding local user ID: '100' in RTH!
          { id: 'rth-sess-1', userId: '100', brand: 'realtutorialhub', revoked: false },
          { id: 'rth-other-sess', userId: '300', brand: 'realtutorialhub', revoked: false },
        ],
      };

      userStores = {
        skillup: [
          { id: '100', brand: 'skillup', lastActiveAt: new Date(Date.now() - 5000) },
          { id: '200', brand: 'skillup', lastActiveAt: new Date(Date.now() - 5000) },
        ],
        realtutorialhub: [
          { id: '100', brand: 'realtutorialhub', lastActiveAt: new Date(Date.now() - 5000) },
          { id: '300', brand: 'realtutorialhub', lastActiveAt: new Date(Date.now() - 5000) },
        ],
      };

      // Create brand-bound repository adapters
      function createBrandBoundTokenRepo(brand: string) {
        return {
          _boundBrand: brand,
          getUserSessions: vi.fn(async (userId: string) => {
            return (tokenStores[brand] ?? []).filter((t) => t.userId === userId && !t.revoked);
          }),
          revokeAll: vi.fn(async (userId: string) => {
            (tokenStores[brand] ?? []).forEach((t) => {
              if (t.userId === userId) {
                t.revoked = true;
              }
            });
          }),
        };
      }

      function createBrandBoundUserRepo(brand: string) {
        return {
          _boundBrand: brand,
          updateLastActive: vi.fn(async (userId: string, date: Date) => {
            const u = (userStores[brand] ?? []).find((user) => user.id === userId);
            if (u) u.lastActiveAt = date;
          }),
        };
      }

      inMemTokenRepo = {
        withDb: vi.fn((db: any) => {
          const brand = db?._brand ?? 'realtutorialhub';
          return createBrandBoundTokenRepo(brand);
        }),
        // Default un-bound fallback
        getUserSessions: vi.fn(async (userId: string) => {
          return (tokenStores['realtutorialhub'] ?? []).filter((t) => t.userId === userId && !t.revoked);
        }),
        revokeAll: vi.fn(async (userId: string) => {
          (tokenStores['realtutorialhub'] ?? []).forEach((t) => {
            if (t.userId === userId) {
              t.revoked = true;
            }
          });
        }),
      };

      inMemUserRepo = {
        withDb: vi.fn((db: any) => {
          const brand = db?._brand ?? 'realtutorialhub';
          return createBrandBoundUserRepo(brand);
        }),
        updateLastActive: vi.fn(async (userId: string, date: Date) => {
          const u = (userStores['realtutorialhub'] ?? []).find((user) => user.id === userId);
          if (u) u.lastActiveAt = date;
        }),
      };

      mockAuditService = {
        log: vi.fn(async () => {}),
      };

      realGlobalLogoutService = new GlobalLogoutService(
        inMemTokenRepo,
        inMemUserRepo,
        mockAuditService
      );
    });

    it('Sol tenant canary: skillup revocation leaves colliding RTH rows untouched', async () => {
      // Mock brand binding to simulate realistic multi-tenant routing
      const brandContextSkillUp = {
        db: { _brand: 'skillup' },
        tables: { refreshTokens: {}, users: {} },
      };

      // Directly call brand-bound adapter for skillup
      const boundTokenRepo = inMemTokenRepo.withDb(brandContextSkillUp.db);
      const boundUserRepo = inMemUserRepo.withDb(brandContextSkillUp.db);
      const tenantService = new GlobalLogoutService(boundTokenRepo, boundUserRepo, mockAuditService);

      const result = await tenantService.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(result.success).toBe(true);

      // Invariant 1: skillup tokens for user 100 are revoked
      expect(tokenStores['skillup'].filter((t) => t.userId === '100').every((t) => t.revoked)).toBe(true);

      // Invariant 2: RTH tokens for user 100 remain completely untouched!
      expect(tokenStores['realtutorialhub'].find((t) => t.id === 'rth-sess-1')?.revoked).toBe(false);

      // Invariant 3: Unrelated user 200 in skillup remains untouched
      expect(tokenStores['skillup'].find((t) => t.id === 'suia-other-sess')?.revoked).toBe(false);
    });

    it('wrong-store sensitivity control: wrong store selection is detected and fails invariant', async () => {
      // If incorrectly bound to realtutorialhub during a skillup invocation
      const wrongBoundTokenRepo = inMemTokenRepo.withDb({ _brand: 'realtutorialhub' });
      const wrongBoundUserRepo = inMemUserRepo.withDb({ _brand: 'realtutorialhub' });
      const wrongService = new GlobalLogoutService(wrongBoundTokenRepo, wrongBoundUserRepo, mockAuditService);

      // Call service with wrong binding
      await wrongService.logoutAllDevices('100', '192.0.2.1', 'realtutorialhub');

      // The wrong store's rows were modified, and the intended store was not touched
      expect(tokenStores['realtutorialhub'].find((t) => t.id === 'rth-sess-1')?.revoked).toBe(true);
      expect(tokenStores['skillup'].filter((t) => t.userId === '100').every((t) => !t.revoked)).toBe(true);
    });

    it('commit-then-throw in revokeAll throws RevocationStageError and retains committed store mutation', async () => {
      const throwingTokenRepo = {
        getUserSessions: vi.fn(async () => tokenStores['skillup']),
        revokeAll: vi.fn(async (userId: string) => {
          // Mutate the store first
          tokenStores['skillup'].forEach((t) => {
            if (t.userId === userId) {
              t.revoked = true;
            }
          });
          // Then throw error
          throw new Error('Database transaction timeout during commit');
        }),
      };

      const failingService = new GlobalLogoutService(
        throwingTokenRepo as any,
        inMemUserRepo,
        mockAuditService
      );

      await expect(
        failingService.logoutAllDevices('100', '192.0.2.1', 'skillup')
      ).rejects.toThrow(RevocationStageError);

      // Tokens were committed-revoked in store despite the error
      expect(tokenStores['skillup'].filter((t) => t.userId === '100').every((t) => t.revoked)).toBe(true);
      // Presence was NOT updated
      expect(inMemUserRepo.updateLastActive).not.toHaveBeenCalled();
    });

    it('presence failure after successful revocation throws PresenceStageError with tokens revoked', async () => {
      const boundTokenRepo = inMemTokenRepo.withDb({ _brand: 'skillup' });
      const failingUserRepo = {
        updateLastActive: vi.fn().mockRejectedValue(new Error('Connection reset by peer')),
      };

      const failingPresenceService = new GlobalLogoutService(
        boundTokenRepo,
        failingUserRepo as any,
        mockAuditService
      );

      await expect(
        failingPresenceService.logoutAllDevices('100', '192.0.2.1', 'skillup')
      ).rejects.toThrow(PresenceStageError);

      // Tokens were successfully revoked
      expect(tokenStores['skillup'].filter((t) => t.userId === '100').every((t) => t.revoked)).toBe(true);
    });

    it('real AuditService absorbs database insert failures without failing global logout', async () => {
      const boundTokenRepo = inMemTokenRepo.withDb({ _brand: 'skillup' });
      const boundUserRepo = inMemUserRepo.withDb({ _brand: 'skillup' });

      // Real AuditService instance with failing database client
      const throwingDbClient = {
        insert: vi.fn(() => ({
          values: vi.fn().mockRejectedValue(new Error('Audit table constraint violation')),
        })),
      };

      const realAuditService = new AuditService(throwingDbClient as any);
      const serviceWithRealAudit = new GlobalLogoutService(
        boundTokenRepo,
        boundUserRepo,
        realAuditService
      );

      const result = await serviceWithRealAudit.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(result.success).toBe(true);
      expect(throwingDbClient.insert).toHaveBeenCalledTimes(1);
    });

    it('owner-scoped idempotent retry preserves state without unrevoking or altering foreign tenant', async () => {
      const boundTokenRepo = inMemTokenRepo.withDb({ _brand: 'skillup' });
      const boundUserRepo = inMemUserRepo.withDb({ _brand: 'skillup' });
      const tenantService = new GlobalLogoutService(boundTokenRepo, boundUserRepo, mockAuditService);

      // 1. Initial revocation
      const firstResult = await tenantService.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(firstResult.success).toBe(true);

      // 2. Idempotent retry
      const retryResult = await tenantService.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(retryResult.success).toBe(true);

      // Tokens remain revoked
      expect(tokenStores['skillup'].filter((t) => t.userId === '100').every((t) => t.revoked)).toBe(true);
      // Colliding RTH tokens remain untouched
      expect(tokenStores['realtutorialhub'].find((t) => t.id === 'rth-sess-1')?.revoked).toBe(false);
      // Active sessions count is 0
      const activeSessions = await tenantService.getActiveSessions('100', 'skillup');
      expect(activeSessions.length).toBe(0);
    });
  });
});
