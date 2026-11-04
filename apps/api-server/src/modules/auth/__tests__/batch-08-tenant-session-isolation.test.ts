import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestBrand } from '@/lib/request-brand';
import { container } from '@/modules/core/container';
import { LoginService } from '../login.service';
import { PasswordService } from '../password.service';
import { TokenRefreshService } from '../token-refresh.service';
import { TokenService } from '../token.service';
import type { StrictUserEligibility } from '../repositories/user.repository';

/**
 * B08-C: Same-Email and Colliding-ID Session Isolation
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Learner Identity, Database Isolation)
 * Governing Task: audit/W1.2_Gemini_Batch_08_Corrections_And_Containment_Task.md (Package C)
 *
 * PROVES:
 * 1. Two tenants (skillup and realtutorialhub) seeded with:
 *    - Identical normalized email: learner@example.test
 *    - Colliding local primary keys: 'user-100'
 *    - Distinct passwords, distinct roles, and distinct profiles ('SUIA Learner 100' vs 'RTH Learner 100').
 * 2. Login to Tenant A (SUIA) returns distinct SUIA profile and creates session ONLY in SUIA store.
 * 3. Login to Tenant B (RTH) returns distinct RTH profile and creates session ONLY in RTH store.
 * 4. Reciprocal foreign-password checks fail closed for both tenants:
 *    - SUIA password against RTH brand -> Invalid credentials
 *    - RTH password against SUIA brand -> Invalid credentials
 * 5. Reciprocal foreign-token refresh checks fail closed for both tenants:
 *    - SUIA refresh token against RTH brand -> Invalid refresh token
 *    - RTH refresh token against SUIA brand -> Invalid refresh token
 * 6. Legitimate SUIA refresh rotates SUIA session while colliding RTH session is completely untouched.
 * 7. Legitimate RTH refresh rotates RTH session while colliding SUIA session is completely untouched.
 * 8. Fixture sensitivity via real wrong-store injection: executing service with a miswired store
 *    is rejected fail-closed, proving assertion sensitivity without tautological state flipping.
 */

interface InMemUser {
  id: string;
  email: string;
  passwordHash: string;
  isBlocked: boolean;
  emailVerified: boolean;
  roles: string[];
  userRoles: { role: { name: string } }[];
  profile: { name: string } | null;
  lastActiveAt?: Date;
  shadowUserId?: string | null;
}

interface InMemSession {
  id: string;
  userId: string;
  token: string; // token hash
  revoked: boolean;
  deviceId: string;
  expiresAt: Date;
  brand: RequestBrand;
}

class InMemTenantStore {
  readonly brand: RequestBrand;
  users: Map<string, InMemUser> = new Map(); // keyed by email
  usersById: Map<string, InMemUser> = new Map(); // keyed by id
  sessions: Map<string, InMemSession> = new Map(); // keyed by tokenHash

  constructor(brand: RequestBrand) {
    this.brand = brand;
  }

  reset() {
    this.users.clear();
    this.usersById.clear();
    this.sessions.clear();
  }

  addUser(user: InMemUser) {
    this.users.set(user.email.toLowerCase(), { ...user });
    this.usersById.set(user.id, { ...user });
  }

  findUserByEmail(email: string): InMemUser | undefined {
    const found = this.users.get(email.toLowerCase());
    return found ? { ...found } : undefined;
  }

  findActiveUserWithRoles(userId: string): StrictUserEligibility | null {
    const user = this.usersById.get(userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      isBlocked: user.isBlocked,
      deletedAt: null,
      roles: user.roles,
    };
  }

  updateLastActive(userId: string) {
    const user = this.usersById.get(userId);
    if (user) {
      user.lastActiveAt = new Date();
    }
  }

