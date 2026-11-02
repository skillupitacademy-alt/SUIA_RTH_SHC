import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * W1.2-SESS-01: Service-level ownership propagation test
 * 
 * Verifies that GlobalLogoutService.revokeSession correctly passes
 * the verified brand-local userId to TokenRepository.revokeById.
 */

const mockTokenRepo = {
  revokeById: vi.fn().mockResolvedValue(undefined),
  revokeAll: vi.fn().mockResolvedValue(undefined),
  getUserSessions: vi.fn().mockResolvedValue([]),
  withDb: vi.fn(function(this: any) { return this; }),
};

const mockUserRepo = {
  updateLastActive: vi.fn().mockResolvedValue(undefined),
  withDb: vi.fn(function(this: any) { return this; }),
};

const mockAuditService = {
  log: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/modules/core/container', () => ({
  container: {
    get: vi.fn((Class) => {
      if (Class.name === 'TokenRepository') return mockTokenRepo;
      if (Class.name === 'UserRepository') return mockUserRepo;
      if (Class.name === 'AuditService') return mockAuditService;
      throw new Error(`Unmocked class: ${Class.name}`);
    }),
  },
}));

// Mock brand-db to bypass database routing in tests
vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn(() => ({
    db: {},
    tables: { refreshTokens: {}, users: {} },
  })),
  shouldUseBrandBinding: vi.fn(() => false), // Disable brand routing for unit test
}));

import { GlobalLogoutService } from '../global-logout.service';

describe('W1.2-SESS-01: GlobalLogoutService ownership propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes verified userId to repository revokeById', async () => {
    const service = new GlobalLogoutService(mockTokenRepo as any, mockUserRepo as any, mockAuditService as any);
    
    const verifiedUserId = 'user-alice';
    const sessionId = 'session-laptop';
    const ip = '203.0.113.42';
    const brand = 'realtutorialhub';
    
    await service.revokeSession(verifiedUserId, sessionId, ip, brand);
    
    // CRITICAL: Verify userId was passed as the SECOND argument
    expect(mockTokenRepo.revokeById).toHaveBeenCalledTimes(1);
    expect(mockTokenRepo.revokeById).toHaveBeenCalledWith(sessionId, verifiedUserId);
    
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
    const service = new GlobalLogoutService(mockTokenRepo as any, mockUserRepo as any, mockAuditService as any);
    
    // User Bob attempts to revoke a session (possibly belonging to Alice)
    const verifiedUserId = 'user-bob';
    const sessionId = 'session-definitely-not-bobs';
    
    await service.revokeSession(verifiedUserId, sessionId, undefined, 'realtutorialhub');
    
    // Service must pass Bob's ID, not extract anything from sessionId
    expect(mockTokenRepo.revokeById).toHaveBeenCalledWith(sessionId, verifiedUserId);
  });

  it('rejects missing userId at repository boundary', async () => {
    const service = new GlobalLogoutService(mockTokenRepo as any, mockUserRepo as any, mockAuditService as any);
    
    // Simulate repository throwing on empty userId
    mockTokenRepo.revokeById.mockRejectedValueOnce(
      new Error('W1.2-SESS-01: userId is required for session revocation')
    );
    
    // @ts-expect-error Testing accidental empty string
    await expect(service.revokeSession('', 'session-123', undefined, 'realtutorialhub'))
      .rejects.toThrow('W1.2-SESS-01');
  });

  it('handles brand-specific routing with ownership intact', async () => {
    // Re-enable brand binding for this test
    const { getAuthBrandContext, shouldUseBrandBinding } = await import('@/modules/auth/brand-db');
    vi.mocked(shouldUseBrandBinding).mockReturnValueOnce(true);
    
    const service = new GlobalLogoutService(mockTokenRepo as any, mockUserRepo as any, mockAuditService as any);
    
    const verifiedUserId = 'suia-user-123';
    const sessionId = 'suia-session-456';
    
    await service.revokeSession(verifiedUserId, sessionId, undefined, 'skillup');
    
    // Verify withDb was called for brand routing
    expect(mockTokenRepo.withDb).toHaveBeenCalled();
    
    // Verify userId still passed through brand-specific repo instance
    expect(mockTokenRepo.revokeById).toHaveBeenCalledWith(sessionId, verifiedUserId);
  });
});
