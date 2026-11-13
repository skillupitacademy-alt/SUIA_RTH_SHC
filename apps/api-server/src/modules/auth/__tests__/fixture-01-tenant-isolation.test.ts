import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RequestBrand } from '@/lib/request-brand';
import { LoginService } from '../login.service';
import { PasswordService } from '../password.service';
import { TokenService } from '../token.service';

/**
 * FIXTURE-01: Same-Email & Colliding-ID Tenant Isolation Tests
 *
 * Requirements:
 * - Two independent tenant accounts: SUIA (skillup) and RTH (realtutorialhub).
 * - Equal email: learner@example.test on both tenants.
 * - Colliding local user ID: '100' on both tenants.
 * - Distinct disposable test passwords & profile markers.
 * - Isolated in-memory tenant stores/adapters.
 * - Self-contained: explicit disposable cryptographic keys injected into TokenService.
 * - Fail-fast outbound transport guard installed to prevent external calls.
 * - Verified controls:
 *   1. SUIA credentials succeed and resolve SUIA profile/marker.
 *   2. RTH credentials succeed and resolve RTH profile/marker.
 *   3. Cross-tenant password attempts fail closed (invalid credentials).
 *   4. Denied attempts create zero sessions.
 *   5. Store isolation: writes in SUIA cannot alter RTH store.
 *   6. Fixture sensitivity check: wrong-store selection is detected.
 *   7. Existing shadow identity is revalidated through the controlled bridge.
 */

interface InMemUser {
  id: string;
  email: string;
  passwordHash: string;
  isBlocked: boolean;
  emailVerified: boolean;
  userRoles: { role: { name: string } }[];
  profile: { name: string; educationLevel?: string; professionalStatus?: string } | null;
  lastActiveAt?: Date;
  shadowUserId?: string | null;
}

interface InMemSession {
  id: string;
  userId: string;
  token: string;
  revoked: boolean;
  deviceId: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

class InMemTenantStore {
  readonly brand: RequestBrand;
  users: Map<string, InMemUser> = new Map(); // keyed by email
  sessions: InMemSession[] = [];
  updateCalls: any[] = [];

  constructor(brand: RequestBrand) {
    this.brand = brand;
  }

  reset() {
    this.users.clear();
    this.sessions = [];
    this.updateCalls = [];
  }

  addUser(user: InMemUser) {
    this.users.set(user.email.toLowerCase(), { ...user });
  }

  findUserByEmail(email: string): InMemUser | undefined {
    const found = this.users.get(email.toLowerCase());
    return found ? { ...found } : undefined;
  }

  updateLastActive(userId: string) {
    for (const [email, user] of this.users.entries()) {
      if (user.id === userId) {
        user.lastActiveAt = new Date();
        this.users.set(email, user);
      }
    }
  }

