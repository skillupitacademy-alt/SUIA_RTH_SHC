import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { ConfigurationError } from '@quiz/auth';
import { ShcSessionInvalidError, UserNotFoundError } from '@/modules/auth/shc-auth.service';
import { TokenService } from '@/modules/auth/token.service';

async function createValidAdminToken(overrides: Record<string, unknown> = {}, signKey = TokenService.ADMIN_SECRET) {
  const payload: Record<string, unknown> = {
    userId: 'admin-user-uuid-1',
    originalUserId: 'admin-user-uuid-1',
    shadowUserId: 'admin-user-uuid-1',
    email: 'admin@skillhubcore.in',
    roles: ['admin'],
    tokenType: 'admin',
    brand: 'skillhubcore',
    aud: 'shc-admin',
    iss: 'skillhubcore.in',
    isAdmin: true,
    ...overrides,
  };

  if (overrides.iss === null) delete payload.iss;
  if (overrides.aud === null) delete payload.aud;
  if (overrides.brand === null) delete payload.brand;
  if (overrides.tokenType === null) delete payload.tokenType;
  if (overrides.userId === null) {
    delete payload.userId;
    delete payload.sub;
  }

  const alg = typeof overrides.alg === 'string' ? overrides.alg : 'HS256';
  let builder = new SignJWT(payload).setProtectedHeader({ alg }).setIssuedAt();

  if (overrides.exp === null) {
    // Intentionally omit exp claim
  } else if (typeof overrides.exp === 'number') {
    builder = builder.setExpirationTime(overrides.exp);
  } else {
    builder = builder.setExpirationTime('1h');
  }

  if (typeof overrides.nbf === 'number') {
    builder = builder.setNotBefore(overrides.nbf);
  }

  return builder.sign(signKey);
}

const { MockSHCAuthService, mockMe, mockSession } = vi.hoisted(() => {
  const mockMe = vi.fn();
  const mockSession = vi.fn();
  class MockSHCAuthService {
    me = mockMe;
    requireSession = mockSession;
  }
  return { MockSHCAuthService, mockMe, mockSession };
});

vi.mock('@/modules/auth/shc-auth.service', async () => {
  const actual = await vi.importActual<typeof import('@/modules/auth/shc-auth.service')>(
    '@/modules/auth/shc-auth.service'
  );
  return {
    ...actual,
    SHCAuthService: MockSHCAuthService,
  };
});

import { GET } from '../route';

