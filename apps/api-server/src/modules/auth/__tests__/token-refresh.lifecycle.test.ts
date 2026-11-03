import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TokenRefreshService } from '../token-refresh.service';
import { UserRepository } from '../repositories/user.repository';

/**
 * W1.2-REFRESH-06: Account Lifecycle & Dynamic Role Freshness Tests
 *
 * Verifies:
 * 1. Blocked account rejection (access_denied:user_blocked)
 * 2. Soft-deleted account rejection (Account has been deactivated)
 * 3. Missing user rejection (Invalid refresh token)
 * 4. Legitimate empty roles for learner succeed with isAdmin: false
 * 5. Demoted admin rejection (access_denied:insufficient_permissions)
 * 6. Promoted learner session role/flag capping (preserves learner boundary, strips admin roles)
 * 7. Outage safety: repository errors propagate without consuming parent token
 * 8. Strict UserRepository contract: verifies findActiveUserWithRoles queries only users/roles
 */

describe('TokenRefreshService Lifecycle & Role Freshness (W1.2-REFRESH-06)', () => {
  let mockTokenRepo: any;
  let mockTokenService: any;
  let mockAuditService: any;
  let mockUserRepo: any;
  let service: TokenRefreshService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockTokenRepo = {
      findByHash: vi.fn(),
      updateLastUsed: vi.fn().mockResolvedValue(undefined),
      consumeToken: vi.fn().mockResolvedValue({ id: 's1', userId: 'u1' }),
      createRefreshToken: vi.fn().mockResolvedValue(undefined),
      withDb: vi.fn(function (this: any) {
        return this;
      }),
    };

    mockTokenService = {
      hashToken: vi.fn().mockResolvedValue('token-hash'),
      verifyRefreshToken: vi.fn(),
      generateAccessToken: vi.fn().mockResolvedValue('new-access-token'),
      generateRefreshToken: vi.fn().mockResolvedValue('new-refresh-token'),
    };

    mockAuditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };

    mockUserRepo = {
      findActiveUserWithRoles: vi.fn(),
      findByIdWithDetails: vi.fn(),
      withDb: vi.fn(function (this: any) {
        return this;
      }),
    };

    service = new TokenRefreshService(
      mockTokenRepo,
      mockTokenService,
      mockAuditService,
      mockUserRepo
    );
  });

  it('TC-LIFE-01: throws access_denied:user_blocked when account isBlocked in DB', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-blocked',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-blocked',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'user',
    });

    mockUserRepo.findActiveUserWithRoles.mockResolvedValue({
      id: 'user-blocked',
      email: 'blocked@rth.com',
      isBlocked: true,
      deletedAt: null,
      roles: ['student'],
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('access_denied:user_blocked');

    // Verification: ZERO session state mutations occurred
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'token_refresh_failed',
        metadata: expect.objectContaining({
          reason: 'user_blocked',
        }),
      })
    );
  });

  it('TC-LIFE-02: throws Account has been deactivated when account is soft-deleted in DB', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-deleted',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-deleted',
      brand: 'skillup',
      isAdmin: false,
      tokenType: 'user',
    });

    mockUserRepo.findActiveUserWithRoles.mockResolvedValue({
      id: 'user-deleted',
      email: 'deleted@skillup.com',
      isBlocked: false,
      deletedAt: new Date(Date.now() - 5000),
      roles: ['student'],
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'skillup')
    ).rejects.toThrow('Account has been deactivated');

    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'token_refresh_failed',
        metadata: expect.objectContaining({
          reason: 'user_deleted',
        }),
      })
    );
  });

  it('TC-LIFE-03: fails closed with Invalid refresh token when user row missing in DB', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'orphaned-user',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'orphaned-user',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'user',
    });

    mockUserRepo.findActiveUserWithRoles.mockResolvedValue(null);

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Invalid refresh token');

    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'token_refresh_failed',
        metadata: expect.objectContaining({
          reason: 'user_not_found',
        }),
      })
    );
  });

  it('TC-LIFE-04: succeeds for learner with legitimate empty roles ([])', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'learner-empty',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'learner-empty',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'user',
    });

    mockUserRepo.findActiveUserWithRoles.mockResolvedValue({
      id: 'learner-empty',
      email: 'empty@rth.com',
      isBlocked: false,
      deletedAt: null,
      roles: [], // Legitimate empty role set
    });

    const result = await service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.isAdmin).toBe(false);

    expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: [],
        isAdmin: false,
        tokenType: 'user',
        aud: 'user',
      })
    );
  });

  it('TC-LIFE-05: denies refresh when admin session presented but user has no admin roles in DB', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-admin',
      userId: 'demoted-admin',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'demoted-admin',
      brand: 'realtutorialhub',
      isAdmin: true,
      tokenType: 'admin',
    });

    // User was demoted in DB to standard learner
    mockUserRepo.findActiveUserWithRoles.mockResolvedValue({
      id: 'demoted-admin',
      email: 'demoted@rth.com',
      isBlocked: false,
      deletedAt: null,
      roles: ['student'], // No admin, super_admin, or infrastructure role!
    });

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'admin', 'realtutorialhub')
    ).rejects.toThrow('access_denied:insufficient_permissions');

    // Parent token remains unconsumed (fails closed before CAS transaction)
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();

    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'admin_session_demoted_revoked',
        metadata: expect.objectContaining({
          reason: 'insufficient_permissions',
        }),
      })
    );
  });

  it('TC-LIFE-06: caps learner promotion: strips administrative roles from learner successor token', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-learner',
      userId: 'promoted-learner',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'promoted-learner',
      brand: 'skillup',
      isAdmin: false,
      tokenType: 'user',
    });

    // Learner was granted admin and student roles in DB
    mockUserRepo.findActiveUserWithRoles.mockResolvedValue({
      id: 'promoted-learner',
      email: 'promoted@skillup.com',
      isBlocked: false,
      deletedAt: null,
      roles: ['student', 'admin', 'super_admin'],
    });

    const result = await service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'skillup');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.isAdmin).toBe(false);

    // CRITICAL RBAC CHECK: Admin roles must be STRIPPED from learner successor token
    expect(mockTokenService.generateAccessToken).toHaveBeenCalledWith(
      expect.objectContaining({
        roles: ['student'], // 'admin' and 'super_admin' stripped!
        isAdmin: false,
        tokenType: 'user',
        aud: 'user',
      })
    );

    expect(mockTokenService.generateRefreshToken).toHaveBeenCalledWith(
      'promoted-learner',
      false,
      'user',
      expect.objectContaining({
        tokenType: 'user',
      })
    );
  });

  it('TC-LIFE-07: propagates database errors during role lookup and leaves parent unconsumed', async () => {
    mockTokenRepo.findByHash.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      revoked: false,
      expiresAt: new Date(Date.now() + 100000),
    });

    mockTokenService.verifyRefreshToken.mockResolvedValue({
      userId: 'user-1',
      brand: 'realtutorialhub',
      isAdmin: false,
      tokenType: 'user',
    });

    // Database connection timeout
    mockUserRepo.findActiveUserWithRoles.mockRejectedValue(new Error('Connection timeout to PostgreSQL'));

    await expect(
      service.refresh('raw-token', '127.0.0.1', undefined, 'user', 'realtutorialhub')
    ).rejects.toThrow('Connection timeout to PostgreSQL');

    // Parent token MUST NOT be consumed or revoked
    expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();
  });
});