  createSession(sessionData: {
    userId: string;
    token: string;
    expiresAt: Date;
    deviceContext?: { deviceId?: string; ipAddress?: string; userAgent?: string; deviceName?: string };
  }): InMemSession {
    const session: InMemSession = {
      id: `sess-${this.brand}-${this.sessions.length + 1}`,
      userId: sessionData.userId,
      token: sessionData.token,
      revoked: false,
      deviceId: sessionData.deviceContext?.deviceId ?? 'unknown-device',
      expiresAt: sessionData.expiresAt,
      ipAddress: sessionData.deviceContext?.ipAddress,
      userAgent: sessionData.deviceContext?.userAgent,
      deviceName: sessionData.deviceContext?.deviceName,
    };
    this.sessions.push(session);
    return { ...session };
  }
}

// Instantiate in-memory tenant stores
const suiaStore = new InMemTenantStore('skillup');
const rthStore = new InMemTenantStore('realtutorialhub');

// Mock identity bridge to spy on sync calls
const mockIdentityBridgeSync = vi.fn();
vi.mock('@quiz/identity-bridge', () => ({
  UserIdentityBridgeService: class {
    syncUser = mockIdentityBridgeSync;
    updateShadowUserId = vi.fn();
  },
}));

// Mock brand-db module to bind brand context to our in-memory tenant stores
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

describe('FIXTURE-01: Same-Email & Colliding-ID Tenant Isolation', () => {
  // Explicit disposable cryptographic keys (minimum 32 bytes)
  const disposableAccessSecret = new TextEncoder().encode('fixture-01-disposable-access-secret-32b!');
  const disposableRefreshSecret = new TextEncoder().encode('fixture-01-disposable-refresh-secret-32b!');
  const disposableAdminSecret = new TextEncoder().encode('fixture-01-disposable-admin-secret-32b!!');

  const passwordService = new PasswordService();
  // Self-contained TokenService with explicit test keys injected directly
  const tokenService = new TokenService(disposableAccessSecret, disposableRefreshSecret, disposableAdminSecret);

  const mockAuditService = {
    log: vi.fn().mockResolvedValue(undefined),
  };

  const mockSecurityService: any = {
    isAccountLocked: vi.fn().mockResolvedValue(false),
    trackLoginAttempt: vi.fn().mockResolvedValue(undefined),
    withContext: vi.fn(() => mockSecurityService),
  };

  // Adapter repository wrapping tenant store
  const mockUserRepo = {
    findWithDetails: vi.fn(async (_email: string) => undefined),
    updateLastActive: vi.fn().mockResolvedValue(undefined),
    withDb: vi.fn((dbStore: InMemTenantStore) => {
      return {
        findWithDetails: vi.fn(async (email: string) => dbStore.findUserByEmail(email)),
        updateLastActive: vi.fn(async (userId: string) => dbStore.updateLastActive(userId)),
      };
    }),
  };

  const mockTokenRepo = {
    createRefreshToken: vi.fn().mockResolvedValue(undefined),
    withDb: vi.fn((dbStore: InMemTenantStore) => {
      return {
        createRefreshToken: vi.fn(async (data: any) => {
          return dbStore.createSession(data);
        }),
      };
    }),
  };

  const SHARED_SYNTHETIC_EMAIL = 'learner@example.test';
  const COLLIDING_LOCAL_USER_ID = '100';

  const SUIA_PASSWORD = 'Password-SUIA-Secret!1';
  const RTH_PASSWORD = 'Password-RTH-Secret!2';

  const originalFetch = globalThis.fetch;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockIdentityBridgeSync.mockReset();
    mockIdentityBridgeSync.mockImplementation(async (input: { expectedShadowUserId?: string }) => ({ shadowUserId: input.expectedShadowUserId, created: false }));
    suiaStore.reset();
    rthStore.reset();

    // Install fail-fast outbound network guard
    globalThis.fetch = vi.fn(() => {
      throw new Error('Outbound network transport blocked in isolated fixture');
    });

    // Seed SUIA account with colliding ID and shared email
    const suiaPasswordHash = await passwordService.hash(SUIA_PASSWORD);
    suiaStore.addUser({
      id: COLLIDING_LOCAL_USER_ID,
      email: SHARED_SYNTHETIC_EMAIL,
      passwordHash: suiaPasswordHash,
      isBlocked: false,
      emailVerified: true,
      userRoles: [{ role: { name: 'student' } }],
      profile: { name: 'SUIA Learner Profile', educationLevel: 'College', professionalStatus: 'Student' },
      shadowUserId: 'shadow-suia-100',
    });

    // Seed RTH account with colliding ID, shared email, but DIFFERENT password and profile
    const rthPasswordHash = await passwordService.hash(RTH_PASSWORD);
    rthStore.addUser({
      id: COLLIDING_LOCAL_USER_ID,
      email: SHARED_SYNTHETIC_EMAIL,
      passwordHash: rthPasswordHash,
      isBlocked: false,
      emailVerified: true,
      userRoles: [{ role: { name: 'student' } }],
      profile: { name: 'RTH Learner Profile', educationLevel: 'Graduate', professionalStatus: 'Developer' },
      shadowUserId: 'shadow-rth-100',
    });
  });

