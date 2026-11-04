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

// Real TokenService for cryptographic verification
const realTokenService = new TokenService();

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

describe('LOGIN-01: Server-Fixed Tenant Learner Purpose', () => {
  let loginService: LoginService;

  beforeEach(() => {
    vi.clearAllMocks();
    loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      mockPasswordService as any,
      mockSecurityService as any,
      realTokenService
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

    // 2. Cryptographic Access Token claims verification
    const accessPayload = await realTokenService.verifyUserAccessToken(result.accessToken, { audience: 'user' });
    expect(accessPayload.userId).toBe('admin-user-1');
    expect(accessPayload.brand).toBe('skillup');
    expect(accessPayload.tokenType).toBe('user');
    expect(accessPayload.isAdmin).toBe(false);
    expect(accessPayload.aud).toBe('user');
    // EMPTY-ROLE BASELINE: Administrative roles stripped, no invented 'student' role
    expect(accessPayload.roles).toEqual([]);

    // 3. Admin token verifier MUST reject this learner-purpose token
    await expect(
      realTokenService.verifyAdminAccessToken(result.accessToken, { audience: 'admin' })
    ).rejects.toThrow();

    // 4. Cryptographic Refresh Token claims verification
    const refreshPayload = await realTokenService.verifyRefreshToken(result.refreshToken, { audience: 'user' });
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

    const accessPayload = await realTokenService.verifyUserAccessToken(result.accessToken, { audience: 'user' });
    expect(accessPayload.tokenType).toBe('user');
    expect(accessPayload.isAdmin).toBe(false);
    expect(accessPayload.aud).toBe('user');
    // Preserves legitimate student role, strips admin role
    expect(accessPayload.roles).toEqual(['student']);
  });

  it('legacy caller with omitted purpose preserves existing role-derived admin elevation', async () => {
    mockUserRepo.findWithDetails.mockResolvedValueOnce({
      id: 'legacy-admin-3',
      email: 'legacy@realtutorialhub.test',
      passwordHash: 'hash',
      isBlocked: false,
      emailVerified: true,
      shadowUserId: 'shadow-3',
      userRoles: [{ role: { name: 'admin' } }],
    });

    // Omitted purpose options (legacy internal caller)
    const result = await loginService.login(
      'legacy@realtutorialhub.test',
      'password123',
      '198.51.100.3',
      'realtutorialhub'
    );

    expect(result.isAdmin).toBe(true);

    const adminPayload = await realTokenService.verifyAdminAccessToken(result.accessToken, { audience: 'admin' });
    expect(adminPayload.tokenType).toBe('admin');
    expect(adminPayload.isAdmin).toBe(true);
    expect(adminPayload.aud).toBe('admin');
    expect(adminPayload.roles).toEqual(['admin']);
  });

  it('throws InvalidPurposeError for unsupported purpose string', async () => {
    mockUserRepo.findWithDetails.mockResolvedValueOnce({
      id: 'user-4',
      email: 'user@skillup.test',
      passwordHash: 'hash',
      isBlocked: false,
      emailVerified: true,
      shadowUserId: 'shadow-4',
      userRoles: [],
    });

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
