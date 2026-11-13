import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST as loginRouteHandler } from '@/app/api/auth/login/route';
import { POST as signupRouteHandler } from '@/app/api/auth/signup/route';
import { AdminAuthService } from '@/modules/auth/admin-auth.service';
import { AuditService } from '@/modules/auth/audit.service';
import { AuthService } from '@/modules/auth/auth.service';
import { InvalidPurposeError, LoginService } from '@/modules/auth/login.service';
import { PasswordService } from '@/modules/auth/password.service';
import { SecurityService } from '@/modules/auth/security.service';
import { TokenService } from '@/modules/auth/token.service';
import { container } from '@/modules/core/container';

const mockUserRepo = {
  findWithDetails: vi.fn(),
  updateLastActive: vi.fn().mockResolvedValue(undefined),
  create: vi.fn(),
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
  hash: vi.fn().mockResolvedValue('hashed_password'),
};

const mockSecurityService = {
  isAccountLocked: vi.fn().mockResolvedValue(false),
  trackLoginAttempt: vi.fn().mockResolvedValue(undefined),
  withContext: vi.fn().mockReturnThis(),
};

// Explicit disposable keys (both distinct keys and shared keys)
// Key order: constructor(accessSecret, refreshSecret, adminSecret)
const DISPOSABLE_ACCESS_KEY = new TextEncoder().encode('login-01-disposable-access-32b!');
const DISPOSABLE_REFRESH_KEY = new TextEncoder().encode('login-01-disposable-refresh32b!');
const DISPOSABLE_ADMIN_KEY = new TextEncoder().encode('login-01-disposable-admin--32b!');

const distinctTokenService = new TokenService(
  DISPOSABLE_ACCESS_KEY,
  DISPOSABLE_REFRESH_KEY,
  DISPOSABLE_ADMIN_KEY
);

const SHARED_KEY = new TextEncoder().encode('login-01-shared-key-32-bytes!!!');
const sharedTokenService = new TokenService(SHARED_KEY, SHARED_KEY, SHARED_KEY);

const mockBrandDbSelect = vi.fn();
vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn(() => ({
    db: {
      select: () => mockBrandDbSelect(),
      insert: vi.fn(() => ({
        values: vi.fn().mockResolvedValue(undefined),
      })),
    },
    tables: {
      users: { id: 'users.id', email: 'users.email', passwordHash: 'users.password_hash' },
      userProfiles: { name: 'user_profiles.name', userId: 'user_profiles.user_id' },
      userRoles: { roleId: 'user_roles.role_id', userId: 'user_roles.user_id' },
      roles: { id: 'roles.id', name: 'roles.name' },
      loginAttempts: {},
      refreshTokens: {},
    },
  })),
  shouldUseBrandBinding: vi.fn(() => false),
}));

