import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleAdminAnalyticsRepository } from '../drizzle-admin-analytics.repository';

const {
  selectMock,
  fromMock,
  whereMock,
  groupByMock,
  leftJoinMock,
  orderByMock,
  limitMock,
  offsetMock,
  auditLogsFindManyMock,
  domainsFindManyMock,
  executeMock,
} = vi.hoisted(() => {
  const _orderByMock = vi.fn();
  const _limitMock = vi.fn();
  const _offsetMock = vi.fn();
  const _groupByMock = vi.fn();
  const _whereMock = vi.fn();
  const _leftJoinMock = vi.fn();
  const _fromMock = vi.fn();
  const _selectMock = vi.fn();

  return {
    selectMock: _selectMock,
    fromMock: _fromMock,
    whereMock: _whereMock,
    groupByMock: _groupByMock,
    leftJoinMock: _leftJoinMock,
    orderByMock: _orderByMock,
    limitMock: _limitMock,
    offsetMock: _offsetMock,
    auditLogsFindManyMock: vi.fn(),
    domainsFindManyMock: vi.fn(),
    executeMock: vi.fn(),
  };
});

vi.mock('@quiz/db', () => ({
  db: {
    select: selectMock,
    execute: executeMock,
    query: {
      auditLogs: { findMany: auditLogsFindManyMock },
      domains: { findMany: domainsFindManyMock },
    },
  },
  auditLogs: { createdAt: 'auditLogs.createdAt', id: 'auditLogs.id' },
  users: { id: 'users.id', email: 'users.email', lastActiveAt: 'users.lastActiveAt' },
  userProfiles: { userId: 'userProfiles.userId', name: 'userProfiles.name' },
  sessions: { id: 'sessions.id', userId: 'sessions.userId', createdAt: 'sessions.createdAt' },
  roles: { id: 'roles.id', name: 'roles.name' },
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
  questions: { status: 'questions.status' },
  userProfiles_userId: 'userProfiles.userId',
  userProfiles_name: 'userProfiles.name'
}));

vi.mock('@/lib/field-selector', () => ({
  getDrizzleFields: vi.fn((f) => f ? { id: true } : null),
}));

describe('DrizzleAdminAnalyticsRepository', () => {
  let repo: DrizzleAdminAnalyticsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new DrizzleAdminAnalyticsRepository();

    const chain = {
      from: fromMock.mockReturnThis(),
      leftJoin: leftJoinMock.mockReturnThis(),
      where: whereMock.mockReturnThis(),
      groupBy: groupByMock.mockReturnThis(),
      orderBy: orderByMock.mockReturnThis(),
      limit: limitMock.mockReturnThis(),
      offset: offsetMock.mockReturnThis(),
      then: (cb: any) => Promise.resolve([{ count: 1 }]).then(cb),
      catch: () => {},
      [Symbol.iterator]: function* () { yield { count: 1 }; }
    };
    // Make it awaitable
    (chain as any).then = (resolve: any) => Promise.resolve([{ count: 1 }]).then(resolve);

    selectMock.mockReturnValue(chain);
    
    executeMock.mockResolvedValue({ rows: [] });
    auditLogsFindManyMock.mockResolvedValue([]);
    domainsFindManyMock.mockResolvedValue([]);
  });

  describe('getPlatformMetrics', () => {
    it('uses materialized views when execute is available', async () => {
      executeMock
        .mockResolvedValueOnce({ rows: [{ total_users: 100, active_users_24h: 5 }] })
        .mockResolvedValueOnce({ rows: [{ total_exams: 50 }] });

      const res = await repo.getPlatformMetrics();
      expect(res.totalUsers).toBe(100);
      expect(res.totalExams).toBe(50);
      expect(executeMock).toHaveBeenCalledTimes(2);
    });

    it('falls back to select when execute is NOT a function', async () => {
      const dbNoExec = { select: selectMock };
      const repoNoExec = new DrizzleAdminAnalyticsRepository(dbNoExec as any);
      
      const res = await repoNoExec.getPlatformMetrics();
      expect(res.totalUsers).toBe(1); // from select mock return
      expect(selectMock).toHaveBeenCalled();
    });
  });

  describe('getAuditLogs', () => {
    it('handles cursor pagination with date and id', async () => {
      auditLogsFindManyMock.mockResolvedValue([
        { id: 'a1', createdAt: new Date() },
      ]);
      await repo.getAuditLogs('2024-01-01|id-1', 10);
      expect(auditLogsFindManyMock).toHaveBeenCalledWith(expect.objectContaining({
        limit: 11,
      }));
    });

    it('handles cursor without id', async () => {
        await repo.getAuditLogs('2024-01-01', 10);
        expect(auditLogsFindManyMock).toHaveBeenCalled();
    });
  });

  describe('getLiveSessions', () => {
    it('calculates active/idle status correctly', async () => {
      const now = new Date();
      const activeTime = new Date(now.getTime() - 2 * 60 * 1000); // 2 mins ago
      const idleTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 mins ago

      // Mock chain results for the two calls (data and count)
      const rows = [
        { id: 's1', userEmail: 'u1@ex.com', lastActiveAt: activeTime },
        { id: 's2', userEmail: 'u2@ex.com', lastActiveAt: idleTime },
        { id: 's3', userEmail: 'u3@ex.com', lastActiveAt: null },
      ];
      
      const sessionChain = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => Promise.resolve(rows).then(resolve))
      };
      
      const countChain = {
          from: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          then: vi.fn((resolve) => Promise.resolve([{ count: 3 }]).then(resolve))
      };

      selectMock
        .mockReturnValueOnce(sessionChain) // data
        .mockReturnValueOnce(countChain); // count

      const res = await repo.getLiveSessions(1, 10, 'search');
      
      expect(res.sessions[0].status).toBe('active');
      expect(res.sessions[1].status).toBe('idle');
      expect(res.sessions[2].status).toBe('idle');
      expect(res.total).toBe(3);
    });
  });

  describe('Other metrics', () => {
    it('getRBACMetrics', async () => {
       const rbacChain = {
           from: vi.fn().mockReturnThis(),
           leftJoin: vi.fn().mockReturnThis(),
           groupBy: vi.fn().mockReturnThis(),
           orderBy: vi.fn().mockReturnThis(),
           then: vi.fn((resolve) => Promise.resolve([{ role: 'Admin', count: 5 }]).then(resolve))
       };
       selectMock.mockReturnValue(rbacChain);
       const res = await repo.getRBACMetrics();
       expect(res[0].role).toBe('Admin');
    });

    it('getAllDomainHierarchy', async () => {
       domainsFindManyMock.mockResolvedValue([{ id: 'd1', subjects: [] }]);
       const res = await repo.getAllDomainHierarchy();
       expect(res[0].id).toBe('d1');
    });
  });
});
