import { describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import {
  extractAccessToken,
  extractPageTokenFromCookies,
  verifyAdminToken,
  evaluatePageAccess,
  evaluateServerCookiesPageAccess,
  EXPECTED_JWT_ISSUER,
  EXPECTED_JWT_ALGORITHM,
  EXPECTED_JWT_AUDIENCE,
} from '../server-page-auth';

describe('Server Page Auth — Token Verification, Claims & Reconciled Precedence', () => {
  const secretKey = new TextEncoder().encode(
    process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'test-admin-secret-at-least-32-chars-long!!'
  );
  const wrongKey = new TextEncoder().encode('completely-wrong-key-32-characters-long!!');

  async function createTestToken(overrides: Record<string, unknown> = {}, signKey = secretKey) {
    const payload: Record<string, unknown> = {
      sub: 'admin-uuid-1',
      originalUserId: 'admin-uuid-1',
      shadowUserId: 'admin-uuid-1',
      email: 'admin@skillhubcore.in',
      roles: ['admin'],
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: EXPECTED_JWT_AUDIENCE,
      iss: EXPECTED_JWT_ISSUER,
      isAdmin: true,
      ...overrides,
    };

    const alg = typeof overrides.alg === 'string' ? overrides.alg : 'HS256';
    let builder = new SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt();

    if (overrides.exp !== undefined) {
      if (typeof overrides.exp === 'number') {
        builder = builder.setExpirationTime(overrides.exp);
      }
    } else {
      builder = builder.setExpirationTime('2h');
    }

    if (overrides.nbf !== undefined && typeof overrides.nbf === 'number') {
      builder = builder.setNotBefore(overrides.nbf);
    }

    return builder.sign(signKey);
  }

  // --- Tasks 9 & 18: Reconciled Cookie Precedence ---
  describe('Cookie Selection Precedence & Reconciled Compatibility', () => {
    it('returns undefined when no cookies are provided', () => {
      expect(extractAccessToken(() => undefined)).toBeUndefined();
      expect(extractPageTokenFromCookies(() => undefined)).toEqual({ token: undefined, source: 'none' });
    });

    it('returns accessToken when only accessToken is present', () => {
      const getter = (name: string) => (name === 'accessToken' ? 'token-A' : undefined);
      expect(extractAccessToken(getter)).toBe('token-A');
      expect(extractPageTokenFromCookies(getter)).toEqual({ token: 'token-A', source: 'accessToken' });
    });

    it('falls back to admin_accessToken when accessToken is absent', () => {
      const getter = (name: string) => (name === 'admin_accessToken' ? 'token-B' : undefined);
      expect(extractAccessToken(getter)).toBe('token-B');
      expect(extractPageTokenFromCookies(getter)).toEqual({ token: 'token-B', source: 'admin_accessToken' });
    });

    it('falls back to admin_accessToken when accessToken is empty or whitespace (Task 9 reconciliation)', () => {
      const cookies: Record<string, string> = {
        accessToken: '   ',
        admin_accessToken: 'valid-admin-fallback',
      };
      const getter = (name: string) => cookies[name];
      // Empty string must fall back to admin_accessToken to match existing SHC API helper behavior
      expect(extractAccessToken(getter)).toBe('valid-admin-fallback');
      expect(extractPageTokenFromCookies(getter)).toEqual({ token: 'valid-admin-fallback', source: 'admin_accessToken' });
    });

    it('selects accessToken strictly when both non-empty cookies exist (even if accessToken is invalid)', () => {
      const cookies: Record<string, string> = {
        accessToken: 'malformed-or-invalid-token',
        admin_accessToken: 'valid-admin-token',
      };
      const getter = (name: string) => cookies[name];

      // Must select accessToken; must NOT fall back to admin_accessToken to avoid identity confusion
      expect(extractAccessToken(getter)).toBe('malformed-or-invalid-token');
      expect(extractPageTokenFromCookies(getter)).toEqual({ token: 'malformed-or-invalid-token', source: 'accessToken' });
    });

    it('supports cookie objects with .value property (Next.js ReadonlyRequestCookies format)', () => {
      const getter = (name: string) => (name === 'accessToken' ? { value: 'token-obj-val' } : undefined);
      expect(extractAccessToken(getter)).toBe('token-obj-val');
    });
  });

  // --- Tasks 10, 11 & 17: Token Issuer, Algorithm & Expiration Constraints ---
  describe('JWT Security Contract — Issuer, Algorithm, Expiration & Identity', () => {
    it('exposes pinned constants matching SHC architecture', () => {
      expect(EXPECTED_JWT_ISSUER).toBe('skillhubcore.in');
      expect(EXPECTED_JWT_ALGORITHM).toBe('HS256');
      expect(EXPECTED_JWT_AUDIENCE).toBe('shc-admin');
    });

    it('admits a valid token matching all contract requirements', async () => {
      const token = await createTestToken({ roles: ['admin'] });
      const verified = await verifyAdminToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.isAdmin).toBe(true);
      expect(verified?.userId).toBe('admin-uuid-1');

      const outcome = await evaluatePageAccess(token, '/dashboard');
      expect(outcome.status).toBe('AUTHORIZED');
      if (outcome.status === 'AUTHORIZED') {
        expect(outcome.user.userId).toBe('admin-uuid-1');
        expect(outcome.user.isAdmin).toBe(true);
        expect(outcome.user.roles).toContain('admin');
      }
    });

    it('rejects token with untrusted issuer (Task 11)', async () => {
      const untrustedIssuerToken = await createTestToken({ iss: 'untrusted-issuer.example.com' });
      const outcome = await evaluatePageAccess(untrustedIssuerToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
        expect(outcome.message).toContain('Untrusted token issuer');
      }
      expect(await verifyAdminToken(untrustedIssuerToken)).toBeNull();
    });

    it('rejects expired token with EXPIRED_TOKEN reason (Task 10)', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredToken = await createTestToken({ exp: now - 3600 });
      const outcome = await evaluatePageAccess(expiredToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('EXPIRED_TOKEN');
        expect(outcome.message).toContain('Session expired');
      }
      expect(await verifyAdminToken(expiredToken)).toBeNull();
    });

    it('rejects token with future not-before constraint (Task 10)', async () => {
      const now = Math.floor(Date.now() / 1000);
      const futureToken = await createTestToken({ nbf: now + 3600 });
      const outcome = await evaluatePageAccess(futureToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
      }
      expect(await verifyAdminToken(futureToken)).toBeNull();
    });

    it('rejects token signed with wrong secret key', async () => {
      const forgedToken = await createTestToken({}, wrongKey);
      const outcome = await evaluatePageAccess(forgedToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
      }
    });

    it('rejects token with audience other than shc-admin', async () => {
      const badAudToken = await createTestToken({ aud: 'user-portal' });
      const outcome = await evaluatePageAccess(badAudToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
      }
    });

    it('rejects token with brand other than skillhubcore', async () => {
      const badBrandToken = await createTestToken({ brand: 'realtutorialhub' });
      const outcome = await evaluatePageAccess(badBrandToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
      }
    });

    it('rejects user tokenType on admin portal', async () => {
      const userToken = await createTestToken({ tokenType: 'user' });
      const outcome = await evaluatePageAccess(userToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
      }
    });

    it('rejects token missing user identity claims', async () => {
      const noIdentityToken = await createTestToken({ sub: '', originalUserId: '', shadowUserId: '' });
      const outcome = await evaluatePageAccess(noIdentityToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
      }
    });
  });

  // --- Tasks 12 & 19: Granular RBAC and Role Boundaries ---
  describe('Granular Permissions & Role-Based Access Control', () => {
    it('admits super_admin across all protected pages (Task 12)', async () => {
      const token = await createTestToken({ roles: ['super_admin'] });
      expect((await evaluatePageAccess(token, '/dashboard')).status).toBe('AUTHORIZED');
      expect((await evaluatePageAccess(token, '/marketing')).status).toBe('AUTHORIZED');
      expect((await evaluatePageAccess(token, '/users')).status).toBe('AUTHORIZED');
      expect((await evaluatePageAccess(token, '/questions')).status).toBe('AUTHORIZED');
    });

    it('admits admin across standard and granular pages', async () => {
      const token = await createTestToken({ roles: ['admin'] });
      expect((await evaluatePageAccess(token, '/dashboard')).status).toBe('AUTHORIZED');
      expect((await evaluatePageAccess(token, '/marketing')).status).toBe('AUTHORIZED');
      expect((await evaluatePageAccess(token, '/users')).status).toBe('AUTHORIZED');
      expect((await evaluatePageAccess(token, '/questions')).status).toBe('AUTHORIZED');
    });

    it('denies learner/student role with FORBIDDEN', async () => {
      const studentToken = await createTestToken({ roles: ['student'] });
      const outcome = await evaluatePageAccess(studentToken, '/dashboard');

      expect(outcome.status).toBe('FORBIDDEN');
      if (outcome.status === 'FORBIDDEN') {
        expect(outcome.reason).toBe('FORBIDDEN_ROLE');
      }
    });

    it('denies faculty role with FORBIDDEN', async () => {
      const facultyToken = await createTestToken({ roles: ['faculty'] });
      const outcome = await evaluatePageAccess(facultyToken, '/dashboard');

      expect(outcome.status).toBe('FORBIDDEN');
      if (outcome.status === 'FORBIDDEN') {
        expect(outcome.reason).toBe('FORBIDDEN_ROLE');
      }
    });

    it('denies client-only infrastructure alias if not admin level', async () => {
      const infraToken = await createTestToken({ roles: ['infrastructure'] });
      const outcome = await evaluatePageAccess(infraToken, '/dashboard');

      expect(outcome.status).toBe('FORBIDDEN');
      if (outcome.status === 'FORBIDDEN') {
        expect(outcome.reason).toBe('FORBIDDEN_ROLE');
      }
    });
  });

  // --- Tasks 13 & 18: Server Component Cookie Store Adapter ---
  describe('evaluateServerCookiesPageAccess & Layout Path Matching', () => {
    it('evaluates access from a Server Component cookie store accurately', async () => {
      const validToken = await createTestToken({ roles: ['admin'] });
      const mockStore = {
        get: (name: string) => (name === 'accessToken' ? { value: validToken } : undefined),
      };

      const outcome = await evaluateServerCookiesPageAccess(mockStore, '/audit');
      expect(outcome.status).toBe('AUTHORIZED');
    });

    it('evaluates granular permissions with actual requested path (Task 13)', async () => {
      const validToken = await createTestToken({ roles: ['admin'] });
      const mockStore = {
        get: (name: string) => (name === 'accessToken' ? { value: validToken } : undefined),
      };

      // Layout evaluates actual paths
      expect((await evaluateServerCookiesPageAccess(mockStore, '/marketing')).status).toBe('AUTHORIZED');
      expect((await evaluateServerCookiesPageAccess(mockStore, '/users')).status).toBe('AUTHORIZED');
      expect((await evaluateServerCookiesPageAccess(mockStore, '/dashboard')).status).toBe('AUTHORIZED');
    });

    it('returns UNAUTHENTICATED when cookie store has no tokens', async () => {
      const emptyStore = { get: () => undefined };
      const outcome = await evaluateServerCookiesPageAccess(emptyStore, '/audit');
      expect(outcome.status).toBe('UNAUTHENTICATED');
    });
  });
});
