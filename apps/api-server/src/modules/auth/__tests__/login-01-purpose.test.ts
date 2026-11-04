import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '@/modules/auth/auth.service';
import { InvalidPurposeError, LoginService } from '@/modules/auth/login.service';
import { TokenService } from '@/modules/auth/token.service';

const mockUserRepo = {
  findWithDetails: vi.fn(),
  updateLastActive: vi.fn().mockResolvedValue(undefined),
  withDb: vi.fn().mockReturnThis(),
};

const mockTokenRepo = {
  createRefreshToken: vi.fn().mockResolvedValue(undefined),
  revokeToken: vi.fn().mockResolvedValue(undefined),
  getUserSessions: vi.fn().mockResolvedValue([]),
  withDb: vi.fn().mockReturnThis(),
};

const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
};

const mockPasswordService = {
  compare: vi.fn().mockResolvedValue(true),
};

const mockSecurityService = {
  isAccountLocked: vi.fn().mockResolvedValue(false),
  trackLoginAttempt: vi.fn().mockResolvedValue(undefined),
  withContext: vi.fn().mockReturnThis(),
};

// Explicit disposable keys (both distinct keys and shared keys)
const DISPOSABLE_ACCESS_KEY = new TextEncoder().encode('login-01-disposable-access-32b!');
const DISPOSABLE_ADMIN_KEY = new TextEncoder().encode('login-01-disposable-admin--32b!');
const DISPOSABLE_REFRESH_KEY = new TextEncoder().encode('login-01-disposable-refresh32b!');

const distinctTokenService = new TokenService(
  DISPOSABLE_ACCESS_KEY,
  DISPOSABLE_ADMIN_KEY,
  DISPOSABLE_REFRESH_KEY
);

const SHARED_KEY = new TextEncoder().encode('login-01-shared-key-32-bytes!!!');
const sharedTokenService = new TokenService(SHARED_KEY, SHARED_KEY, SHARED_KEY);

vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn(() => ({
    db: {},
    tables: {
      users: {},
      loginAttempts: {},
      refreshTokens: {},
    },
  })),
  shouldUseBrandBinding: vi.fn(() => false),
}));

