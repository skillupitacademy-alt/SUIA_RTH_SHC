import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * W1.2-SESS-01: DELETE /api/auth/sessions/[sessionId] route ownership tests
 *
 * Verifies route-to-service wiring and authorization enforcement:
 * 1. Verified actor identity wins over forged user headers/body
 * 2. Invalid credentials reject the request
 * 3. Mismatched tenant rejects the request
 * 4. Authenticated foreign owner cannot alter the target
 * 5. RBAC permission enforced
 */

const f = vi.hoisted(() => ({
  TokenKey: class TokenService {},
  LogoutKey: class GlobalLogoutService {},
  token: { getAccessToken: vi.fn(), verifyAccessToken: vi.fn() },
  logout: { revokeSession: vi.fn(), logoutAllDevices: vi.fn(), getActiveSessions: vi.fn() },
}));

vi.mock('@/modules/auth/token.service', () => ({ TokenService: f.TokenKey }));
vi.mock('@/modules/auth/global-logout.service', () => ({ GlobalLogoutService: f.LogoutKey }));
vi.mock('@/modules/core/container', () => ({ container: { get: (key: unknown) => {
  if (key === f.TokenKey) return f.token;
  if (key === f.LogoutKey) return f.logout;
  throw new Error('Unexpected test dependency');
} } }));

vi.mock('@quiz/auth', () => ({
  createRBACUser: vi.fn((user) => user),
  validateBrandOrThrow: vi.fn(),
  isAuthError: vi.fn(() => false),
}));

vi.mock('@quiz/auth/rbac/permissions', () => ({
  PERMISSIONS: {
    PROFILE_WRITE: 'profile:write',
  },
}));

vi.mock('@quiz/auth/rbac/rbac.service', () => ({
  RBACService: {
    requirePermission: vi.fn(),
  },
}));

vi.mock('@/lib/request-brand', () => ({
  resolveRequestHostnameFromHeaders: vi.fn(() => 'localhost'),
}));

vi.mock('@/modules/auth/client-ip', () => ({
  getClientIp: vi.fn(() => '192.0.2.100'),
}));

vi.mock('@/lib/withLogging', () => ({
  withLogging: vi.fn((handler) => handler),
}));

vi.mock('@/lib/correlation-id.middleware', () => ({
  withCorrelationId: vi.fn((handler) => handler),
}));

import { DELETE } from '../[sessionId]/route';
import { validateBrandOrThrow } from '@quiz/auth';
import { RBACService } from '@quiz/auth/rbac/rbac.service';

