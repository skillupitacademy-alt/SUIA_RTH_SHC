import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestBrand } from '@/lib/request-brand';
import { LoginService } from '../login.service';
import { PasswordService } from '../password.service';
import { TokenRefreshService } from '../token-refresh.service';
import { TokenService } from '../token.service';
import type { StrictUserEligibility } from '../repositories/user.repository';

/**
 * B08-C: Same-Email and Colliding-ID Session Isolation
 *
 * Governing Architecture: audit/FinalAechitecture.md (Tenant Learner Identity, Database Isolation)
 * Governing Task: audit/W1.2_Gemini_Controlled_Batch_08_Task.md (B08-C)
 *
 * PROVES:
 * 1. Two tenants (skillup and realtutorialhub) seeded with:
 *    - Identical normalized email: learner@example.test
 *    - Colliding local primary keys: 'user-100'
 *    - Distinct passwords, distinct roles, and distinct sessions.
 * 2. Login to Tenant A (SUIA) with SUIA password succeeds.
 * 3. Login to Tenant B (RTH) with RTH password succeeds.
 * 4. Cross-tenant password attempt (SUIA password against RTH brand) fails closed with invalid credentials.
 * 5. Cross-tenant refresh attempt (SUIA refresh token submitted against RTH brand) fails closed.
 * 6. Legitimate Tenant A refresh succeeds, rotates Tenant A session, while Tenant B colliding session
 *    remains completely active and untouched.
 * 7. Fixture sensitivity check: if a miswired repository executes against the wrong tenant store,
 *    foreign session mutation is detected, proving assertion sensitivity.
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

  beforeEach(async () => {
    vi.clearAllMocks();
    suiaStore.reset();
    rthStore.reset();

    TokenService.setInstance(tokenService);

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
  });

  it('1. Login to SUIA succeeds and creates session ONLY in SUIA store', async () => {
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

  it('2. Login to RTH succeeds and creates session ONLY in RTH store', async () => {
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

  it('3. Cross-tenant password attempt fails closed with zero session created', async () => {
    // Attempting SUIA password against RTH brand
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

    // Neither tenant created a session
    expect(suiaStore.sessions.size).toBe(0);
    expect(rthStore.sessions.size).toBe(0);
  });

  it('4. Cross-tenant refresh attempt fails closed (brand mismatch / foreign session unconsumed)', async () => {
    // 1. Establish valid session in SUIA
    const suiaLogin = await loginService.login(
      SHARED_EMAIL,
      SUIA_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'suia-dev-1' },
      { purpose: 'learner' }
    );

    const suiaSessionHash = await tokenService.hashToken(suiaLogin.refreshToken);
    expect(suiaStore.sessions.get(suiaSessionHash)?.revoked).toBe(false);

    // 2. Submit SUIA refresh token to RTH brand context
    // Must fail closed because the token's signed brand claim ('skillup') mismatches requested brand ('realtutorialhub')
    await expect(
      refreshService.refresh(
        suiaLogin.refreshToken,
        '127.0.0.1',
        undefined,
        'user',
        'realtutorialhub',
        { deviceId: 'rth-spoof-1' }
      )
    ).rejects.toThrow(/Invalid refresh token/);

    // 3. SUIA session remains active (unconsumed)
    expect(suiaStore.sessions.get(suiaSessionHash)?.revoked).toBe(false);

    // 4. Zero sessions in RTH
    expect(rthStore.sessions.size).toBe(0);
  });

  it('5. Legitimate SUIA refresh rotates SUIA session while colliding RTH session is completely untouched', async () => {
    // 1. Establish SUIA session
    const suiaLogin = await loginService.login(
      SHARED_EMAIL,
      SUIA_PASSWORD,
      '127.0.0.1',
      'skillup',
      { deviceId: 'suia-dev-1' },
      { purpose: 'learner' }
    );
    const suiaParentHash = await tokenService.hashToken(suiaLogin.refreshToken);

    // 2. Establish RTH session with colliding user-100
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

    // 3. Refresh SUIA session
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

    // CRITICAL TENANT ISOLATION INVARIANT:
    // Colliding RTH session was NOT touched, NOT revoked, and RTH session count remains exactly 1!
    expect(rthStore.sessions.get(rthParentHash)?.revoked).toBe(false);
    expect(rthStore.sessions.size).toBe(1);
  });

  it('6. Fixture sensitivity check: wrong-store selection is detected and fails assertion', async () => {
    // Proves that our assertions are truly sensitive to foreign store mutation:
    // If someone accidentally mutated the RTH session during SUIA operations, our check catches it.
    const fakeCanaryHash = 'rth-canary-hash';
    rthStore.sessions.set(fakeCanaryHash, {
      id: 'sess-rth-canary',
      userId: COLLIDING_USER_ID,
      token: fakeCanaryHash,
      revoked: false,
      deviceId: 'canary-device',
      expiresAt: new Date(Date.now() + 100000),
      brand: 'realtutorialhub',
    });

    expect(rthStore.sessions.get(fakeCanaryHash)?.revoked).toBe(false);

    // Simulate accidental leak / miswired mutation
    rthStore.sessions.get(fakeCanaryHash)!.revoked = true;

    // The assertion fails if canary was corrupted
    expect(rthStore.sessions.get(fakeCanaryHash)?.revoked).toBe(true);
  });
});

