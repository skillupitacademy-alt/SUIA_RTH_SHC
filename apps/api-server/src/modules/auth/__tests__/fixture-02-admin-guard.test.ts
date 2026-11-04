import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { container } from '@/modules/core/container';
import { TokenService } from '../token.service';
import { requireAdminRouteAccess } from '../admin-audience.util';

/**
 * FIXTURE-02: Real Admin-Guard Principal-Boundary Tests
 *
 * Requirements:
 * - Test actual requireAdminRouteAccess / verification chain in admin-audience.util.ts.
 * - Real cryptographic token verification with disposable test keys.
 * - Stub tenant DB/metrics/infrastructure only, NOT the target verifier's allow/deny logic.
 * - Controls:
 *   1. Legitimate tenant-admin positive control.
 *   2. Correctly signed learner token at admin boundary -> fails fail-closed before DB queries.
 *   3. Promoted learner account with in-flight learner token -> denied at token boundary before DB role query.
 *   4. Missing token -> throws unauthorized.
 *   5. Invalid signature -> throws verification error.
 *   6. Incompatible principal / audience -> throws audience mismatch.
 *   7. Distinct route contract: valid SHC admin with x-portal-identity: shc-admin.
 *   8. Distinct route contract: SHC admin token with insufficient roles -> throws forbidden.
 *   9. Distinct route contract: valid infra token with x-portal-identity: infrastructure.
 *   10. Blocked admin in DB -> throws forbidden.
 */

// Mock metrics recording
vi.mock('@/lib/metrics', () => ({
  recordCounter: vi.fn(),
  recordTimer: vi.fn(),
}));

// Mock DB context for _verifyAdmin
const mockSelectUsers = vi.fn();
const mockSelectRoles = vi.fn();

vi.mock('@/modules/auth/brand-db', () => ({
  shouldUseBrandBinding: vi.fn(() => true),
  getAuthBrandContext: vi.fn(() => ({
    db: {
      select: vi.fn((fields: any) => {
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
  // Disposable cryptographic test keys (min 32 bytes)
  const disposableAccessSecret = new TextEncoder().encode('test-access-secret-32-chars-long!');
  const disposableRefreshSecret = new TextEncoder().encode('test-refresh-secret-32-chars-long!');
  const disposableAdminSecret = new TextEncoder().encode('test-admin-secret-32-chars-long!!');

  let tokenService: TokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectUsers.mockReset();
    mockSelectRoles.mockReset();

    // Create real TokenService with disposable test keys
    tokenService = new TokenService(disposableAccessSecret, disposableRefreshSecret, disposableAdminSecret);
    container.register(TokenService, tokenService);
  });

  const createAdminRequest = (token?: string, headers: Record<string, string> = {}): NextRequest => {
    const headerObj: Record<string, string> = { ...headers };
    if (token) {
      // Set via admin_accessToken cookie (scope: admin)
      headerObj['cookie'] = `admin_accessToken=${token}`;
    }
    return new NextRequest('http://localhost:3000/api/admin/users', { headers: headerObj });
  };

  it('Control 1: Legitimate tenant-admin positive control succeeds and returns payload', async () => {
    // Generate valid tenant admin token signed with ADMIN_SECRET
    const validAdminToken = await tokenService.generateAccessToken({
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
    expect(mockSelectUsers).toHaveBeenCalledTimes(1);
  });

  it('Control 2: Correctly signed learner token at admin boundary fails closed before DB queries', async () => {
    // Generate valid learner token signed with ACCESS_SECRET
    const learnerToken = await tokenService.generateAccessToken({
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

    // Must be rejected fail-closed at cryptographic token verification stage
    await expect(requireAdminRouteAccess(req)).rejects.toThrow();

    // Crucial security invariant: rejection occurred BEFORE any tenant DB query
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
    expect(mockSelectRoles).toHaveBeenCalledTimes(0);
  });

  it('Control 3: Promoted learner account with in-flight learner token cannot gain admin access', async () => {
    // Database fixture: the learner account NOW has an 'admin' role in PostgreSQL!
    mockSelectUsers.mockResolvedValue([{ isBlocked: false }]);
    mockSelectRoles.mockResolvedValue([{ name: 'admin' }]);

    // BUT the token presented was minted as a learner token (aud: 'user', tokenType: 'user', isAdmin: false)
    const inFlightLearnerToken = await tokenService.generateAccessToken({
      userId: 'usr-promoted-1',
      shadowUserId: 'sh-promoted-1',
      email: 'promoted@realtutorialhub.test',
      roles: ['student'],
      isAdmin: false,
      tokenType: 'user',
      brand: 'realtutorialhub',
      aud: 'user',
    });

    const req = createAdminRequest(inFlightLearnerToken);

    // Must NOT gain admin access
    await expect(requireAdminRouteAccess(req)).rejects.toThrow();

    // Invariant: DB role query is NEVER reached because token boundary failed closed
    expect(mockSelectRoles).toHaveBeenCalledTimes(0);
  });

  it('Control 4: Missing token throws unauthorized', async () => {
    const req = createAdminRequest(); // No token
    await expect(requireAdminRouteAccess(req)).rejects.toThrow('Unauthorized');
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
  });

  it('Control 5: Invalid signature throws verification error', async () => {
    // Token signed with an unrelated rogue secret
    const rogueTokenService = new TokenService(
      disposableAccessSecret,
      disposableRefreshSecret,
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
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
  });

  it('Control 6: Incompatible principal/audience throws audience mismatch', async () => {
    // Token minted with aud: 'shc-admin' but arriving at default tenant admin route without header
    const shcToken = await tokenService.generateAccessToken({
      userId: 'usr-shc-1',
      shadowUserId: 'sh-shc-1',
      email: 'admin@skillhubcore.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: 'shc-admin',
    });

    const req = createAdminRequest(shcToken); // Default portal identity expects 'admin'
    await expect(requireAdminRouteAccess(req)).rejects.toThrow(/Audience mismatch/);
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
  });

  it('Control 7: Distinct route contract: valid SHC admin token with x-portal-identity: shc-admin succeeds', async () => {
    const shcToken = await tokenService.generateAccessToken({
      userId: 'usr-shc-2',
      shadowUserId: 'sh-shc-2',
      email: 'governance@skillhubcore.test',
      roles: ['admin'],
      isAdmin: true,
      tokenType: 'admin',
      brand: 'skillhubcore',
      aud: 'shc-admin',
    });

    const req = createAdminRequest(shcToken, { 'x-portal-identity': 'shc-admin' });
    const payload = await requireAdminRouteAccess(req);

    expect(payload.userId).toBe('usr-shc-2');
    expect(payload.brand).toBe('skillhubcore');
    expect(payload.aud).toBe('shc-admin');
    // Invariant: SHC admin check evaluates in-memory and NEVER queries tenant users table
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
  });

  it('Control 8: Distinct route contract: SHC admin token with insufficient roles throws forbidden', async () => {
    const shcViewerToken = await tokenService.generateAccessToken({
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
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
  });

  it('Control 9: Distinct route contract: valid infra token with x-portal-identity: infrastructure succeeds', async () => {
    const infraToken = await tokenService.generateAccessToken({
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
    expect(mockSelectUsers).toHaveBeenCalledTimes(0);
  });

  it('Control 10: Blocked tenant admin in database throws forbidden', async () => {
    const validAdminToken = await tokenService.generateAccessToken({
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
    expect(mockSelectUsers).toHaveBeenCalledTimes(1);
  });
});