describe('W1.2-SESS-01: DELETE /api/auth/sessions/[sessionId] route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    f.logout.revokeSession.mockResolvedValue({
      success: true,
      message: 'Session revoked',
    });
  });

  describe('Successful authorized revocation', () => {
    it('verified user successfully revokes their own session', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-123', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      f.token.getAccessToken.mockReturnValue('valid-token');
      f.token.verifyAccessToken.mockResolvedValue({
        userId: 'user-alice',
        brand: 'realtutorialhub',
        roles: ['learner'],
        email: 'alice@example.com',
      });

      vi.mocked(validateBrandOrThrow).mockImplementation(() => {});
      vi.mocked(RBACService.requirePermission).mockImplementation(() => {});

      const context = { params: Promise.resolve({ sessionId: 'session-123' }) };
      const response = await DELETE(mockRequest, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify service was called with VERIFIED userId from JWT
      expect(f.logout.revokeSession).toHaveBeenCalledWith(
        'user-alice',
        'session-123',
        '192.0.2.100',
        'realtutorialhub'
      );
    });
  });

  describe('Invalid credentials', () => {
    it('rejects request with missing access token', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-123', {
        method: 'DELETE',
      });

      f.token.getAccessToken.mockReturnValue(null);

      const context = { params: Promise.resolve({ sessionId: 'session-123' }) };
      const response = await DELETE(mockRequest, context);

      expect(response.status).toBe(401);
      expect(f.logout.revokeSession).not.toHaveBeenCalled();
    });

    it('rejects request with empty access token', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-123', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer ',
        },
      });

      f.token.getAccessToken.mockReturnValue('');

      const context = { params: Promise.resolve({ sessionId: 'session-123' }) };
      const response = await DELETE(mockRequest, context);

      expect(response.status).toBe(401);
      expect(f.logout.revokeSession).not.toHaveBeenCalled();
    });

    it('rejects request with invalid/expired token', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-123', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      f.token.getAccessToken.mockReturnValue('invalid-token');
      f.token.verifyAccessToken.mockRejectedValue(new Error('Invalid token'));

      const context = { params: Promise.resolve({ sessionId: 'session-123' }) };
      const response = await DELETE(mockRequest, context);

      expect(response.status).toBe(500);
      expect(f.logout.revokeSession).not.toHaveBeenCalled();
    });
  });

  describe('Foreign actor prevention', () => {
    it('authenticated user Bob cannot specify Alice\'s userId in request', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-alice-laptop', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer bob-token',
          // Attacker tries to inject Alice's user ID
          'x-user-id': 'user-alice',
        },
        body: JSON.stringify({ userId: 'user-alice' }),
      });

      f.token.getAccessToken.mockReturnValue('bob-token');
      f.token.verifyAccessToken.mockResolvedValue({
        userId: 'user-bob',
        brand: 'realtutorialhub',
        roles: ['learner'],
        email: 'bob@example.com',
      });

      vi.mocked(validateBrandOrThrow).mockImplementation(() => {});
      vi.mocked(RBACService.requirePermission).mockImplementation(() => {});

      const context = { params: Promise.resolve({ sessionId: 'session-alice-laptop' }) };
      const response = await DELETE(mockRequest, context);

      // Service is called with BOB's verified userId, not Alice's
      expect(f.logout.revokeSession).toHaveBeenCalledWith(
        'user-bob', // Verified from JWT, NOT from headers/body
        'session-alice-laptop',
        '192.0.2.100',
        'realtutorialhub'
      );

      // Repository will reject this due to ownership mismatch (0 rows affected)
      // Route returns success without disclosing ownership
      expect(response.status).toBe(200);
    });
  });

  describe('Mismatched tenant / brand validation', () => {
    it('rejects request when JWT brand does not match request brand', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-123', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer token-from-other-brand',
        },
      });

      f.token.getAccessToken.mockReturnValue('token-from-other-brand');
      f.token.verifyAccessToken.mockResolvedValue({
        userId: 'user-eve',
        brand: 'skillup', // Token from SkillUp
        roles: ['learner'],
        email: 'eve@example.com',
      });

      // Brand validation fails
      vi.mocked(validateBrandOrThrow).mockImplementation(() => {
        throw new Error('Brand mismatch: token brand skillup does not match request');
      });

      const context = { params: Promise.resolve({ sessionId: 'session-123' }) };
      const response = await DELETE(mockRequest, context);

      expect(response.status).toBe(403);
      expect(f.logout.revokeSession).not.toHaveBeenCalled();
    });
  });

  describe('RBAC permission enforcement', () => {
    it('rejects request when user lacks profile:write permission', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-123', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer restricted-token',
        },
      });

      f.token.getAccessToken.mockReturnValue('restricted-token');
      f.token.verifyAccessToken.mockResolvedValue({
        userId: 'user-restricted',
        brand: 'realtutorialhub',
        roles: ['viewer'], // Role without profile:write
        email: 'restricted@example.com',
      });

      vi.mocked(validateBrandOrThrow).mockImplementation(() => {});
      vi.mocked(RBACService.requirePermission).mockImplementation(() => {
        throw new Error('Permission denied: profile:write required');
      });

      const context = { params: Promise.resolve({ sessionId: 'session-123' }) };
      const response = await DELETE(mockRequest, context);

      expect(response.status).toBe(403);
      expect(f.logout.revokeSession).not.toHaveBeenCalled();
    });
  });

  describe('Spoofed identity prevention', () => {
    it('ignores forged request body userId field', async () => {
      const mockRequest = new NextRequest('http://localhost/api/auth/sessions/session-target', {
        method: 'DELETE',
        headers: {
          authorization: 'Bearer attacker-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'user-victim', // Attacker tries to impersonate victim
          sessionId: 'session-target',
        }),
      });

      f.token.getAccessToken.mockReturnValue('attacker-token');
      f.token.verifyAccessToken.mockResolvedValue({
        userId: 'user-attacker',
        brand: 'realtutorialhub',
        roles: ['learner'],
        email: 'attacker@example.com',
      });

      vi.mocked(validateBrandOrThrow).mockImplementation(() => {});
      vi.mocked(RBACService.requirePermission).mockImplementation(() => {});

      const context = { params: Promise.resolve({ sessionId: 'session-target' }) };
      await DELETE(mockRequest, context);

      // Service MUST be called with attacker's verified ID, not victim's
      expect(f.logout.revokeSession).toHaveBeenCalledWith(
        'user-attacker', // From JWT verification, NOT request body
        'session-target',
        '192.0.2.100',
        'realtutorialhub'
      );
    });
  });
});
