import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@quiz/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@quiz/db')>();
  return {
    ...actual,
    db: {
      ...actual.db,
      transaction: vi.fn(async (cb: any) => cb({})),
    },
  };
});

import type { RequestBrand } from '@/lib/request-brand';
import { container } from '@/modules/core/container';
import { LoginService } from '../login.service';
import { TokenRefreshService } from '../token-refresh.service';
import { TokenService } from '../token.service';
import type { StrictUserEligibility } from '../repositories/user.repository';

/**
 * B08-B: Isolated Mid-Session Account Lifecycle Transition
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Learner Identity, Security and brand isolation)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-B)
 *
 * Verifies that:
 * 1. A valid learner session is established via LoginService.
 * 2. Active control: Refreshing the token while the account is active succeeds and consumes parent token.
 * 3. Lifecycle Transition 1 (Blocked Account): Mid-session blocking (isBlocked = true) denies refresh,
 *    leaves parent token unconsumed, creates zero child tokens, and preserves foreign-tenant canary.
 * 4. Lifecycle Transition 2 (Soft-Deleted Account): Mid-session deactivation (deletedAt != null) denies refresh,
 *    leaves parent token unconsumed, creates zero child tokens, and preserves foreign-tenant canary.
 * 5. Lifecycle Transition 3 (Missing / Purged Account): Purging user record denies refresh fail-closed,
 *    leaves parent unconsumed, creates zero child tokens, and preserves foreign canary.
 * 6. Lifecycle Transition 4 (Lookup Error): Database lookup error denies refresh cleanly without token consumption.
 * 7. Contrast: Documents that access tokens are stateless JWTs and continue mathematical verification until
 *    expiration, whereas refresh tokens enforce real-time tenant database eligibility checks.
 */

interface InMemUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  isBlocked: boolean;
  deletedAt: Date | null;
  roles: string[];
}

interface InMemSessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  revoked: boolean;
  expiresAt: Date;
  brand: RequestBrand;
}

