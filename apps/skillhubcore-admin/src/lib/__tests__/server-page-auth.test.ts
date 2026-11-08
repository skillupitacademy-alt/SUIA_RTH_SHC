import { describe, expect, it } from 'vitest';
import { SignJWT } from 'jose';
import {
  extractAccessToken,
  verifyAdminToken,
  evaluatePageAccess,
  evaluateServerCookiesPageAccess,
} from '../server-page-auth';

describe('Server Page Auth — Token Verification, Claims & Cookie Precedence', () => {
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
      aud: 'shc-admin',
      iss: 'skillhubcore.in',
      isAdmin: true,
      ...overrides,
    };

    let builder = new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
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

  // --- Task 21: Cookie Selection and Precedence ---
  describe('Cookie Selection Precedence & Conflicts', () => {
    it('returns undefined when no cookies are provided', () => {
      expect(extractAccessToken(() => undefined)).toBeUndefined();
    });

    it('returns accessToken when only accessToken is present', () => {
      const getter = (name: string) => (name === 'accessToken' ? 'token-A' : undefined);
      expect(extractAccessToken(getter)).toBe('token-A');
    });

    it('falls back to admin_accessToken when accessToken is absent', () => {
      const getter = (name: string) => (name === 'admin_accessToken' ? 'token-B' : undefined);
      expect(extractAccessToken(getter)).toBe('token-B');
    });

    it('selects accessToken strictly when both cookies exist (even if accessToken is malformed)', () => {
      const cookies: Record<string, string> = {
        accessToken: 'malformed-or-invalid-token',
        admin_accessToken: 'valid-admin-token',
      };
      const getter = (name: string) => cookies[name];

      // Must select accessToken; must NOT fall back to admin_accessToken to avoid identity conflict
      expect(extractAccessToken(getter)).toBe('malformed-or-invalid-token');
    });

    it('supports cookie objects with .value property (Next.js ReadonlyRequestCookies format)', () => {
      const getter = (name: string) => (name === 'accessToken' ? { value: 'token-obj-val' } : undefined);
      expect(extractAccessToken(getter)).toBe('token-obj-val');
    });
  });

  // --- Task 18: Valid Administrator Tokens ---
  describe('Valid Admin & Super Admin Admission', () => {
    it('admits a valid admin token for general protected pages', async () => {
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

    it('admits a valid super_admin token with wildcard access', async () => {
      const token = await createTestToken({ roles: ['super_admin'] });
      const outcome = await evaluatePageAccess(token, '/users');

      expect(outcome.status).toBe('AUTHORIZED');
      if (outcome.status === 'AUTHORIZED') {
        expect(outcome.user.roles).toContain('super_admin');
        expect(outcome.user.isAdmin).toBe(true);
      }
    });

    it('admits mixed roles containing an admin role', async () => {
      const token = await createTestToken({ roles: ['student', 'admin'] });
      const outcome = await evaluatePageAccess(token, '/questions');

      expect(outcome.status).toBe('AUTHORIZED');
      if (outcome.status === 'AUTHORIZED') {
        expect(outcome.user.isAdmin).toBe(true);
      }
    });
  });

  // --- Task 19: Invalid Credentials & Cryptographic Verification ---
  describe('Invalid, Forged & Tampered Token Rejection', () => {
    it('rejects missing or empty token with UNAUTHENTICATED', async () => {
      const outcome = await evaluatePageAccess(undefined, '/dashboard');
      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('MISSING_TOKEN');
      }
    });

    it('rejects forged token signed with wrong secret key', async () => {
      const forgedToken = await createTestToken({}, wrongKey);
      const outcome = await evaluatePageAccess(forgedToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('INVALID_TOKEN');
      }
    });

    it('rejects expired token with EXPIRED_TOKEN reason', async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredToken = await createTestToken({ exp: now - 3600 });
      const outcome = await evaluatePageAccess(expiredToken, '/dashboard');

      expect(outcome.status).toBe('UNAUTHENTICATED');
      if (outcome.status === 'UNAUTHENTICATED') {
        expect(outcome.reason).toBe('EXPIRED_TOKEN');
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

  // --- Task 20: Forbidden Roles & Permission Boundaries ---
  describe('Forbidden Roles & Insufficient Permissions', () => {
    it('denies learner/student role with FORBIDDEN', async () => {
      const studentToken = await createTestToken({ roles: ['student'] });
      const outcome = await evaluatePageAccess(studentToken, '/dashboard');

      expect(outcome.status).toBe('FORBIDDEN');
      if (outcome.status === 'FORBIDDEN') {
        expect(outcome.reason).toBe('FORBIDDEN_ROLE');
        expect(outcome.message).toContain('Admin role required');
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

    it('denies empty or unsupported roles', async () => {
      const emptyRoleToken = await createTestToken({ roles: [] });
      const outcome = await evaluatePageAccess(emptyRoleToken, '/dashboard');

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

  // --- Server Component Cookie Store Adapter ---
  describe('evaluateServerCookiesPageAccess', () => {
    it('evaluates access from a Server Component cookie store accurately', async () => {
      const validToken = await createTestToken({ roles: ['admin'] });
      const mockStore = {
        get: (name: string) => (name === 'accessToken' ? { value: validToken } : undefined),
      };

      const outcome = await evaluateServerCookiesPageAccess(mockStore, '/audit');
      expect(outcome.status).toBe('AUTHORIZED');
    });

    it('returns UNAUTHENTICATED when cookie store has no tokens', async () => {
      const emptyStore = { get: () => undefined };
      const outcome = await evaluateServerCookiesPageAccess(emptyStore, '/audit');
      expect(outcome.status).toBe('UNAUTHENTICATED');
    });
  });
});