describe('LOGIN-01: Server-Fixed Tenant Learner Purpose & Ingress Scoping', () => {
  let loginService: LoginService;
  let authService: AuthService;

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
    const mockSignupService = {
      signup: vi.fn(async (email: string, password: string, name: string) => ({
        id: 'new-user-1',
        email,
        name,
        createdAt: new Date(),
        profile: { name, onboardingCompleted: false },
      })),
    };

    authService = new AuthService(mockSignupService as any, loginService, undefined, undefined);

    // Register services in DI container for route testing
    container.register(TokenService, distinctTokenService);
    container.register(AuthService, authService);
    container.register(LoginService, loginService);
    container.register(SecurityService, mockSecurityService as any);
    container.register(PasswordService, mockPasswordService as any);
    container.register(AuditService, mockAuditService as any);
    container.register(AdminAuthService, AdminAuthService);
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

    // 2. Access Token Verification
    const accessPayload = await distinctTokenService.verifyUserAccessToken(result.accessToken, { audience: 'user' });
    expect(accessPayload.tokenType).toBe('user');
    expect(accessPayload.isAdmin).toBe(false);
    expect(accessPayload.aud).toBe('user');
    expect(accessPayload.roles).toEqual([]); // Zero invented roles (not ['student'])

    // 3. Refresh Token Verification with correct refresh key
    const refreshPayload = await distinctTokenService.verifyRefreshToken(result.refreshToken);
    expect(refreshPayload.tokenType).toBe('user');
    expect(refreshPayload.aud).toBe('user');
    expect(refreshPayload.isAdmin).toBe(false);

    // 4. Invariant: Admin verification must reject learner token
    await expect(
      distinctTokenService.verifyAdminAccessToken(result.accessToken, { audience: 'admin' })
    ).rejects.toThrow();
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

    const refreshPayload = await distinctTokenService.verifyRefreshToken(result.refreshToken);
    expect(refreshPayload.tokenType).toBe('user');
    expect(refreshPayload.aud).toBe('user');
    expect(refreshPayload.isAdmin).toBe(false);
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

    const refreshPayload = await sharedTokenService.verifyRefreshToken(result.refreshToken);
    expect(refreshPayload.tokenType).toBe('user');
    expect(refreshPayload.aud).toBe('user');
    expect(refreshPayload.isAdmin).toBe(false);
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

  describe('Part 3: Public Login & Signup Ingress Controls', () => {
    it('public login route ignores client purpose and forces learner purpose and cookies', async () => {
      mockUserRepo.findWithDetails.mockResolvedValueOnce({
        id: 'ingress-user-1',
        email: 'user@skillup.test',
        passwordHash: 'hash',
        isBlocked: false,
        emailVerified: true,
        shadowUserId: 'shadow-ingress',
        profile: { name: 'Test Learner' },
        userRoles: [{ role: { name: 'admin' } }],
      });

      // Client attempts to request admin purpose in body
      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'host': 'localhost:3000',
          'x-brand': 'skillup',
          'x-device-id': 'dev-ingress',
          'x-device-name': 'Pixel 8',
          'user-agent': 'Chrome-Mobile',
        },
        body: JSON.stringify({
          email: 'user@skillup.test',
          password: 'password123',
          platform: 'skillup',
          purpose: 'admin', // malicious client intent!
        }),
      });

      const res = await loginRouteHandler(req, { requestId: 'req-1' });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.user.isAdmin).toBe(false);

      // Verify cookies set on response: only learner cookies, no admin cookies
      const setCookieHeader = res.headers.get('set-cookie') ?? '';
      expect(setCookieHeader).toContain('accessToken=');
      expect(setCookieHeader).toContain('refreshToken=');
      expect(setCookieHeader).not.toContain('admin_accessToken=');
      expect(setCookieHeader).not.toContain('admin_refreshToken=');

      // Verify persistence received IP and device metadata
      expect(mockTokenRepo.createRefreshToken).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'ingress-user-1',
          deviceContext: expect.objectContaining({
            deviceId: 'dev-ingress',
            deviceName: 'Pixel 8',
            userAgent: 'Chrome-Mobile',
          }),
        })
      );
    });

    it('public login route on generic skillhubcore preserves admin role and cookies', async () => {
      mockUserRepo.findWithDetails.mockResolvedValueOnce({
        id: 'shc-user-1',
        email: 'admin@skillhubcore.test',
        passwordHash: 'hash',
        isBlocked: false,
        emailVerified: true,
        shadowUserId: 'shadow-shc',
        profile: { name: 'SHC Admin' },
        userRoles: [{ role: { name: 'admin' } }],
      });

      const req = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'host': 'localhost:3000',
          'x-brand': 'skillhubcore',
        },
        body: JSON.stringify({
          email: 'admin@skillhubcore.test',
          password: 'password123',
          platform: 'skillhubcore',
        }),
      });

      const res = await loginRouteHandler(req, { requestId: 'req-2' });
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.user.isAdmin).toBe(true);
    });

    it('public signup route auto-logins with server-fixed learner purpose and learner cookies', async () => {
      mockUserRepo.findWithDetails.mockResolvedValueOnce({
        id: 'new-user-1',
        email: 'newbie@skillup.test',
        passwordHash: 'hash',
        isBlocked: false,
        emailVerified: false,
        shadowUserId: 'shadow-newbie',
        profile: { name: 'Newbie' },
        userRoles: [],
      });

      const req = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'host': 'localhost:3000',
          'x-brand': 'skillup',
        },
        body: JSON.stringify({
          email: 'newbie@skillup.test',
          password: 'password123',
          name: 'Newbie',
          platform: 'skillup',
          purpose: 'admin', // client attempt ignored
        }),
      });

      const res = await signupRouteHandler(req);
      expect(res.status).toBe(200);

      const setCookieHeader = res.headers.get('set-cookie') ?? '';
      expect(setCookieHeader).toContain('accessToken=');
      expect(setCookieHeader).toContain('refreshToken=');
      expect(setCookieHeader).not.toContain('admin_accessToken=');
    });

    it('dedicated admin issuer remains source-compatible and issues admin credentials', async () => {
      // Mock Drizzle select for AdminAuthService
      mockBrandDbSelect.mockReturnValue({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          {
            id: 'admin-db-1',
            email: 'admin@realtutorialhub.test',
            passwordHash: 'hashed_password',
            name: 'Real Admin',
            roleName: 'admin',
            shadowUserId: 'shadow-admin-db',
          },
        ]),
      });

      const result = await AdminAuthService.login(
        'admin@realtutorialhub.test',
        'password123',
        '192.0.2.100',
        'admin',
        'realtutorialhub'
      );

      expect(result.user.isAdmin).toBe(true);
      expect(result.accessToken).toBeDefined();

      // Verify that the dedicated admin token has aud: 'admin', tokenType: 'admin'
      const adminPayload = await distinctTokenService.verifyAdminAccessToken(result.accessToken, { audience: 'admin' });
      expect(adminPayload.aud).toBe('admin');
      expect(adminPayload.tokenType).toBe('admin');
      expect(adminPayload.isAdmin).toBe(true);
    });
  });
});

// This suite qualifies the auth consumer with a controlled, verified bridge.
// Actual projection/grant/rollback behavior is covered by bridge and recovery tests.
vi.mock('@quiz/identity-bridge', () => ({
  UserIdentityBridgeService: class {
    async syncUser(input: { expectedShadowUserId?: string; platform: string }) {
      return { shadowUserId: input.expectedShadowUserId ?? (input.platform === 'skillup'
        ? '22222222-2222-4222-8222-222222222222' : '33333333-3333-4333-8333-333333333333'), created: false };
    }
    async updateShadowUserId() {}
  },
}));