describe('LOGIN-01: Server-Fixed Tenant Learner Purpose & Ingress Scoping', () => {
  let loginService: LoginService;

  beforeEach(() => {
    vi.clearAllMocks();
    loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      mockPasswordService as any,
      mockSecurityService as any,
      distinctTokenService
    );
  });

  it('pure-admin account at learner ingress yields empty-role principal without invented roles', async () => {
    mockUserRepo.findWithDetails.mockResolvedValueOnce({
      id: 'admin-user-1',
      email: 'admin@skillup.test',
      passwordHash: 'hash',
      isBlocked: false,
      emailVerified: true,
      shadowUserId: 'shadow-1',
      userRoles: [
        { role: { name: 'admin' } },
        { role: { name: 'super_admin' } },
      ],
    });

    const result = await loginService.login(
      'admin@skillup.test',
      'password123',
      '198.51.100.1',
      'skillup',
      { deviceId: 'dev-1', userAgent: 'TestBrowser', deviceName: 'Laptop' },
      { purpose: 'learner' }
    );

    // 1. Result flags must indicate non-admin
    expect(result.isAdmin).toBe(false);

    // 2. Cryptographic Access Token claims verification under distinct keys
    const accessPayload = await distinctTokenService.verifyUserAccessToken(result.accessToken, { audience: 'user' });
    expect(accessPayload.userId).toBe('admin-user-1');
    expect(accessPayload.brand).toBe('skillup');
    expect(accessPayload.tokenType).toBe('user');
    expect(accessPayload.isAdmin).toBe(false);
    expect(accessPayload.aud).toBe('user');
    // EMPTY-ROLE BASELINE: Administrative roles stripped, no invented 'student' role
    expect(accessPayload.roles).toEqual([]);

    // 3. Admin token verifier MUST reject this learner-purpose token
    await expect(
      distinctTokenService.verifyAdminAccessToken(result.accessToken, { audience: 'admin' })
    ).rejects.toThrow();

    // 4. Cryptographic Refresh Token claims verification
    const refreshPayload = await distinctTokenService.verifyRefreshToken(result.refreshToken, { audience: 'user' });
    expect(refreshPayload.userId).toBe('admin-user-1');
    expect(refreshPayload.tokenType).toBe('user');
    expect(refreshPayload.aud).toBe('user');

    // 5. Database session storage invariant: only owner/hash/device/ip, no tokenType/isAdmin columns
    expect(mockTokenRepo.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-user-1',
        deviceContext: {
          deviceId: 'dev-1',
          ipAddress: '198.51.100.1',
          userAgent: 'TestBrowser',
          deviceName: 'Laptop',
        },
      })
    );
  });

  it('dual-role account at learner ingress preserves learner roles while stripping admin roles', async () => {
    mockUserRepo.findWithDetails.mockResolvedValueOnce({
      id: 'dual-user-2',
      email: 'dual@realtutorialhub.test',
      passwordHash: 'hash',
      isBlocked: false,
      emailVerified: true,
      shadowUserId: 'shadow-2',
      userRoles: [
        { role: { name: 'admin' } },
        { role: { name: 'student' } },
      ],
    });

    const result = await loginService.login(
      'dual@realtutorialhub.test',
      'password123',
      '198.51.100.2',
      'realtutorialhub',
      { deviceId: 'dev-2' },
      { purpose: 'learner' }
    );

    expect(result.isAdmin).toBe(false);

    const accessPayload = await distinctTokenService.verifyUserAccessToken(result.accessToken, { audience: 'user' });
    expect(accessPayload.tokenType).toBe('user');
    expect(accessPayload.isAdmin).toBe(false);
    expect(accessPayload.aud).toBe('user');
    expect(accessPayload.roles).toEqual(['student']);
  });

  it('operates correctly under supported shared-key configuration', async () => {
    const sharedLoginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      mockPasswordService as any,
      mockSecurityService as any,
      sharedTokenService
    );

    mockUserRepo.findWithDetails.mockResolvedValueOnce({
      id: 'shared-user-1',
      email: 'shared@skillup.test',
      passwordHash: 'hash',
      isBlocked: false,
      emailVerified: true,
      shadowUserId: 'shadow-shared',
      userRoles: [{ role: { name: 'admin' } }],
    });

    const result = await sharedLoginService.login(
      'shared@skillup.test',
      'password123',
      '198.51.100.10',
      'skillup',
      undefined,
      { purpose: 'learner' }
    );

    expect(result.isAdmin).toBe(false);
    const accessPayload = await sharedTokenService.verifyUserAccessToken(result.accessToken, { audience: 'user' });
    expect(accessPayload.tokenType).toBe('user');
    expect(accessPayload.isAdmin).toBe(false);
    expect(accessPayload.roles).toEqual([]);
  });

  it('preserves generic skillhubcore brand admin detection behavior', async () => {
    mockUserRepo.findWithDetails.mockResolvedValue({
      id: 'shc-admin-user',
      email: 'shc-admin@example.test',
      passwordHash: 'hash',
      isBlocked: false,
      emailVerified: true,
      shadowUserId: 'shadow-shc',
      userRoles: [{ role: { name: 'admin' } }],
    });

    // 1. Without purpose options
    const legacyResult = await loginService.login(
      'shc-admin@example.test',
      'password123',
      '192.0.2.1',
      'skillhubcore'
    );
    expect(legacyResult.isAdmin).toBe(true);

    // 2. With purpose: 'learner' on generic skillhubcore
    const forwardedResult = await loginService.login(
      'shc-admin@example.test',
      'password123',
      '192.0.2.1',
      'skillhubcore',
      undefined,
      { purpose: 'learner' }
    );

    // Invariant: Learner-scoping does not strip admin status on generic skillhubcore
    expect(forwardedResult.isAdmin).toBe(legacyResult.isAdmin);
    expect(forwardedResult.isAdmin).toBe(true);
  });

  it('fails fast on unsupported purpose without user lookup or password checks', async () => {
    await expect(
      loginService.login(
        'user@skillup.test',
        'password123',
        '198.51.100.4',
        'skillup',
        undefined,
        { purpose: 'admin' as any }
      )
    ).rejects.toThrow(InvalidPurposeError);

    // Security Invariant: no database lookups, password hashes, or login_success audit emitted
    expect(mockUserRepo.findWithDetails).not.toHaveBeenCalled();
    expect(mockPasswordService.compare).not.toHaveBeenCalled();
    expect(mockAuditService.log).not.toHaveBeenCalled();
  });

  it('AuthService facade cleanly forwards options and deviceContext to LoginService', async () => {
    const authService = new AuthService(undefined, loginService, undefined, undefined);

    mockUserRepo.findWithDetails.mockResolvedValueOnce({
      id: 'facade-user-5',
      email: 'facade@skillup.test',
      passwordHash: 'hash',
      isBlocked: false,
      emailVerified: true,
      shadowUserId: 'shadow-5',
      userRoles: [{ role: { name: 'admin' } }],
    });

    const result = await authService.login(
      'facade@skillup.test',
      'password123',
      '198.51.100.5',
      'skillup',
      { deviceId: 'dev-facade', deviceName: 'Phone' },
      { purpose: 'learner' }
    );

    expect(result.isAdmin).toBe(false);
    expect(mockTokenRepo.createRefreshToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'facade-user-5',
        deviceContext: expect.objectContaining({
          deviceId: 'dev-facade',
          deviceName: 'Phone',
          ipAddress: '198.51.100.5',
        }),
      })
    );
  });
});