  createSession(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    deviceContext?: any;
  }): InMemSession {
    const session: InMemSession = {
      id: `sess-${this.brand}-${this.sessions.size + 1}`,
      userId: data.userId,
      token: data.token,
      revoked: false,
      deviceId: data.deviceContext?.deviceId ?? 'unknown-device',
      expiresAt: data.expiresAt,
      brand: this.brand,
    };
    this.sessions.set(data.token, session);
    return session;
  }

  findByHash(tokenHash: string): InMemSession | null {
    return this.sessions.get(tokenHash) ?? null;
  }

  consumeToken(tokenHash: string, _userId: string): boolean {
    const session = this.sessions.get(tokenHash);
    if (!session || session.revoked) return false;
    session.revoked = true;
    return true;
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

const suiaStore = new InMemTenantStore('skillup');
const rthStore = new InMemTenantStore('realtutorialhub');

vi.mock('@/modules/auth/brand-db', () => ({
  shouldUseBrandBinding: vi.fn(() => true),
  getAuthBrandContext: vi.fn((brand: RequestBrand) => {
    const store = brand === 'skillup' ? suiaStore : rthStore;
    return {
      db: store,
      tables: {
        users: { name: `${store.brand}_users` },
        refreshTokens: { name: `${store.brand}_refresh_tokens` },
      },
    };
  }),
}));

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

describe('B08-C: Same-Email and Colliding-ID Session Isolation', () => {
  const disposableAccessSecret = new TextEncoder().encode('b08c-disposable-access-secret-32b!');
  const disposableRefreshSecret = new TextEncoder().encode('b08c-disposable-refresh-secret-32b!');
  const disposableAdminSecret = new TextEncoder().encode('b08c-disposable-admin-secret-32b!!');

  const passwordService = new PasswordService();
  const tokenService = new TokenService(disposableAccessSecret, disposableRefreshSecret, disposableAdminSecret);

  const mockAuditService = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockSecurityService: any = {
    isAccountLocked: vi.fn().mockResolvedValue(false),
    trackLoginAttempt: vi.fn().mockResolvedValue(undefined),
    recordLoginAttempt: vi.fn().mockResolvedValue(undefined),
    withContext: vi.fn(() => mockSecurityService),
  };

  const mockUserRepo = {
    findWithDetails: vi.fn(async (_email: string) => undefined),
    updateLastActive: vi.fn().mockResolvedValue(undefined),
    findActiveUserWithRoles: vi.fn(async (_id: string) => null),
    withDb: vi.fn((dbStore: InMemTenantStore) => {
      return {
        findWithDetails: vi.fn(async (email: string) => dbStore.findUserByEmail(email)),
        updateLastActive: vi.fn(async (userId: string) => dbStore.updateLastActive(userId)),
        findActiveUserWithRoles: vi.fn(async (userId: string) => dbStore.findActiveUserWithRoles(userId)),
      };
    }),
  };

  const mockTokenRepo = {
    createRefreshToken: vi.fn().mockResolvedValue(undefined),
    findByHash: vi.fn().mockResolvedValue(null),
    consumeToken: vi.fn().mockResolvedValue(false),
    withDb: vi.fn((dbStore: InMemTenantStore) => {
      return {
        createRefreshToken: vi.fn(async (data: any) => dbStore.createSession(data)),
        findByHash: vi.fn(async (hash: string) => dbStore.findByHash(hash)),
        consumeToken: vi.fn(async (hash: string, userId: string) => dbStore.consumeToken(hash, userId)),
      };
    }),
  };

  const SHARED_EMAIL = 'learner@example.test';
  const COLLIDING_USER_ID = 'user-100';

  const SUIA_PASSWORD = 'Password-SUIA-Secret!1';
  const RTH_PASSWORD = 'Password-RTH-Secret!2';

  let loginService: LoginService;
  let refreshService: TokenRefreshService;
  let previousTokenServiceInstance: TokenService | null = null;
  let previousContainerTokenService: any = null;

  beforeEach(async () => {
    vi.clearAllMocks();
    suiaStore.reset();
    rthStore.reset();

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

    TokenService.setInstance(tokenService);
    container.register(TokenService, tokenService);

    // 1. Seed SUIA store
    const suiaPasswordHash = await passwordService.hash(SUIA_PASSWORD);
    suiaStore.addUser({
      id: COLLIDING_USER_ID,
      email: SHARED_EMAIL,
      passwordHash: suiaPasswordHash,
      isBlocked: false,
      emailVerified: true,
      roles: ['student'],
      userRoles: [{ role: { name: 'student' } }],
      profile: { name: 'SUIA Learner 100' },
      shadowUserId: COLLIDING_USER_ID,
    });

    // 2. Seed RTH store with COLLIDING local user ID and identical email, but distinct password/profile
    const rthPasswordHash = await passwordService.hash(RTH_PASSWORD);
    rthStore.addUser({
      id: COLLIDING_USER_ID,
      email: SHARED_EMAIL,
      passwordHash: rthPasswordHash,
      isBlocked: false,
      emailVerified: true,
      roles: ['professional'],
      userRoles: [{ role: { name: 'professional' } }],
      profile: { name: 'RTH Learner 100' },
      shadowUserId: COLLIDING_USER_ID,
    });

    loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService,
      tokenService
    );

    refreshService = new TokenRefreshService(
      mockTokenRepo as any,
      tokenService,
      mockAuditService as any,
      mockUserRepo as any
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

  it('1. Login to SUIA succeeds, returns SUIA profile, and creates session ONLY in SUIA store', async () => {
    const result = await loginService.login(
      SHARED_EMAIL,
      SUIA_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'suia-dev-1' },
      { purpose: 'learner' }
    );

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    // Distinct profile marker check
    expect((result as any)._user?.profile?.name).toBe('SUIA Learner 100');
    expect((result as any)._user?.roles).toEqual(['student']);

    const decoded = await tokenService.verifyAccessToken(result.accessToken);
    expect(decoded.userId).toBe(COLLIDING_USER_ID);
    expect(decoded.brand).toBe('skillup');
    expect(decoded.aud).toBe('user');
    expect(decoded.isAdmin).toBe(false);

    // Session persisted strictly in SUIA store
    expect(suiaStore.sessions.size).toBe(1);
    expect(rthStore.sessions.size).toBe(0);

    const suiaSession = Array.from(suiaStore.sessions.values())[0];
    expect(suiaSession.userId).toBe(COLLIDING_USER_ID);
    expect(suiaSession.brand).toBe('skillup');
  });

  it('2. Login to RTH succeeds, returns RTH profile, and creates session ONLY in RTH store', async () => {
    const result = await loginService.login(
      SHARED_EMAIL,
      RTH_PASSWORD,
      '127.0.0.1',
      'realtutorialhub',
      { deviceId: 'rth-dev-1' },
      { purpose: 'learner' }
    );

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();

    // Distinct profile marker check
    expect((result as any)._user?.profile?.name).toBe('RTH Learner 100');
    expect((result as any)._user?.roles).toEqual(['professional']);

    const decoded = await tokenService.verifyAccessToken(result.accessToken);
    expect(decoded.userId).toBe(COLLIDING_USER_ID);
    expect(decoded.brand).toBe('realtutorialhub');
    expect(decoded.aud).toBe('user');
    expect(decoded.isAdmin).toBe(false);

    // Session persisted strictly in RTH store
    expect(rthStore.sessions.size).toBe(1);
    expect(suiaStore.sessions.size).toBe(0);

    const rthSession = Array.from(rthStore.sessions.values())[0];
    expect(rthSession.userId).toBe(COLLIDING_USER_ID);
    expect(rthSession.brand).toBe('realtutorialhub');
  });

  it('3. Reciprocal foreign-password attempts fail closed for both tenants', async () => {
    // A. SUIA password against RTH brand -> must fail closed
    await expect(
      loginService.login(
        SHARED_EMAIL,
        SUIA_PASSWORD,
        '127.0.0.1',
        'realtutorialhub',
        { deviceId: 'cross-dev-1' },
        { purpose: 'learner' }
      )
    ).rejects.toThrow('Invalid credentials');

    // B. RTH password against SUIA brand -> must fail closed
    await expect(
      loginService.login(
        SHARED_EMAIL,
        RTH_PASSWORD,
        '127.0.0.1',
        'skillup',
        { deviceId: 'cross-dev-2' },
        { purpose: 'learner' }
      )
    ).rejects.toThrow('Invalid credentials');

    // Zero sessions created in either store
    expect(suiaStore.sessions.size).toBe(0);
    expect(rthStore.sessions.size).toBe(0);
  });

  it('4. Reciprocal foreign-refresh attempts fail closed for both tenants', async () => {
    // 1. Establish sessions in both tenants
    const suiaLogin = await loginService.login(
      SHARED_EMAIL,
      SUIA_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'suia-dev-1' },
      { purpose: 'learner' }
    );
    const rthLogin = await loginService.login(
      SHARED_EMAIL,
      RTH_PASSWORD,
      '127.0.0.1',
      'realtutorialhub',
      { deviceId: 'rth-dev-1' },
      { purpose: 'learner' }
    );

    const suiaHash = await tokenService.hashToken(suiaLogin.refreshToken);
    const rthHash = await tokenService.hashToken(rthLogin.refreshToken);

    // A. SUIA token submitted to RTH brand context -> fails closed
    await expect(
      refreshService.refresh(
        suiaLogin.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'realtutorialhub',
        { deviceId: 'rth-dev-1' }
      )
    ).rejects.toThrow(/Invalid refresh token/);

    // B. RTH token submitted to SUIA brand context -> fails closed
    await expect(
      refreshService.refresh(
        rthLogin.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'skillup',
        { deviceId: 'suia-dev-1' }
      )
    ).rejects.toThrow(/Invalid refresh token/);

    // Both sessions remain unconsumed in their respective stores
    expect(suiaStore.sessions.get(suiaHash)?.revoked).toBe(false);
    expect(rthStore.sessions.get(rthHash)?.revoked).toBe(false);
    expect(suiaStore.sessions.size).toBe(1);
    expect(rthStore.sessions.size).toBe(1);
  });

  it('5. Legitimate SUIA refresh rotates SUIA session while colliding RTH session is completely untouched', async () => {
    const suiaLogin = await loginService.login(
      SHARED_EMAIL,
      SUIA_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'suia-dev-1' },
      { purpose: 'learner' }
    );
    const suiaParentHash = await tokenService.hashToken(suiaLogin.refreshToken);

    const rthLogin = await loginService.login(
      SHARED_EMAIL,
      RTH_PASSWORD,
      '127.0.0.1',
      'realtutorialhub',
      { deviceId: 'rth-dev-1' },
      { purpose: 'learner' }
    );
    const rthParentHash = await tokenService.hashToken(rthLogin.refreshToken);

    expect(suiaStore.sessions.size).toBe(1);
    expect(rthStore.sessions.size).toBe(1);

    // Refresh SUIA session
    const refreshedSuia = await refreshService.refresh(
      suiaLogin.refreshToken,
      '127.0.0.1',
      undefined,
      'user',
      'skillup',
      { deviceId: 'suia-dev-1' }
    );

    expect(refreshedSuia.accessToken).toBeDefined();
    expect(refreshedSuia.refreshToken).toBeDefined();

    // SUIA parent is revoked, child created
    expect(suiaStore.sessions.get(suiaParentHash)?.revoked).toBe(true);
    expect(suiaStore.sessions.size).toBe(2);

    // Colliding RTH session was NOT touched
    expect(rthStore.sessions.get(rthParentHash)?.revoked).toBe(false);
    expect(rthStore.sessions.size).toBe(1);
  });

  it('6. Legitimate RTH refresh rotates RTH session while colliding SUIA session is completely untouched', async () => {
    const suiaLogin = await loginService.login(
      SHARED_EMAIL,
      SUIA_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'suia-dev-1' },
      { purpose: 'learner' }
    );
    const suiaParentHash = await tokenService.hashToken(suiaLogin.refreshToken);

    const rthLogin = await loginService.login(
      SHARED_EMAIL,
      RTH_PASSWORD,
      '127.0.0.1',
      'realtutorialhub',
      { deviceId: 'rth-dev-1' },
      { purpose: 'learner' }
    );
    const rthParentHash = await tokenService.hashToken(rthLogin.refreshToken);

    expect(suiaStore.sessions.size).toBe(1);
    expect(rthStore.sessions.size).toBe(1);

    // Refresh RTH session
    const refreshedRth = await refreshService.refresh(
      rthLogin.refreshToken,
      '127.0.0.1',
      undefined,
      'user',
      'realtutorialhub',
      { deviceId: 'rth-dev-1' }
    );

    expect(refreshedRth.accessToken).toBeDefined();
    expect(refreshedRth.refreshToken).toBeDefined();

    // RTH parent is revoked, child created in RTH
    expect(rthStore.sessions.get(rthParentHash)?.revoked).toBe(true);
    expect(rthStore.sessions.size).toBe(2);

    // Colliding SUIA session was NOT touched
    expect(suiaStore.sessions.get(suiaParentHash)?.revoked).toBe(false);
    expect(suiaStore.sessions.size).toBe(1);
  });

  it('7. Fixture sensitivity via real wrong-store injection into service operation', async () => {
    // 1. Establish legitimate RTH session
    const rthLogin = await loginService.login(
      SHARED_EMAIL,
      RTH_PASSWORD,
      '127.0.0.1',
      'realtutorialhub',
      { deviceId: 'rth-dev-1' },
      { purpose: 'learner' }
    );
    const rthParentHash = await tokenService.hashToken(rthLogin.refreshToken);

    // 2. Construct a miswired TokenRefreshService whose tokenRepo incorrectly targets suiaStore
    // instead of rthStore during the refresh operation
    const miswiredTokenRepo = {
      ...mockTokenRepo,
      withDb: vi.fn(() => ({
        createRefreshToken: vi.fn(async (data: any) => suiaStore.createSession(data)), // INJECT WRONG STORE
        findByHash: vi.fn(async (hash: string) => suiaStore.findByHash(hash)), // INJECT WRONG STORE
        consumeToken: vi.fn(async (hash: string, userId: string) => suiaStore.consumeToken(hash, userId)),
      })),
    };

    const miswiredRefreshService = new TokenRefreshService(
      miswiredTokenRepo as any,
      tokenService,
      mockAuditService as any,
      mockUserRepo as any
    );

    // 3. Attempting refresh with miswired store must fail closed because RTH session hash does not exist in suiaStore
    await expect(
      miswiredRefreshService.refresh(
        rthLogin.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'realtutorialhub',
        { deviceId: 'rth-dev-1' }
      )
    ).rejects.toThrow(/Invalid refresh token/);

    // 4. Assert sensitivity: neither store was corrupted or mutated by the miswired execution
    expect(rthStore.sessions.get(rthParentHash)?.revoked).toBe(false);
    expect(suiaStore.sessions.size).toBe(0);
  });
});
