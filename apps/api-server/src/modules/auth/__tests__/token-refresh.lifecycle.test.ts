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
        action: 'admin_session_demoted_denied',
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

  describe('Connected Service + Real UserRepository on Isolated Tenant Fixtures (F5)', () => {
    let mockTokenRepo: any;
    let mockTokenService: any;
    let mockAuditService: any;

    beforeEach(() => {
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
    });

    class MockTenantDbAdapter {
      public queriedTables: any[] = [];
      constructor(
        public users: Array<{ id: string; email: string; isBlocked: boolean; deletedAt: Date | null }> = [],
        public roles: Array<{ id: string; name: string }> = [],
        public userRoles: Array<{ userId: string; roleId: string }> = [],
        public failCoreQuery = false,
        public failRoleQuery = false
      ) {}

      select(_fields: any) {
        const self = this;
        return {
          from(fromTable: any) {
            self.queriedTables.push(fromTable);
            return {
              where(whereExpr: any) {
                if (self.failCoreQuery) {
                  return {
                    limit: () => Promise.reject(new Error('DB users connection failure')),
                  };
                }
                const serialized = JSON.stringify(whereExpr);
                const matchingUsers = self.users.filter((u) => serialized.includes(u.id));
                return {
                  limit: (n: number) => Promise.resolve(matchingUsers.slice(0, n)),
                };
              },
              innerJoin(joinTable: any, _joinCondition: any) {
                self.queriedTables.push(joinTable);
                return {
                  where(whereExpr: any) {
                    if (self.failRoleQuery) {
                      return Promise.reject(new Error('DB userRoles query failure'));
                    }
                    const serialized = JSON.stringify(whereExpr);
                    const matchingUserRoles = self.userRoles.filter((ur) => serialized.includes(ur.userId));
                    const joined = matchingUserRoles.map((ur) => {
                      const role = self.roles.find((r) => r.id === ur.roleId);
                      return { name: role?.name ?? null };
                    });
                    return Promise.resolve(joined);
                  },
                };
              },
            };
          },
        };
      }
    }

    it('TC-LIFE-10: connected service + real UserRepository enforces tenant isolation with colliding user IDs between RTH and SUIA', async () => {
      // User ID "col-user-1" exists in RTH as active learner, but in SUIA as blocked
      const rthAdapter = new MockTenantDbAdapter(
        [{ id: 'col-user-1', email: 'alice@rth.com', isBlocked: false, deletedAt: null }],
        [{ id: 'role-rth-1', name: 'student' }],
        [{ userId: 'col-user-1', roleId: 'role-rth-1' }]
      );

      const suiaAdapter = new MockTenantDbAdapter(
        [{ id: 'col-user-1', email: 'alice@suia.com', isBlocked: true, deletedAt: null }],
        [{ id: 'role-suia-1', name: 'student' }],
        [{ userId: 'col-user-1', roleId: 'role-suia-1' }]
      );

      const rthUserRepo = new UserRepository(rthAdapter as any);
      const suiaUserRepo = new UserRepository(suiaAdapter as any);

      // Verify real repository query isolation directly
      const rthEligibility = await rthUserRepo.findActiveUserWithRoles('col-user-1');
      expect(rthEligibility?.isBlocked).toBe(false);
      expect(rthEligibility?.roles).toEqual(['student']);

      const suiaEligibility = await suiaUserRepo.findActiveUserWithRoles('col-user-1');
      expect(suiaEligibility?.isBlocked).toBe(true);

      // Verify connected service behavior: RTH succeeds, SUIA fails closed
      const rthService = new TokenRefreshService(mockTokenRepo, mockTokenService, mockAuditService, rthUserRepo);
      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-rth',
        userId: 'col-user-1',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        userId: 'col-user-1',
        brand: 'realtutorialhub',
        isAdmin: false,
        tokenType: 'user',
      });

      const rthResult = await rthService.refresh('token-1', '127.0.0.1', undefined, 'user', 'realtutorialhub');
      expect(rthResult.accessToken).toBe('new-access-token');
      expect(mockTokenRepo.updateLastUsed).toHaveBeenCalled();

      // Clear calls for SUIA check
      vi.clearAllMocks();
      const suiaService = new TokenRefreshService(mockTokenRepo, mockTokenService, mockAuditService, suiaUserRepo);
      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-suia',
        userId: 'col-user-1',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        userId: 'col-user-1',
        brand: 'skillup',
        isAdmin: false,
        tokenType: 'user',
      });

      await expect(
        suiaService.refresh('token-2', '127.0.0.1', undefined, 'user', 'skillup')
      ).rejects.toThrow('access_denied:user_blocked');

      // Zero state writes on SUIA denial (proves tenant isolation: SUIA cannot borrow RTH active eligibility)
      expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
      expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    });

    it('TC-LIFE-11: real UserRepository propagates core query database errors without swallowing (zero session writes)', async () => {
      const failingAdapter = new MockTenantDbAdapter([], [], [], true, false);
      const realUserRepo = new UserRepository(failingAdapter as any);
      const serviceWithFailingRepo = new TokenRefreshService(mockTokenRepo, mockTokenService, mockAuditService, realUserRepo);

      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-err',
        userId: 'user-err',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        userId: 'user-err',
        brand: 'realtutorialhub',
        isAdmin: false,
        tokenType: 'user',
      });

      await expect(
        serviceWithFailingRepo.refresh('token-err', '127.0.0.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('DB users connection failure');

      expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
      expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
      expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();
    });

    it('TC-LIFE-12: real UserRepository propagates role query database errors without swallowing (zero session writes)', async () => {
      const failingRoleAdapter = new MockTenantDbAdapter(
        [{ id: 'user-role-err', email: 'err@rth.com', isBlocked: false, deletedAt: null }],
        [],
        [],
        false,
        true
      );
      const realUserRepo = new UserRepository(failingRoleAdapter as any);
      const serviceWithFailingRepo = new TokenRefreshService(mockTokenRepo, mockTokenService, mockAuditService, realUserRepo);

      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-err-role',
        userId: 'user-role-err',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        userId: 'user-role-err',
        brand: 'realtutorialhub',
        isAdmin: false,
        tokenType: 'user',
      });

      await expect(
        serviceWithFailingRepo.refresh('token-err-role', '127.0.0.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('DB userRoles query failure');

      expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
      expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
      expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();
    });

    it('TC-LIFE-13: real UserRepository handles legitimate empty roles for learner and denies admin with zero session writes', async () => {
      const adapter = new MockTenantDbAdapter(
        [{ id: 'user-empty-roles', email: 'empty@rth.com', isBlocked: false, deletedAt: null }],
        [],
        []
      );
      const realUserRepo = new UserRepository(adapter as any);
      const serviceInstance = new TokenRefreshService(mockTokenRepo, mockTokenService, mockAuditService, realUserRepo);

      // 1. Learner with legitimate empty roles succeeds
      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-empty-roles',
        userId: 'user-empty-roles',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        userId: 'user-empty-roles',
        brand: 'realtutorialhub',
        isAdmin: false,
        tokenType: 'user',
      });

      const learnerResult = await serviceInstance.refresh('token-empty', '127.0.0.1', undefined, 'user', 'realtutorialhub');
      expect(learnerResult.accessToken).toBe('new-access-token');
      expect(learnerResult.isAdmin).toBe(false);

      // 2. Admin scope requested with empty roles in DB is denied
      vi.clearAllMocks();
      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-empty-admin',
        userId: 'user-empty-roles',
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      mockTokenService.verifyRefreshToken.mockResolvedValue({
        userId: 'user-empty-roles',
        brand: 'realtutorialhub',
        isAdmin: true,
        tokenType: 'admin',
      });

      await expect(
        serviceInstance.refresh('token-empty-admin', '127.0.0.1', undefined, 'admin', 'realtutorialhub')
      ).rejects.toThrow('access_denied:insufficient_permissions');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'admin_session_demoted_denied',
          metadata: expect.objectContaining({
            reason: 'insufficient_permissions',
          }),
        })
      );
      expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
      expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    });

    it('TC-LIFE-14: verify userProfiles table is never queried during findActiveUserWithRoles', async () => {
      const adapter = new MockTenantDbAdapter(
        [{ id: 'user-profile-check', email: 'p@rth.com', isBlocked: false, deletedAt: null }],
        [{ id: 'r1', name: 'student' }],
        [{ userId: 'user-profile-check', roleId: 'r1' }]
      );
      const realUserRepo = new UserRepository(adapter as any);

      await realUserRepo.findActiveUserWithRoles('user-profile-check');

      // Assert userProfiles is never referenced in queried tables
      const userProfilesReferenced = adapter.queriedTables.some((t) =>
        String(t?.name ?? t).includes('profile')
      );
      expect(userProfilesReferenced).toBe(false);
    });
  });
});
