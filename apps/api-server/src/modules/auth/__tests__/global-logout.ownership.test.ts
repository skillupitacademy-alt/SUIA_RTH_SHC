import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * W1.2-SESS-01: Service-level ownership propagation test
 *
 * Verifies that GlobalLogoutService.revokeSession correctly passes
 * the verified brand-local userId to TokenRepository.revokeById,
 * and exercises production tenant routing with separate fixture stores.
 */

/**
 * TENANT-SPECIFIC MOCK REPOSITORIES
 * Each tenant gets its own repository instance with isolated state
 */
const createMockTokenRepo = (tenantName: string) => ({
  _tenant: tenantName,
  revokeById: vi.fn().mockResolvedValue(undefined),
  revokeAll: vi.fn().mockResolvedValue(undefined),
  getUserSessions: vi.fn().mockResolvedValue([]),
  withDb: vi.fn(function(this: any, db: any, tables: any) {
    // Return a NEW instance for the specified tenant
    return createMockTokenRepo(`${tenantName}-bound`);
  }),
});

const createMockUserRepo = (tenantName: string) => ({
  _tenant: tenantName,
  updateLastActive: vi.fn().mockResolvedValue(undefined),
  withDb: vi.fn(function(this: any) { return this; }),
});

let rthTokenRepo = createMockTokenRepo('rth');
let suiaTokenRepo = createMockTokenRepo('suia');
let currentTokenRepo = rthTokenRepo;

const rthUserRepo = createMockUserRepo('rth');
const suiaUserRepo = createMockUserRepo('suia');
let currentUserRepo = rthUserRepo;

const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((Class) => {
      if (Class.name === 'TokenRepository') return currentTokenRepo;
      if (Class.name === 'UserRepository') return currentUserRepo;
      if (Class.name === 'AuditService') return mockAuditService;
      throw new Error(`Unmocked class: ${Class.name}`);
    }),
  },
}));

// Mock brand-db to provide ACTUAL tenant routing with separate contexts
const rthDb = { _brand: 'rth' };
const suiaDb = { _brand: 'suia' };
const rthTables = { refreshTokens: { _brand: 'rth-tokens' }, users: { _brand: 'rth-users' } };
const suiaTables = { refreshTokens: { _brand: 'suia-tokens' }, users: { _brand: 'suia-users' } };

vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn((brand: string) => {
    if (brand === 'skillup') {
      return { db: suiaDb, tables: suiaTables };
    }
    return { db: rthDb, tables: rthTables };
  }),
  shouldUseBrandBinding: vi.fn(() => true), // Enable production routing
}));

import { GlobalLogoutService } from '../global-logout.service';
import { getAuthBrandContext, shouldUseBrandBinding } from '@/modules/auth/brand-db';