  afterEach(() => {
    // Restore global fetch
    globalThis.fetch = originalFetch;
  });

  it('Control 1: SUIA credentials authenticate against SUIA store and resolve SUIA profile only', async () => {
    const loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService as any,
      tokenService
    );

    const result = await loginService.login(
      SHARED_SYNTHETIC_EMAIL,
      SUIA_PASSWORD,
      '192.0.2.1',
      'skillup',
      { deviceId: 'dev-suia-1' }
    );

    // Verify resolved principal
    expect(result._user.id).toBe(COLLIDING_LOCAL_USER_ID);
    expect(result._user.email).toBe(SHARED_SYNTHETIC_EMAIL);
    expect(result._user.profile?.name).toBe('SUIA Learner Profile');
    expect(result.isAdmin).toBe(false);
    expect(result.shadowUserId).toBe('shadow-suia-100');

    // The persisted shadow link is revalidated without changing the selected identity.
    expect(mockIdentityBridgeSync).toHaveBeenCalledWith(expect.objectContaining({ externalId: COLLIDING_LOCAL_USER_ID, platform: 'skillup', expectedShadowUserId: 'shadow-suia-100' }));

    // Verify session stored ONLY in SUIA store
    expect(suiaStore.sessions.length).toBe(1);
    expect(suiaStore.sessions[0].userId).toBe(COLLIDING_LOCAL_USER_ID);
    expect(suiaStore.sessions[0].deviceId).toBe('dev-suia-1');

    // Verify RTH store remains untouched
    expect(rthStore.sessions.length).toBe(0);
  });

  it('Control 2: RTH credentials authenticate against RTH store and resolve RTH profile only', async () => {
    const loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService as any,
      tokenService
    );

    const result = await loginService.login(
      SHARED_SYNTHETIC_EMAIL,
      RTH_PASSWORD,
      '192.0.2.2',
      'realtutorialhub',
      { deviceId: 'dev-rth-1' }
    );

    // Verify resolved principal
    expect(result._user.id).toBe(COLLIDING_LOCAL_USER_ID);
    expect(result._user.email).toBe(SHARED_SYNTHETIC_EMAIL);
    expect(result._user.profile?.name).toBe('RTH Learner Profile');
    expect(result.isAdmin).toBe(false);
    expect(result.shadowUserId).toBe('shadow-rth-100');

    // The persisted shadow link is revalidated without changing the selected identity.
    expect(mockIdentityBridgeSync).toHaveBeenCalledWith(expect.objectContaining({ externalId: COLLIDING_LOCAL_USER_ID, platform: 'realtutorialhub', expectedShadowUserId: 'shadow-rth-100' }));

    // Verify session stored ONLY in RTH store
    expect(rthStore.sessions.length).toBe(1);
    expect(rthStore.sessions[0].userId).toBe(COLLIDING_LOCAL_USER_ID);
    expect(rthStore.sessions[0].deviceId).toBe('dev-rth-1');

    // Verify SUIA store remains untouched
    expect(suiaStore.sessions.length).toBe(0);
  });

  it('Control 3: Cross-tenant password attempt (SUIA with RTH password) fails fail-closed', async () => {
    const loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService as any,
      tokenService
    );

    await expect(
      loginService.login(
        SHARED_SYNTHETIC_EMAIL,
        RTH_PASSWORD, // WRONG password for SUIA
        '192.0.2.3',
        'skillup'
      )
    ).rejects.toThrow('Invalid credentials');

    // Assert zero sessions created in either store
    expect(suiaStore.sessions.length).toBe(0);
    expect(rthStore.sessions.length).toBe(0);
    expect(mockIdentityBridgeSync).toHaveBeenCalledTimes(0);
  });

  it('Control 4: Cross-tenant password attempt (RTH with SUIA password) fails fail-closed', async () => {
    const loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService as any,
      tokenService
    );

    await expect(
      loginService.login(
        SHARED_SYNTHETIC_EMAIL,
        SUIA_PASSWORD, // WRONG password for RTH
        '192.0.2.4',
        'realtutorialhub'
      )
    ).rejects.toThrow('Invalid credentials');

    // Assert zero sessions created in either store
    expect(suiaStore.sessions.length).toBe(0);
    expect(rthStore.sessions.length).toBe(0);
    expect(mockIdentityBridgeSync).toHaveBeenCalledTimes(0);
  });

  it('Control 5: Denied attempt creates no sessions where the contract requires', async () => {
    const loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService as any,
      tokenService
    );

    await expect(
      loginService.login('unknown@example.test', 'RandomPassword123!', '192.0.2.5', 'skillup')
    ).rejects.toThrow('Invalid credentials');

    expect(suiaStore.sessions.length).toBe(0);
    expect(rthStore.sessions.length).toBe(0);
    expect(mockIdentityBridgeSync).toHaveBeenCalledTimes(0);
  });

  it('Control 6: Store isolation: sequential writes to SUIA do not alter or contaminate RTH store', async () => {
    const loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService as any,
      tokenService
    );

    // 1. SUIA login creates session 1
    await loginService.login(SHARED_SYNTHETIC_EMAIL, SUIA_PASSWORD, '192.0.2.1', 'skillup', { deviceId: 'suia-d1' });
    // 2. SUIA login creates session 2
    await loginService.login(SHARED_SYNTHETIC_EMAIL, SUIA_PASSWORD, '192.0.2.1', 'skillup', { deviceId: 'suia-d2' });

    expect(suiaStore.sessions.length).toBe(2);
    expect(rthStore.sessions.length).toBe(0);

    // 3. RTH login creates session 1
    await loginService.login(SHARED_SYNTHETIC_EMAIL, RTH_PASSWORD, '192.0.2.2', 'realtutorialhub', { deviceId: 'rth-d1' });

    expect(suiaStore.sessions.length).toBe(2);
    expect(rthStore.sessions.length).toBe(1);

    // Confirm session identifiers are cleanly partitioned by tenant
    expect(suiaStore.sessions.every(s => s.id.startsWith('sess-skillup'))).toBe(true);
    expect(rthStore.sessions.every(s => s.id.startsWith('sess-realtutorialhub'))).toBe(true);
  });

  it('Control 7: Fixture sensitivity check: wrong-store selection is detected and fails', async () => {
    // Deliberately construct a misdirected adapter: requesting SUIA returns RTH store
    const misdirectedBrandContext = vi.fn((brand: RequestBrand) => {
      // INVERTED: routing SUIA to RTH store
      const invertedStore = brand === 'skillup' ? rthStore : suiaStore;
      return {
        db: invertedStore,
        tables: {
          users: { name: `${invertedStore.brand}_users` },
          refreshTokens: { name: `${invertedStore.brand}_refresh_tokens` },
        },
      };
    });

    const { getAuthBrandContext } = await import('@/modules/auth/brand-db');
    (getAuthBrandContext as any).mockImplementationOnce(misdirectedBrandContext);

    const loginService = new LoginService(
      mockUserRepo as any,
      mockTokenRepo as any,
      mockAuditService as any,
      passwordService,
      mockSecurityService as any,
      tokenService
    );

    // Attempting SUIA login with SUIA password when store was inverted MUST FAIL
    // because the RTH store holds the RTH password hash!
    await expect(
      loginService.login(SHARED_SYNTHETIC_EMAIL, SUIA_PASSWORD, '192.0.2.99', 'skillup')
    ).rejects.toThrow('Invalid credentials');
  });
});