describe('UserRepository.findActiveUserWithRoles Strict Implementation', () => {
  it('TC-LIFE-08: queries users and userRoles without querying userProfiles', async () => {
    const mockSelect = vi.fn();
    const mockFrom = vi.fn();
    const mockWhere = vi.fn();
    const mockLimit = vi.fn();
    const mockInnerJoin = vi.fn();

    const mockDbInstance = {
      select: mockSelect,
    };

    // Chain 1: users query
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockFrom.mockReturnValueOnce({ where: mockWhere });
    mockWhere.mockReturnValueOnce({ limit: mockLimit });
    mockLimit.mockResolvedValueOnce([
      {
        id: 'u-123',
        email: 'test@domain.com',
        isBlocked: false,
        deletedAt: null,
      },
    ]);

    // Chain 2: user_roles join query
    const mockJoinWhere = vi.fn().mockResolvedValueOnce([
      { name: 'student' },
      { name: 'ta' },
    ]);
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockFrom.mockReturnValueOnce({ innerJoin: mockInnerJoin });
    mockInnerJoin.mockReturnValueOnce({ where: mockJoinWhere });

    const repo = new UserRepository(mockDbInstance as any);
    const result = await repo.findActiveUserWithRoles('u-123');

    expect(result).toEqual({
      id: 'u-123',
      email: 'test@domain.com',
      isBlocked: false,
      deletedAt: null,
      roles: ['student', 'ta'],
    });

    // Verify mockSelect was called exactly twice (users and userRoles), NEVER for userProfiles
    expect(mockSelect).toHaveBeenCalledTimes(2);
  });

  it('TC-LIFE-09: returns null when user does not exist in DB', async () => {
    const mockSelect = vi.fn();
    const mockFrom = vi.fn();
    const mockWhere = vi.fn();
    const mockLimit = vi.fn();

    const mockDbInstance = { select: mockSelect };
    mockSelect.mockReturnValueOnce({ from: mockFrom });
    mockFrom.mockReturnValueOnce({ where: mockWhere });
    mockWhere.mockReturnValueOnce({ limit: mockLimit });
    mockLimit.mockResolvedValueOnce([]); // No user record found

    const repo = new UserRepository(mockDbInstance as any);
    const result = await repo.findActiveUserWithRoles('missing-id');

    expect(result).toBeNull();
  });
});