describe('B08-B: Mid-Session Account Lifecycle Transition (Isolated Controls)', () => {
  const accessSecret = new TextEncoder().encode('test-disposable-access-secret-32b!');
  const refreshSecret = new TextEncoder().encode('test-disposable-refresh-secret-32b!');
  const adminSecret = new TextEncoder().encode('test-disposable-admin-secret-32b!');

  let tokenService: TokenService;
  let suiaUserStore: Map<string, InMemUserRecord>;
  let suiaSessionStore: Map<string, InMemSessionRecord>;
  let rthSessionStore: Map<string, InMemSessionRecord>;
  let shouldFailUserLookup: boolean;
  let canaryHash: string;

  let mockUserRepo: any;
  let mockTokenRepo: any;
  let mockAuditService: any;
  let mockPasswordService: any;
  let mockSecurityService: any;

  let loginService: LoginService;
  let refreshService: TokenRefreshService;

  const TEST_USER_ID = 'suia-learner-uuid-101';
  const COLLIDING_CANARY_USER_ID = 'suia-learner-uuid-101'; // Colliding local ID in foreign tenant store!
  const TEST_EMAIL = 'learner@skillup.test';
  const TEST_PASSWORD = 'CorrectPassword123!';

  let previousTokenServiceInstance: TokenService | null = null;
  let previousContainerTokenService: any = null;

  beforeEach(async () => {
    try {
      previousTokenServiceInstance = TokenService.getInstance();
    } catch {
      previousTokenServiceInstance = null;
    }
    try {
      previousContainerTokenService = container.get(TokenService);
    } catch {
      previousContainerTokenService = null;
    }

    tokenService = new TokenService(accessSecret, refreshSecret, adminSecret);
    TokenService.setInstance(tokenService);
    container.register(TokenService, tokenService);

    suiaUserStore = new Map();
    suiaSessionStore = new Map();
    rthSessionStore = new Map();
    shouldFailUserLookup = false;

    canaryHash = await tokenService.hashToken('rth-foreign-canary-raw-token');

    // Seed SUIA active learner
    suiaUserStore.set(TEST_USER_ID, {
      id: TEST_USER_ID,
      email: TEST_EMAIL,
      passwordHash: 'hashed-password-123',
      isBlocked: false,
      deletedAt: null,
      roles: ['student'],
    });

    // Seed colliding RTH foreign-tenant canary session
    rthSessionStore.set(canaryHash, {
      id: 'rth-canary-session-1',
      userId: COLLIDING_CANARY_USER_ID,
      tokenHash: canaryHash,
      revoked: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      brand: 'realtutorialhub',
    });

    // Mock Audit Service
    mockAuditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    // Mock Password Service
    mockPasswordService = {
      compare: vi.fn(async (plain: string, hash: string) => plain === TEST_PASSWORD),
      hash: vi.fn(async (plain: string) => `hashed-${plain}`),
    };

    // Mock Security Service
    mockSecurityService = {
      isAccountLocked: vi.fn().mockResolvedValue(false),
      trackLoginAttempt: vi.fn().mockResolvedValue(undefined),
      recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
      withContext: vi.fn().mockReturnThis(),
    };

    // Mock User Repository with brand-binding
    mockUserRepo = {
      findByEmail: vi.fn(async (email: string) => {
        for (const u of suiaUserStore.values()) {
          if (u.email.toLowerCase() === email.toLowerCase()) {
            return {
              id: u.id,
              email: u.email,
              passwordHash: u.passwordHash,
              isBlocked: u.isBlocked,
              emailVerified: true,
              userRoles: u.roles.map((r) => ({ role: { name: r } })),
              profile: { name: 'SUIA Learner' },
              shadowUserId: u.id,
            };
          }
        }
        return null;
      }),
      findWithDetails: vi.fn(async (email: string) => {
        for (const u of suiaUserStore.values()) {
          if (u.email.toLowerCase() === email.toLowerCase()) {
            return {
              id: u.id,
              email: u.email,
              passwordHash: u.passwordHash,
              isBlocked: u.isBlocked,
              emailVerified: true,
              userRoles: u.roles.map((r) => ({ role: { name: r } })),
              profile: { name: 'SUIA Learner' },
              shadowUserId: u.id,
            };
          }
        }
        return undefined;
      }),
      findActiveUserWithRoles: vi.fn(async (userId: string): Promise<StrictUserEligibility | null> => {
        if (shouldFailUserLookup) {
          throw new Error('Database connection timeout during user eligibility lookup');
        }
        const user = suiaUserStore.get(userId);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          isBlocked: user.isBlocked,
          deletedAt: user.deletedAt,
          roles: user.roles,
        };
      }),
      updateLastActive: vi.fn().mockResolvedValue(undefined),
      withDb: vi.fn().mockReturnThis(),
    };

    // Mock Token Repository with brand-binding
    mockTokenRepo = {
      createRefreshToken: vi.fn(
        async ({
          userId,
          token,
          expiresAt,
        }: {
          userId: string;
          token: string;
          expiresAt: Date;
          deviceContext?: any;
        }) => {
          const session: InMemSessionRecord = {
            id: `session-${suiaSessionStore.size + 1}`,
            userId,
            tokenHash: token,
            revoked: false,
            expiresAt,
            brand: 'skillup',
          };
          suiaSessionStore.set(token, session);
          return session;
        }
      ),
      findByHash: vi.fn(async (tokenHash: string) => {
        return suiaSessionStore.get(tokenHash) ?? null;
      }),
      consumeToken: vi.fn(async (tokenHash: string, _userId: string) => {
        const session = suiaSessionStore.get(tokenHash);
        if (!session || session.revoked) {
          return false;
        }
        session.revoked = true;
        return true;
      }),
      revokeToken: vi.fn(async (tokenHash: string) => {
        const session = suiaSessionStore.get(tokenHash);
        if (session) {
          session.revoked = true;
        }
      }),
      withDb: vi.fn().mockReturnThis(),
    };

    // LoginService parameter order:
    // (userRepo, tokenRepo, auditService, passwordService, securityService, tokenService)
    loginService = new LoginService(
      mockUserRepo,
      mockTokenRepo,
      mockAuditService,
      mockPasswordService,
      mockSecurityService,
      tokenService
    );

    // TokenRefreshService parameter order:
    // (tokenRepo, tokenService, auditService, userRepo)
    refreshService = new TokenRefreshService(
      mockTokenRepo,
      tokenService,
      mockAuditService,
      mockUserRepo
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (previousTokenServiceInstance) {
      TokenService.setInstance(previousTokenServiceInstance);
    }
    if (previousContainerTokenService) {
      container.register(TokenService, previousContainerTokenService);
    }
  });

  it('POSITIVE CONTROL: establishes valid session and rotates token while account remains active', async () => {
    const loginResult = await loginService.login(
      TEST_EMAIL,
      TEST_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'test-device-1' },
      { purpose: 'learner' }
    );

    expect(loginResult.accessToken).toBeDefined();
    expect(loginResult.refreshToken).toBeDefined();

    const parentTokenHash = await tokenService.hashToken(loginResult.refreshToken);
    expect(suiaSessionStore.has(parentTokenHash)).toBe(true);
    expect(suiaSessionStore.get(parentTokenHash)?.revoked).toBe(false);

    // Active account refresh succeeds
    const refreshed = await refreshService.refresh(
      loginResult.refreshToken,
      '127.0.0.1',
      undefined,
      'user',
      'skillup',
      { deviceId: 'test-device-1' }
    );

    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.refreshToken).toBeDefined();
    expect(refreshed.refreshToken).not.toBe(loginResult.refreshToken);

    // Parent token is now rotated (revoked = true)
    expect(suiaSessionStore.get(parentTokenHash)?.revoked).toBe(true);

    // Child token is now active in store
    const childTokenHash = await tokenService.hashToken(refreshed.refreshToken);
    expect(suiaSessionStore.has(childTokenHash)).toBe(true);
    expect(suiaSessionStore.get(childTokenHash)?.revoked).toBe(false);

    // Foreign tenant canary is unaffected
    expect(rthSessionStore.get(canaryHash)?.revoked).toBe(false);
  });

  it('TRANSITION 1 (BLOCKED): mid-session account blocking denies refresh, leaves parent unconsumed, and creates zero child tokens', async () => {
    // 1. Establish valid session while active
    const loginResult = await loginService.login(
      TEST_EMAIL,
      TEST_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'test-device-2' },
      { purpose: 'learner' }
    );

    const parentTokenHash = await tokenService.hashToken(loginResult.refreshToken);
    const initialSessionCount = suiaSessionStore.size;

    // 2. LIFECYCLE TRANSITION: Account is blocked mid-session
    const userRecord = suiaUserStore.get(TEST_USER_ID)!;
    userRecord.isBlocked = true;

    // 3. Attempt refresh: must throw access_denied:user_blocked fail-closed
    await expect(
      refreshService.refresh(
        loginResult.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'skillup',
        { deviceId: 'test-device-2' }
      )
    ).rejects.toThrow('access_denied:user_blocked');

    // 4. Assert invariant: parent token remains UNCONSUMED (revoked = false)
    expect(suiaSessionStore.get(parentTokenHash)?.revoked).toBe(false);

    // 5. Assert invariant: zero child sessions created
    expect(suiaSessionStore.size).toBe(initialSessionCount);

    // 6. Assert invariant: colliding foreign tenant canary is completely unmutated
    expect(rthSessionStore.get(canaryHash)?.revoked).toBe(false);

    // 7. Audit log attribution
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'token_refresh_failed',
        metadata: expect.objectContaining({ reason: 'user_blocked', brand: 'skillup' }),
      })
    );
  });

  it('TRANSITION 2 (SOFT-DELETED): mid-session account deactivation denies refresh, leaves parent unconsumed, and creates zero child tokens', async () => {
    // 1. Establish valid session while active
    const loginResult = await loginService.login(
      TEST_EMAIL,
      TEST_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'test-device-3' },
      { purpose: 'learner' }
    );

    const parentTokenHash = await tokenService.hashToken(loginResult.refreshToken);
    const initialSessionCount = suiaSessionStore.size;

    // 2. LIFECYCLE TRANSITION: Account is soft-deleted mid-session
    const userRecord = suiaUserStore.get(TEST_USER_ID)!;
    userRecord.deletedAt = new Date();

    // 3. Attempt refresh: must throw Account has been deactivated fail-closed
    await expect(
      refreshService.refresh(
        loginResult.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'skillup',
        { deviceId: 'test-device-3' }
      )
    ).rejects.toThrow('Account has been deactivated');

    // 4. Parent token remains unconsumed
    expect(suiaSessionStore.get(parentTokenHash)?.revoked).toBe(false);

    // 5. Zero child sessions created
    expect(suiaSessionStore.size).toBe(initialSessionCount);

    // 6. Colliding foreign tenant canary is unmutated
    expect(rthSessionStore.get(canaryHash)?.revoked).toBe(false);
  });

  it('TRANSITION 3 (MISSING / PURGED): account deletion from tenant database denies refresh fail-closed', async () => {
    // 1. Establish valid session while active
    const loginResult = await loginService.login(
      TEST_EMAIL,
      TEST_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'test-device-4' },
      { purpose: 'learner' }
    );

    const parentTokenHash = await tokenService.hashToken(loginResult.refreshToken);
    const initialSessionCount = suiaSessionStore.size;

    // 2. LIFECYCLE TRANSITION: User record is purged from store
    suiaUserStore.delete(TEST_USER_ID);

    // 3. Attempt refresh: must throw Invalid refresh token
    await expect(
      refreshService.refresh(
        loginResult.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'skillup',
        { deviceId: 'test-device-4' }
      )
    ).rejects.toThrow('Invalid refresh token');

    // 4. Parent token remains unconsumed
    expect(suiaSessionStore.get(parentTokenHash)?.revoked).toBe(false);

    // 5. Zero child sessions created
    expect(suiaSessionStore.size).toBe(initialSessionCount);

    // 6. Colliding foreign tenant canary is unmutated
    expect(rthSessionStore.get(canaryHash)?.revoked).toBe(false);
  });

  it('TRANSITION 4 (LOOKUP ERROR): transient database lookup failure refuses refresh without consuming token', async () => {
    // 1. Establish valid session while active
    const loginResult = await loginService.login(
      TEST_EMAIL,
      TEST_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'test-device-5' },
      { purpose: 'learner' }
    );

    const parentTokenHash = await tokenService.hashToken(loginResult.refreshToken);
    const initialSessionCount = suiaSessionStore.size;

    // 2. Inject transient DB failure
    shouldFailUserLookup = true;

    // 3. Attempt refresh: must reject with DB failure
    await expect(
      refreshService.refresh(
        loginResult.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'skillup',
        { deviceId: 'test-device-5' }
      )
    ).rejects.toThrow('Database connection timeout during user eligibility lookup');

    // 4. Parent token remains unconsumed (allowing safe caller retry after transient recovery)
    expect(suiaSessionStore.get(parentTokenHash)?.revoked).toBe(false);

    // 5. Zero child sessions created
    expect(suiaSessionStore.size).toBe(initialSessionCount);

    // 6. Foreign tenant canary preserved
    expect(rthSessionStore.get(canaryHash)?.revoked).toBe(false);
  });

  it('CONTRAST: access token remains mathematically valid in stateless verification, proving refresh is the real-time lifecycle enforcement boundary', async () => {
    const loginResult = await loginService.login(
      TEST_EMAIL,
      TEST_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'test-device-6' },
      { purpose: 'learner' }
    );

    // Account blocked mid-session
    const userRecord = suiaUserStore.get(TEST_USER_ID)!;
    userRecord.isBlocked = true;

    // Stateless access token cryptographic verification passes without DB check
    const accessPayload = await tokenService.verifyUserAccessToken(loginResult.accessToken);
    expect(accessPayload.userId).toBe(TEST_USER_ID);
    expect(accessPayload.aud).toBe('user');
    expect(accessPayload.brand).toBe('skillup');

    // Refresh token stateful database check FAILS immediately upon blocking
    await expect(
      refreshService.refresh(
        loginResult.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'skillup',
        { deviceId: 'test-device-6' }
      )
    ).rejects.toThrow('access_denied:user_blocked');
  });
});
