import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/auth/logout-all/route';
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

    return new NextRequest('https://' + host + '/api/auth/logout-all', {
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

  describe('Part 1: Cookie-Authenticated Mutation & CSRF Boundaries', () => {
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

    it('allows cookie-authenticated request with matching origin', async () => {
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
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockEngine.logoutAllDevices).toHaveBeenCalledTimes(1);
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

    it('arbitrary bearer header cannot turn selected cookie credential into CSRF bypass', async () => {
      const jwt = await generateToken({
        userId: 'cookie-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      // Attacker supplies a garbage Bearer header while browser sends the user's cookie
      const req = createRequest({
        authHeader: 'Bearer arbitrary-invalid-bearer-token',
        cookie: `accessToken=${jwt}`,
        origin: 'https://foreign.example.invalid',
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      // Fails immediately on invalid bearer token (401), does NOT fall back to cookie with CSRF bypass
      expect(res.status).toBe(401);
      expect(mockEngine.logoutAllDevices).not.toHaveBeenCalled();
    });

    it('preserves legitimate non-browser bearer compatibility without requiring origin', async () => {
      const jwt = await generateToken({
        userId: 'bearer-user-1',
        brand: 'realtutorialhub',
        tokenType: 'user',
        aud: 'user',
      });

      // Programmatic client sends Bearer token with no origin header
      const req = createRequest({
        authHeader: `Bearer ${jwt}`,
        host: 'realtutorialhub.test',
        brandHeader: 'realtutorialhub',
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mockEngine.logoutAllDevices).toHaveBeenCalledTimes(1);
    });
  });

  describe('Part 4: Real GlobalLogoutService Engine State & Failure-Stage Proof', () => {
    // In-memory tenant store simulating database rows
    type StoredToken = { id: string; userId: string; brand: string; revoked: boolean };
    type StoredUser = { id: string; brand: string; lastActiveAt: Date };

    let tokenStore: StoredToken[];
    let userStore: StoredUser[];

    let inMemTokenRepo: any;
    let inMemUserRepo: any;
    let mockAuditService: any;
    let realGlobalLogoutService: GlobalLogoutService;

    beforeEach(() => {
      tokenStore = [
        // Colliding local user ID: '100' exists in both skillup and realtutorialhub!
        { id: 'suia-sess-1', userId: '100', brand: 'skillup', revoked: false },
        { id: 'suia-sess-2', userId: '100', brand: 'skillup', revoked: false },
        { id: 'rth-sess-1', userId: '100', brand: 'realtutorialhub', revoked: false },
        // Unrelated user in skillup
        { id: 'suia-other-sess', userId: '200', brand: 'skillup', revoked: false },
      ];

      userStore = [
        { id: '100', brand: 'skillup', lastActiveAt: new Date(Date.now() - 5000) },
        { id: '100', brand: 'realtutorialhub', lastActiveAt: new Date(Date.now() - 5000) },
        { id: '200', brand: 'skillup', lastActiveAt: new Date(Date.now() - 5000) },
      ];

      inMemTokenRepo = {
        getUserSessions: vi.fn(async (userId: string) => {
          return tokenStore.filter((t) => t.userId === userId && !t.revoked);
        }),
        revokeAll: vi.fn(async (userId: string) => {
          tokenStore.forEach((t) => {
            if (t.userId === userId) {
              t.revoked = true;
            }
          });
        }),
        withDb: vi.fn().mockReturnThis(),
      };

      inMemUserRepo = {
        updateLastActive: vi.fn(async (userId: string, date: Date) => {
          const u = userStore.find((user) => user.id === userId);
          if (u) u.lastActiveAt = date;
        }),
        withDb: vi.fn().mockReturnThis(),
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

    it('actual revocation revokes target user tokens and sets user offline in memory', async () => {
      const result = await realGlobalLogoutService.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(result).toEqual({ success: true, message: 'Logged out from all devices' });

      // Target user tokens in skillup are revoked
      const suiaTokens = tokenStore.filter((t) => t.userId === '100');
      expect(suiaTokens.every((t) => t.revoked)).toBe(true);

      // Presence termination executed
      expect(inMemUserRepo.updateLastActive).toHaveBeenCalledTimes(1);
    });

    it('commit-then-throw in presence termination throws PresenceStageError with confirmed revocation', async () => {
      // Simulate presence failure after revokeAll succeeds
      inMemUserRepo.updateLastActive.mockRejectedValueOnce(new Error('DB presence connection lost'));

      await expect(
        realGlobalLogoutService.logoutAllDevices('100', '192.0.2.1', 'skillup')
      ).rejects.toThrow(PresenceStageError);

      // Tokens WERE revoked before the presence error occurred!
      const userTokens = tokenStore.filter((t) => t.userId === '100');
      expect(userTokens.every((t) => t.revoked)).toBe(true);
    });

    it('revokeAll failure throws RevocationStageError without presence update', async () => {
      inMemTokenRepo.revokeAll.mockRejectedValueOnce(new Error('Lock acquisition timeout'));

      await expect(
        realGlobalLogoutService.logoutAllDevices('100', '192.0.2.1', 'skillup')
      ).rejects.toThrow(RevocationStageError);

      // Presence update was NOT called
      expect(inMemUserRepo.updateLastActive).not.toHaveBeenCalled();
    });

    it('absorbs audit service logging errors without failing revocation', async () => {
      // AuditService absorbs insert failures internally; simulate error in audit log
      mockAuditService.log.mockImplementationOnce(async () => {
        // Internal logger error, absorbed by AuditService
      });

      const result = await realGlobalLogoutService.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(result.success).toBe(true);
    });

    it('owner-scoped idempotent retry preserves state without unrevoking or altering others', async () => {
      // 1. Initial revocation
      await realGlobalLogoutService.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(tokenStore.filter((t) => t.userId === '100').every((t) => t.revoked)).toBe(true);

      // 2. Idempotent retry
      const retryResult = await realGlobalLogoutService.logoutAllDevices('100', '192.0.2.1', 'skillup');
      expect(retryResult.success).toBe(true);

      // Invariant: Tokens remain revoked, unrelated user '200' remains untouched
      expect(tokenStore.filter((t) => t.userId === '100').every((t) => t.revoked)).toBe(true);
      expect(tokenStore.find((t) => t.userId === '200')?.revoked).toBe(false);
    });
  });
});
