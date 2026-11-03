import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  users as defaultUsers,
  userProfiles as defaultUserProfiles,
  roles as defaultRoles,
  userRoles as defaultUserRoles,
} from '@quiz/db';
import {
  users as rthUsers,
  userProfiles as rthUserProfiles,
  roles as rthRoles,
  userRoles as rthUserRoles,
} from '@quiz/db-rth';
import {
  users as suiaUsers,
  userProfiles as suiaUserProfiles,
  roles as suiaRoles,
  userRoles as suiaUserRoles,
} from '@quiz/db-skillup';
import { TokenRefreshService } from '../token-refresh.service';
import { UserRepository } from '../repositories/user.repository';

const { rthAdapter, suiaAdapter, defaultAdapter, rthTables, suiaTables, defaultTables } = vi.hoisted(() => {
  class MockTenantDbAdapterInternal {
    public queriedTables: any[] = [];
    public queriedColumns: string[] = [];

    constructor(
      public users: Array<{ id: string; email: string; isBlocked: boolean; deletedAt: Date | null }> = [],
      public roles: Array<{ id: string; name: string }> = [],
      public userRoles: Array<{ userId: string; roleId: string }> = [],
      public failCoreQuery = false,
      public failRoleQuery = false
    ) {}

    reset() {
      this.queriedTables = [];
      this.queriedColumns = [];
      this.failCoreQuery = false;
      this.failRoleQuery = false;
    }

    async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
      return callback(this);
    }

    select(_fields?: any) {
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

              let colName: string | null = null;
              let paramVal: unknown = null;

              if (whereExpr?.queryChunks) {
                for (const chunk of whereExpr.queryChunks) {
                  if (chunk && typeof chunk.name === 'string' && chunk.table) {
                    colName = chunk.name;
                    self.queriedColumns.push(colName);
                  }
                  if (chunk && chunk.constructor && chunk.constructor.name === 'Param') {
                    paramVal = chunk.value;
                  }
                }
              }

              let matchingUsers: any[] = [];
              if (colName === 'id') {
                matchingUsers = self.users.filter((u) => u.id === paramVal);
              } else if (colName === 'email') {
                matchingUsers = self.users.filter((u) => u.email === paramVal);
              }

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

                  let colName: string | null = null;
                  let paramVal: unknown = null;

                  if (whereExpr?.queryChunks) {
                    for (const chunk of whereExpr.queryChunks) {
                      if (chunk && typeof chunk.name === 'string' && chunk.table) {
                        colName = chunk.name;
                        self.queriedColumns.push(colName);
                      }
                      if (chunk && chunk.constructor && chunk.constructor.name === 'Param') {
                        paramVal = chunk.value;
                      }
                    }
                  }

                  const matchingUserRoles =
                    colName === 'userId' || colName === 'user_id'
                      ? self.userRoles.filter((ur) => ur.userId === paramVal)
                      : [];

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

  const rth = new MockTenantDbAdapterInternal();
  const suia = new MockTenantDbAdapterInternal();
  const def = new MockTenantDbAdapterInternal();

  const rTables: any = {};
  const sTables: any = {};
  const dTables: any = {};

  return {
    rthAdapter: rth,
    suiaAdapter: suia,
    defaultAdapter: def,
    rthTables: rTables,
    suiaTables: sTables,
    defaultTables: dTables,
  };
});

Object.assign(rthTables, {
  users: rthUsers,
  userProfiles: rthUserProfiles,
  roles: rthRoles,
  userRoles: rthUserRoles,
  refreshTokens: {},
  auditLogs: {},
  verificationTokens: {},
  passwordResetTokens: {},
  loginAttempts: {},
});

Object.assign(suiaTables, {
  users: suiaUsers,
  userProfiles: suiaUserProfiles,
  roles: suiaRoles,
  userRoles: suiaUserRoles,
  refreshTokens: {},
  auditLogs: {},
  verificationTokens: {},
  passwordResetTokens: {},
  loginAttempts: {},
});

Object.assign(defaultTables, {
  users: defaultUsers,
  userProfiles: defaultUserProfiles,
  roles: defaultRoles,
  userRoles: defaultUserRoles,
  refreshTokens: {},
  auditLogs: {},
  verificationTokens: {},
  passwordResetTokens: {},
  loginAttempts: {},
});

vi.mock('../brand-db', () => ({
  getAuthBrandContext: vi.fn((brand: string) => {
    if (brand === 'skillup') {
      return { db: suiaAdapter, tables: suiaTables };
    }
    if (brand === 'realtutorialhub') {
      return { db: rthAdapter, tables: rthTables };
    }
    return { db: defaultAdapter, tables: defaultTables };
  }),
  shouldUseBrandBinding: vi.fn(() => true),
}));

vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn((brand: string) => {
    if (brand === 'skillup') {
      return { db: suiaAdapter, tables: suiaTables };
    }
    if (brand === 'realtutorialhub') {
      return { db: rthAdapter, tables: rthTables };
    }
    return { db: defaultAdapter, tables: defaultTables };
  }),
  shouldUseBrandBinding: vi.fn(() => true),
}));

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
      rthAdapter.reset();
      suiaAdapter.reset();
      defaultAdapter.reset();

      rthAdapter.users = [
        { id: 'col-user-1', email: 'alice@rth.com', isBlocked: false, deletedAt: null },
        { id: 'col-user-10', email: 'distractor@rth.com', isBlocked: false, deletedAt: null },
        { id: 'user-empty-roles', email: 'empty@rth.com', isBlocked: false, deletedAt: null },
      ];
      rthAdapter.roles = [{ id: 'role-rth-1', name: 'student' }];
      rthAdapter.userRoles = [{ userId: 'col-user-1', roleId: 'role-rth-1' }];

      suiaAdapter.users = [
        { id: 'col-user-1', email: 'alice@suia.com', isBlocked: true, deletedAt: null },
        { id: 'col-user-10', email: 'distractor-suia@suia.com', isBlocked: false, deletedAt: null },
      ];
      suiaAdapter.roles = [{ id: 'role-suia-1', name: 'student' }];
      suiaAdapter.userRoles = [{ userId: 'col-user-1', roleId: 'role-suia-1' }];

      defaultAdapter.users = [];
      defaultAdapter.roles = [];
      defaultAdapter.userRoles = [];

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

    it('TC-LIFE-10: connected service + real UserRepository enforces tenant isolation with colliding user IDs between RTH and SUIA', async () => {
      // Direct repository query isolation using unbound repository withDb
      const unboundUserRepo = new UserRepository(defaultAdapter as any, defaultTables);

      const boundRthRepo = unboundUserRepo.withDb(rthAdapter as any, rthTables);
      const rthEligibility = await boundRthRepo.findActiveUserWithRoles('col-user-1');
      expect(rthEligibility?.isBlocked).toBe(false);
      expect(rthEligibility?.email).toBe('alice@rth.com');
      expect(rthEligibility?.roles).toEqual(['student']);

      const boundSuiaRepo = unboundUserRepo.withDb(suiaAdapter as any, suiaTables);
      const suiaEligibility = await boundSuiaRepo.findActiveUserWithRoles('col-user-1');
      expect(suiaEligibility?.isBlocked).toBe(true);
      expect(suiaEligibility?.email).toBe('alice@suia.com');

      // Connected service with single unbound repository dependency and production binding
      const connectedService = new TokenRefreshService(
        mockTokenRepo,
        mockTokenService,
        mockAuditService,
        unboundUserRepo
      );

      // Verify RTH connected refresh succeeds
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

      const rthResult = await connectedService.refresh('token-1', '127.0.0.1', undefined, 'user', 'realtutorialhub');
      expect(rthResult.accessToken).toBe('new-access-token');
      expect(mockTokenRepo.updateLastUsed).toHaveBeenCalled();
      expect(rthAdapter.queriedTables).toContain(rthTables.users);
      expect(rthAdapter.queriedTables).toContain(rthTables.userRoles);
      expect(rthAdapter.queriedColumns).toContain('id');

      // Verify SUIA connected refresh fails closed
      vi.clearAllMocks();
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
        connectedService.refresh('token-2', '127.0.0.1', undefined, 'user', 'skillup')
      ).rejects.toThrow('access_denied:user_blocked');

      expect(suiaAdapter.queriedTables).toContain(suiaTables.users);
      expect(suiaAdapter.queriedColumns).toContain('id');
      expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
      expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
    });

    it('TC-LIFE-11: real UserRepository propagates core query database errors without swallowing (zero session writes)', async () => {
      rthAdapter.failCoreQuery = true;
      const unboundUserRepo = new UserRepository(defaultAdapter as any, defaultTables);
      const connectedService = new TokenRefreshService(
        mockTokenRepo,
        mockTokenService,
        mockAuditService,
        unboundUserRepo
      );

      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-err',
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

      await expect(
        connectedService.refresh('token-err', '127.0.0.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('DB users connection failure');

      expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
      expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
      expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();
      rthAdapter.failCoreQuery = false;
    });

    it('TC-LIFE-12: real UserRepository propagates role query database errors without swallowing (zero session writes)', async () => {
      rthAdapter.failRoleQuery = true;
      const unboundUserRepo = new UserRepository(defaultAdapter as any, defaultTables);
      const connectedService = new TokenRefreshService(
        mockTokenRepo,
        mockTokenService,
        mockAuditService,
        unboundUserRepo
      );

      mockTokenRepo.findByHash.mockResolvedValue({
        id: 'sess-err-role',
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

      await expect(
        connectedService.refresh('token-err-role', '127.0.0.1', undefined, 'user', 'realtutorialhub')
      ).rejects.toThrow('DB userRoles query failure');

      expect(mockTokenRepo.updateLastUsed).not.toHaveBeenCalled();
      expect(mockTokenRepo.consumeToken).not.toHaveBeenCalled();
      expect(mockTokenRepo.createRefreshToken).not.toHaveBeenCalled();
      rthAdapter.failRoleQuery = false;
    });

    it('TC-LIFE-13: real UserRepository handles legitimate empty roles for learner and denies admin with zero session writes', async () => {
      const unboundUserRepo = new UserRepository(defaultAdapter as any, defaultTables);
      const connectedService = new TokenRefreshService(
        mockTokenRepo,
        mockTokenService,
        mockAuditService,
        unboundUserRepo
      );

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

      const learnerResult = await connectedService.refresh('token-empty', '127.0.0.1', undefined, 'user', 'realtutorialhub');
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
        connectedService.refresh('token-empty-admin', '127.0.0.1', undefined, 'admin', 'realtutorialhub')
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
      rthAdapter.reset();
      rthAdapter.users = [
        { id: 'user-profile-check', email: 'p@rth.com', isBlocked: false, deletedAt: null },
      ];
      rthAdapter.roles = [{ id: 'r1', name: 'student' }];
      rthAdapter.userRoles = [{ userId: 'user-profile-check', roleId: 'r1' }];

      const unboundUserRepo = new UserRepository(defaultAdapter as any, defaultTables);
      const boundRepo = unboundUserRepo.withDb(rthAdapter as any, rthTables);

      await boundRepo.findActiveUserWithRoles('user-profile-check');

      // Assert userProfiles is never referenced in queried tables using real table identity
      expect(rthAdapter.queriedTables).toContain(rthTables.users);
      expect(rthAdapter.queriedTables).toContain(rthTables.userRoles);
      expect(rthAdapter.queriedTables).toContain(rthTables.roles);
      expect(rthAdapter.queriedTables).not.toContain(rthTables.userProfiles);
      expect(rthAdapter.queriedTables.some((t) => t === rthTables.userProfiles)).toBe(false);
    });
  });
});