describe('GET /api/shc/auth/me (R6 Master Verification Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockSession.mockResolvedValue(undefined);
  });

  it('rejects a revoked session before querying current account eligibility', async () => {
    mockSession.mockRejectedValueOnce(new ShcSessionInvalidError());
    const token = await createValidAdminToken();
    const response = await GET(new NextRequest('http://localhost/api/shc/auth/me', {
      headers: { authorization: `Bearer ${token}` },
    }));
    expect(response.status).toBe(401);
    expect(mockMe).not.toHaveBeenCalled();
  });

  // =========================================================================
  // R6-A: Authoritative Current-Account Eligibility
  // =========================================================================
  describe('R6-A: Current-Account Eligibility (R6-01 to R6-03)', () => {
    it('returns 200 with isAdmin: true for active SHC admin account', async () => {
      mockMe.mockResolvedValueOnce({
        id: 'admin-user-uuid-1',
        email: 'admin@skillhubcore.in',
        role: 'admin',
        platform: 'skillhubcore',
        isActive: true,
      });

      const token = await createValidAdminToken();
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { cookie: `admin_accessToken=${token}` },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');

      const json = await res.json();
      expect(json.user.role).toBe('admin');
      expect(json.user.isAdmin).toBe(true);
      expect(json.user.isActive).toBe(true);
    });

    it('returns 200 with isAdmin: true for active SHC super_admin account', async () => {
      mockMe.mockResolvedValueOnce({
        id: 'admin-user-uuid-1',
        email: 'superadmin@skillhubcore.in',
        role: 'super_admin',
        platform: 'skillhubcore',
        isActive: true,
      });

      const token = await createValidAdminToken({ roles: ['super_admin'] });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await GET(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user.role).toBe('super_admin');
      expect(json.user.isAdmin).toBe(true);
    });

    it('returns 403 Forbidden for inactive/disabled SHC account (R6-02, R6-03)', async () => {
      mockMe.mockResolvedValueOnce({
        id: 'admin-user-uuid-1',
        email: 'disabled@skillhubcore.in',
        role: 'admin',
        platform: 'skillhubcore',
        isActive: false, // Disabled account
      });

      const token = await createValidAdminToken();
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
      const json = await res.json();
      expect(json.message).toBe('Account is not eligible for administrative access');
    });

    it('returns 403 Forbidden for account demoted to student (R6-02, R6-03)', async () => {
      mockMe.mockResolvedValueOnce({
        id: 'admin-user-uuid-1',
        email: 'demoted@skillhubcore.in',
        role: 'student', // Demoted
        platform: 'skillhubcore',
        isActive: true,
      });

      // Token still carries old admin role
      const token = await createValidAdminToken({ roles: ['admin'] });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await GET(req);
      expect(res.status).toBe(403);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
      const json = await res.json();
      expect(json.message).toBe('Account is not eligible for administrative access');
    });

    it('returns 403 Forbidden for account demoted to faculty (R6-02, R6-03)', async () => {
      mockMe.mockResolvedValueOnce({
        id: 'admin-user-uuid-1',
        email: 'faculty@skillhubcore.in',
        role: 'faculty',
        platform: 'skillhubcore',
        isActive: true,
      });

      const token = await createValidAdminToken();
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await GET(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.message).toBe('Account is not eligible for administrative access');
    });

    it('returns 404 Not Found for non-existent or deleted account (UserNotFoundError)', async () => {
      mockMe.mockRejectedValueOnce(new UserNotFoundError('User not found'));

      const token = await createValidAdminToken();
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await GET(req);
      expect(res.status).toBe(404);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    });

    it('returns 503 on database connection failure / pool exhaustion without leaking internal traces', async () => {
      mockMe.mockRejectedValueOnce(new Error('Connection to database timed out: pool exhausted'));

      const token = await createValidAdminToken();
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });

      const res = await GET(req);
      expect(res.status).toBe(503);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
      const json = await res.json();
      expect(json.message).toBe('Identity service temporarily unavailable');
      expect(JSON.stringify(json)).not.toContain('pool exhausted');
    });
  });

  // =========================================================================
  // R6-B: Complete SHC Admin JWT Policy
  // =========================================================================
  describe('R6-B: Complete SHC Admin JWT Policy (R6-06 to R6-09)', () => {
    it('returns 401 when no token is supplied', async () => {
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me');
      const res = await GET(req);
      expect(res.status).toBe(401);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    });

    it('returns 401 for token missing mandatory issuer (iss)', async () => {
      const token = await createValidAdminToken({ iss: null });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    });

    it('returns 401 for token missing mandatory expiry (exp)', async () => {
      const token = await createValidAdminToken({ exp: null });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
      expect(res.headers.get('Cache-Control')).toBe('private, no-store');
    });

    it('returns 401 for expired token', async () => {
      const pastSeconds = Math.floor(Date.now() / 1000) - 3600;
      const token = await createValidAdminToken({ exp: pastSeconds });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 for token signed with disallowed algorithm HS384', async () => {
      const token = await createValidAdminToken({ alg: 'HS384' });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 for token with incorrect audience', async () => {
      const token = await createValidAdminToken({ aud: 'wrong-audience' });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 for token with incorrect brand', async () => {
      const token = await createValidAdminToken({ brand: 'skillup' });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 for user token class (tokenType: user)', async () => {
      const token = await createValidAdminToken({ tokenType: 'user', isAdmin: false });
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 401 for token signed with wrong key', async () => {
      const wrongKey = new TextEncoder().encode('untrusted-foreign-signing-key-32-chars!!');
      const token = await createValidAdminToken({}, wrongKey);
      const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
        headers: { authorization: `Bearer ${token}` },
      });
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns 503 when TokenService constructor throws ConfigurationError (R6-14)', async () => {
      const adminSecretSpy = vi.spyOn(TokenService, 'ADMIN_SECRET', 'get').mockImplementation(() => {
        throw new ConfigurationError('Missing required authentication secret in production');
      });

      try {
        const req = new NextRequest('https://admin.skillhubcore.in/api/shc/auth/me', {
          headers: { authorization: 'Bearer some-token' },
        });
        const res = await GET(req);
        expect(res.status).toBe(503);
        expect(res.headers.get('Cache-Control')).toBe('private, no-store');
        const json = await res.json();
        expect(json.message).toBe('Authentication service temporarily unavailable');
      } finally {
        adminSecretSpy.mockRestore();
      }
    });
  });
});
