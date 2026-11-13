import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { container } from '@/modules/core/container';
import { TokenService } from '../token.service';
import { requireAdminRouteAccess } from '../admin-audience.util';
import { SHCAuthService } from '../shc-auth.service';

/**
 * FIXTURE-02: Real Admin-Guard Principal-Boundary Tests
 *
 * Requirements:
 * - Test actual requireAdminRouteAccess / verification chain in admin-audience.util.ts.
 * - Real cryptographic token verification with disposable test keys.
 * - Spy on the database query entry (db.select) to prove zero queries on early denials.
 * - Clean teardown: restore the exact original container TokenService instance.
 * - Isolate cryptographic signature rejection from audience and token-class rejection:
 *   1. Distinct-key controls (signature failure boundary).
 *   2. Shared-key promoted-learner control (valid signature; audience failure boundary).
 *   3. Wrong-audience control with valid admin signature (audience failure boundary).
 *   4. Wrong-token-class control with valid admin signature and matching audience (token class failure boundary).
 *   5. Separate caller contracts: Tenant Admin, SkillHubCore Governance, Infrastructure.
 *   6. Blocked account database defense.
 *   7. Sensitivity check: proving audience/class bypass is detected.
 */

// Mock metrics recording
vi.mock('@/lib/metrics', () => ({
  recordCounter: vi.fn(),
  recordTimer: vi.fn(),
}));

// Mock DB context for _verifyAdmin
const mockSelectUsers = vi.fn();
const mockSelectRoles = vi.fn();
const mockDbSelectEntry = vi.fn();

vi.mock('@/modules/auth/brand-db', () => ({
  shouldUseBrandBinding: vi.fn(() => true),
  getAuthBrandContext: vi.fn(() => ({
    db: {
      select: vi.fn((fields: any) => {
        mockDbSelectEntry(fields);
        // If selecting isBlocked from users table
        if (fields && fields.isBlocked !== undefined) {
          return {
            from: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(async () => mockSelectUsers()),
              })),
            })),
          };
        }
        // Fallback role query
        return {
          from: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn(() => ({
                limit: vi.fn(async () => mockSelectRoles()),
              })),
            })),
          })),
        };
      }),
    },
    tables: {
      users: { id: 'users.id', isBlocked: 'users.isBlocked' },
      userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
      roles: { id: 'roles.id', name: 'roles.name' },
    },
  })),
}));