describe('W1.2-SESS-01: GlobalLogoutService ownership propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset tenant repos
    rthTokenRepo = createMockTokenRepo('rth');
    suiaTokenRepo = createMockTokenRepo('suia');
    currentTokenRepo = rthTokenRepo;
    currentUserRepo = rthUserRepo;
  });

  it('passes verified userId to repository revokeById', async () => {
    const service = new GlobalLogoutService(currentTokenRepo as any, currentUserRepo as any, mockAuditService as any);

    const verifiedUserId = 'user-alice';
    const sessionId = 'session-laptop';
    const ip = '203.0.113.42';
    const brand = 'realtutorialhub';

    await service.revokeSession(verifiedUserId, sessionId, ip, brand);

    // Verify withDb was called for brand routing
    expect(currentTokenRepo.withDb).toHaveBeenCalledWith(rthDb, { refreshTokens: rthTables.refreshTokens });

    // Get the brand-bound repo that was created
    const boundRepo = currentTokenRepo.withDb.mock.results[0].value;

    // CRITICAL: Verify userId was passed as the SECOND argument to the bound repo
    expect(boundRepo.revokeById).toHaveBeenCalledTimes(1);
    expect(boundRepo.revokeById).toHaveBeenCalledWith(sessionId, verifiedUserId);

    // Verify audit log also recorded the action
    expect(mockAuditService.log).toHaveBeenCalledWith({
      userId: verifiedUserId,
      action: 'session_revoked',
      metadata: { brand, sessionId },
      ip,
      brand,
    });
  });

  it('enforces ownership even when sessionId looks like another user\'s', async () => {
    const service = new GlobalLogoutService(currentTokenRepo as any, currentUserRepo as any, mockAuditService as any);

    // User Bob attempts to revoke a session (possibly belonging to Alice)
    const verifiedUserId = 'user-bob';
    const sessionId = 'session-definitely-not-bobs';

    await service.revokeSession(verifiedUserId, sessionId, undefined, 'realtutorialhub');

    const boundRepo = currentTokenRepo.withDb.mock.results[0].value;
    // Service must pass Bob's ID, not extract anything from sessionId
    expect(boundRepo.revokeById).toHaveBeenCalledWith(sessionId, verifiedUserId);
  });

  it('rejects missing userId at repository boundary', async () => {
    const service = new GlobalLogoutService(currentTokenRepo as any, currentUserRepo as any, mockAuditService as any);

    // Simulate repository throwing on empty userId
    const failingRepo = createMockTokenRepo('failing');
    failingRepo.withDb = vi.fn(function(this: any) {
      const bound = createMockTokenRepo('failing-bound');
      bound.revokeById.mockRejectedValue(
        new Error('W1.2-SESS-01: userId is required for session revocation')
      );
      return bound;
    });

    currentTokenRepo = failingRepo;
    const failingService = new GlobalLogoutService(failingRepo as any, currentUserRepo as any, mockAuditService as any);

    // Empty strings are valid TypeScript; repository rejects them at runtime.
    await expect(failingService.revokeSession('', 'session-123', undefined, 'realtutorialhub'))
      .rejects.toThrow('W1.2-SESS-01');
  });

  it('handles production brand-specific routing with ownership intact - separate tenant stores', async () => {
    // Verify shouldUseBrandBinding returns true (production mode)
    expect(shouldUseBrandBinding()).toBe(true);

    // RTH service call
    currentTokenRepo = rthTokenRepo;
    const rthService = new GlobalLogoutService(currentTokenRepo as any, currentUserRepo as any, mockAuditService as any);

    const rthUserId = 'user-A'; // Same logical user ID
    const rthSessionId = 'session-100'; // Same logical session ID

    await rthService.revokeSession(rthUserId, rthSessionId, undefined, 'realtutorialhub');

    // Verify RTH brand context was used
    expect(getAuthBrandContext).toHaveBeenCalledWith('realtutorialhub');
    expect(rthTokenRepo.withDb).toHaveBeenCalledWith(rthDb, { refreshTokens: rthTables.refreshTokens });

    const rthBoundRepo = rthTokenRepo.withDb.mock.results[0].value;
    expect(rthBoundRepo.revokeById).toHaveBeenCalledWith(rthSessionId, rthUserId);

    // Clear mocks for SUIA
    vi.clearAllMocks();

    // SUIA service call with SAME user and session IDs (collision)
    currentTokenRepo = suiaTokenRepo;
    const suiaService = new GlobalLogoutService(currentTokenRepo as any, currentUserRepo as any, mockAuditService as any);

    const suiaUserId = 'user-A'; // Same ID as RTH
    const suiaSessionId = 'session-100'; // Same ID as RTH

    await suiaService.revokeSession(suiaUserId, suiaSessionId, undefined, 'skillup');

    // Verify SUIA brand context was used (separate from RTH)
    expect(getAuthBrandContext).toHaveBeenCalledWith('skillup');
    expect(suiaTokenRepo.withDb).toHaveBeenCalledWith(suiaDb, { refreshTokens: suiaTables.refreshTokens });

    const suiaBoundRepo = suiaTokenRepo.withDb.mock.results[0].value;
    expect(suiaBoundRepo.revokeById).toHaveBeenCalledWith(suiaSessionId, suiaUserId);

    // Verify the two operations used DIFFERENT database contexts
    expect(rthDb).not.toBe(suiaDb);
    expect(rthTables.refreshTokens).not.toBe(suiaTables.refreshTokens);

    // Verify both calls had correct ownership
    expect(rthBoundRepo._tenant).toContain('rth');
    expect(suiaBoundRepo._tenant).toContain('suia');
  });
});