describe('FIXTURE-02: Real Admin-Guard Principal-Boundary Tests', () => {
  // Capture original container singleton before test suite runs
  const originalContainerTokenService = container.get(TokenService);

  // Distinct disposable cryptographic keys (min 32 bytes)
  const distinctAccessSecret = new TextEncoder().encode('distinct-access-secret-32-bytes!');
  const distinctRefreshSecret = new TextEncoder().encode('distinct-refresh-secret-32-byte!');
  const distinctAdminSecret = new TextEncoder().encode('distinct-admin-secret-32-bytes!!');

  // Shared disposable cryptographic key (simulating ADMIN_JWT_SECRET ?? JWT_SECRET fallback)
  const sharedSecret = new TextEncoder().encode('shared-access-and-admin-key-32b!');

  let distinctTokenService: TokenService;
  let sharedTokenService: TokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectUsers.mockReset();
    mockSelectRoles.mockReset();
    mockDbSelectEntry.mockReset();

    // Create real TokenService instances with disposable keys
    distinctTokenService = new TokenService(distinctAccessSecret, distinctRefreshSecret, distinctAdminSecret);
    sharedTokenService = new TokenService(sharedSecret, distinctRefreshSecret, sharedSecret);

    // Default container registration to distinct-key service
    container.register(TokenService, distinctTokenService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Restore the precise container instance after every test
    container.register(TokenService, originalContainerTokenService);
  });

  const createAdminRequest = (token?: string, headers: Record<string, string> = {}): NextRequest => {
    const headerObj: Record<string, string> = { ...headers };
    if (token) {
      // Set via admin_accessToken cookie (scope: admin)
      headerObj['cookie'] = `admin_accessToken=${token}`;
    }
    return new NextRequest('http://localhost:3000/api/admin/users', { headers: headerObj });
  };

  // =========================================================================
  // Group 1: Distinct-Key Controls (Cryptographic Signature Boundary)
  // =========================================================================

  it('Control 1: Legitimate tenant-admin positive control succeeds and verifies active account in DB', async () => {
    const validAdminToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-admin-1',
      shadowUserId: 'sh-admin-1',
      email: 'admin@realtutorialhub.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'realtutorialhub',
      aud: 'admin',
    });

    // Mock tenant DB: user exists and is active (not blocked)
    mockSelectUsers.mockResolvedValueOnce([{ isBlocked: false }]);

    const req = createAdminRequest(validAdminToken);
    const payload = await requireAdminRouteAccess(req);

    expect(payload.userId).toBe('usr-admin-1');
    expect(payload.isAdmin).toBe(true);
    expect(payload.tokenType).toBe('admin');
    expect(payload.aud).toBe('admin');
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(1);
    expect(mockSelectUsers).toHaveBeenCalledTimes(1);
  });

  it('Control 2: Distinct-key control: learner token signed with access secret fails at signature verification', async () => {
    // Minted under distinctAccessSecret
    const learnerToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-learner-1',
      shadowUserId: 'sh-learner-1',
      email: 'learner@realtutorialhub.test',
      roles: ['student'],
      isAdmin: false,
      tokenType: 'user',
      brand: 'realtutorialhub',
      aud: 'user',
    });

    const req = createAdminRequest(learnerToken);

    // Rejected at signature verification because ADMIN_SECRET differs from ACCESS_SECRET
    await expect(requireAdminRouteAccess(req)).rejects.toThrow();

    // Invariant: zero tenant database query initiated
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  // =========================================================================
  // Group 2: Isolated Audience and Token-Class Defenses (Shared-Key Fallback)
  // =========================================================================

  it('Control 3: Promoted learner account with valid signature fails strictly at AUDIENCE check before DB query', async () => {
    // Configure container with shared-key TokenService (ACCESS_SECRET === ADMIN_SECRET)
    container.register(TokenService, sharedTokenService);

    // Database fixture: learner account has been promoted to 'admin' in PostgreSQL!
    mockSelectUsers.mockResolvedValue([{ isBlocked: false }]);
    mockSelectRoles.mockResolvedValue([{ name: 'admin' }]);

    // Token was minted under learner session (aud: 'user', tokenType: 'user', isAdmin: false)
    // Because keys are shared, signature verification will SUCCEED against the admin verifier!
    const promotedLearnerToken = await sharedTokenService.generateAccessToken({
      userId: 'usr-promoted-1',
      shadowUserId: 'sh-promoted-1',
      email: 'promoted@realtutorialhub.test',
      roles: ['student'],
      isAdmin: false,
      tokenType: 'user',
      brand: 'realtutorialhub',
      aud: 'user',
    });

    const req = createAdminRequest(promotedLearnerToken);

    // Verify the precise cryptographic-policy boundary and the public guard contract.
    await expect(sharedTokenService.verifyAdminAccessToken(promotedLearnerToken, { audience: 'admin' }))
      .rejects.toThrow(/Audience mismatch: expected admin, got user/);
    await expect(requireAdminRouteAccess(req)).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });

    // Invariant: Zero DB queries initiated. Promoted DB role is NEVER queried or consulted.
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
    expect(mockSelectRoles).toHaveBeenCalledTimes(0);
  });

  it('Control 4: Wrong audience with valid signature fails strictly at AUDIENCE check', async () => {
    // Admin token signed with ADMIN_SECRET, but with aud: 'shc-admin' presented to default admin route
    const wrongAudienceToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-admin-wrong-aud',
      shadowUserId: 'sh-admin-wrong-aud',
      email: 'admin@realtutorialhub.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'realtutorialhub',
      aud: 'shc-admin', // Expected 'admin'
    });

    const req = createAdminRequest(wrongAudienceToken);

    // Signature passes; fails strictly at audience check
    await expect(distinctTokenService.verifyAdminAccessToken(wrongAudienceToken, { audience: 'admin' }))
      .rejects.toThrow(/Audience mismatch: expected admin, got shc-admin/);
    await expect(requireAdminRouteAccess(req)).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  it('Control 5: Wrong token class with valid signature and expected audience fails strictly at TOKEN TYPE check', async () => {
    // Admin verifier expects tokenType === 'admin'.
    // Here we mint a token with valid admin signature, aud: 'admin', but tokenType: 'user'.
    const wrongClassToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-wrong-class',
      shadowUserId: 'sh-wrong-class',
      email: 'wrong-class@realtutorialhub.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'user', // Contradictory: user token type attempting admin route
      brand: 'realtutorialhub',
      aud: 'admin',
    });

    const req = createAdminRequest(wrongClassToken);

    // Signature passes, audience passes; fails strictly on tokenType
    await expect(distinctTokenService.verifyAdminAccessToken(wrongClassToken, { audience: 'admin' }))
      .rejects.toThrow(/Invalid admin token type/);
    await expect(requireAdminRouteAccess(req)).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  // =========================================================================
  // Group 3: Caller Authentication & Principal Contracts
  // =========================================================================

  it('Control 6: Missing token throws unauthorized', async () => {
    const req = createAdminRequest(); // No token provided
    await expect(requireAdminRouteAccess(req)).rejects.toThrow('Unauthorized');
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  it('Control 7: Invalid signature from rogue secret throws verification error', async () => {
    const rogueTokenService = new TokenService(
      distinctAccessSecret,
      distinctRefreshSecret,
      new TextEncoder().encode('rogue-attacker-secret-32-chars-x!')
    );
    const forgedToken = await rogueTokenService.generateAccessToken({
      userId: 'usr-forged',
      shadowUserId: 'sh-forged',
      email: 'forged@realtutorialhub.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'realtutorialhub',
      aud: 'admin',
    });

    const req = createAdminRequest(forgedToken);
    await expect(requireAdminRouteAccess(req)).rejects.toThrow();
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  it('Control 8: valid SHC admin uses current PeopleDB authority with no tenant database query', async () => {
    const currentAccount = vi.spyOn(SHCAuthService.prototype, 'me').mockResolvedValue({
      id: 'usr-shc-1', email: 'governance@skillhubcore.test', role: 'admin',
      platform: 'skillhubcore', isActive: true, createdAt: new Date(),
    });
    const shcToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-shc-1',
      shadowUserId: 'sh-shc-1',
      email: 'governance@skillhubcore.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: 'shc-admin',
    });

    const req = createAdminRequest(shcToken, { 'x-portal-identity': 'shc-admin' });
    const payload = await requireAdminRouteAccess(req);

    expect(payload.userId).toBe('usr-shc-1');
    expect(payload.brand).toBe('skillhubcore');
    expect(payload.aud).toBe('shc-admin');
    expect(currentAccount).toHaveBeenCalledWith('usr-shc-1');
    // SHC governance uses the PeopleDB authority. Tenant data remains untouched.
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  it('Control 9: Distinct contract: SHC admin token with insufficient roles throws forbidden', async () => {
    const shcViewerToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-shc-viewer',
      shadowUserId: 'sh-shc-viewer',
      email: 'viewer@skillhubcore.test',
      roles: ['viewer'], // Missing admin / super_admin / infrastructure
      isAdmin: true,
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: 'shc-admin',
    });

    const req = createAdminRequest(shcViewerToken, { 'x-portal-identity': 'shc-admin' });
    await expect(requireAdminRouteAccess(req)).rejects.toThrow('SkillHubCore admin access only');
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  it('Control 10: Distinct contract: valid infra token with x-portal-identity: infrastructure succeeds', async () => {
    const infraToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-infra-1',
      shadowUserId: 'sh-infra-1',
      email: 'infra@infrastructure.test',
      roles: ['infrastructure'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'realtutorialhub',
      aud: 'infra',
    });

    const req = createAdminRequest(infraToken, { 'x-portal-identity': 'infrastructure' });
    const payload = await requireAdminRouteAccess(req);

    expect(payload.userId).toBe('usr-infra-1');
    expect(payload.aud).toBe('infra');
    // Invariant: Infra route contract in requireAdminRouteAccess bypasses _verifyAdmin
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });

  it('Control 11: Blocked tenant admin in database throws forbidden fail-closed', async () => {
    const validAdminToken = await distinctTokenService.generateAccessToken({
      userId: 'usr-admin-blocked',
      shadowUserId: 'sh-admin-blocked',
      email: 'blocked-admin@realtutorialhub.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'realtutorialhub',
      aud: 'admin',
    });

    // Mock DB: user exists but isBlocked === true
    mockSelectUsers.mockResolvedValueOnce([{ isBlocked: true }]);

    const req = createAdminRequest(validAdminToken);
    await expect(requireAdminRouteAccess(req)).rejects.toThrow('Admin access only');
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(1);
    expect(mockSelectUsers).toHaveBeenCalledTimes(1);
  });

  // =========================================================================
  // Group 4: Fixture Sensitivity Check
  // =========================================================================

  it('Control 12: independent admin class defense survives a faulty token verifier', async () => {
    container.register(TokenService, sharedTokenService);

    const promotedLearnerToken = await sharedTokenService.generateAccessToken({
      userId: 'usr-promoted-2',
      shadowUserId: 'sh-promoted-2',
      email: 'promoted2@realtutorialhub.test',
      roles: ['student'],
      isAdmin: false,
      tokenType: 'user',
      brand: 'realtutorialhub',
      aud: 'user',
    });

    const req = createAdminRequest(promotedLearnerToken);

    await expect(requireAdminRouteAccess(req)).rejects.toMatchObject({ status: 401, code: 'UNAUTHORIZED' });
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);

    // Fault injection verifies the separate RBAC class boundary after verification.
    const learnerPayload = await sharedTokenService.verifyUserAccessToken(promotedLearnerToken);
    vi.spyOn(sharedTokenService, 'verifyAdminAccessToken').mockResolvedValueOnce(learnerPayload);
    await expect(requireAdminRouteAccess(req)).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(mockDbSelectEntry).toHaveBeenCalledTimes(0);
  });
});
