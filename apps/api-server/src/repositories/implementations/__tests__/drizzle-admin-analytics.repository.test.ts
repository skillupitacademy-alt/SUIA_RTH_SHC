import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  selectMock,
  fromMock,
  whereMock,
  groupByMock,
  leftJoinMock,
  orderByMock,
  auditLogsFindManyMock,
  domainsFindManyMock,
} = vi.hoisted(() => {
  const _orderByMock = vi.fn();
  const _groupByMock = vi.fn(() => ({ orderBy: _orderByMock }));
  const _whereMock = vi.fn(() => ({ groupBy: _groupByMock }));
  const _leftJoinMock = vi.fn(() => ({ groupBy: _groupByMock }));
  const _fromMock = vi.fn(() => ({
    where: _whereMock,
    groupBy: _groupByMock,
    leftJoin: _leftJoinMock,
  }));
  return {
    selectMock: vi.fn(() => ({ from: _fromMock })),
    fromMock: _fromMock,
    whereMock: _whereMock,
    groupByMock: _groupByMock,
    leftJoinMock: _leftJoinMock,
    orderByMock: _orderByMock,
    auditLogsFindManyMock: vi.fn(),
    domainsFindManyMock: vi.fn(),
  };
});

vi.mock('@quiz/db', () => ({
  db: {
    select: selectMock,
    execute: vi.fn(),
    query: {
      auditLogs: { findMany: auditLogsFindManyMock },
      domains: { findMany: domainsFindManyMock },
    },
  },
  users: { id: 'users.id' },
  exams: { id: 'exams.id', userId: 'exams.userId', startedAt: 'exams.startedAt', status: 'exams.status', completedAt: 'exams.completedAt' },
  domains: { id: 'domains.id' },
  resultsByDimension: { examId: 'resultsByDimension.examId', name: 'resultsByDimension.name', dimensionType: 'resultsByDimension.dimensionType' },
  examQuestions: { isCorrect: 'examQuestions.isCorrect', responseMetadata: 'examQuestions.responseMetadata' },
  questions: { status: 'questions.status' },
  auditLogs: { createdAt: 'auditLogs.createdAt' },
  roles: { id: 'roles.id', name: 'roles.name' },
  userRoles: { userId: 'userRoles.userId', roleId: 'userRoles.roleId' },
}));

import { DrizzleAdminAnalyticsRepository } from '../drizzle-admin-analytics.repository';

describe('DrizzleAdminAnalyticsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnValue({ from: fromMock } as any);
    whereMock.mockReturnValue({ groupBy: groupByMock } as any);
    groupByMock.mockReturnValue([] as any);
    orderByMock.mockReturnValue([] as any);
    leftJoinMock.mockReturnValue({ groupBy: groupByMock } as any);
    auditLogsFindManyMock.mockResolvedValue([{ id: 'a1' }]);
    domainsFindManyMock.mockResolvedValue([{ id: 'd1' }]);
  });

  it('covers all analytics repository methods', async () => {
    const repo = new DrizzleAdminAnalyticsRepository();

    const db = (repo as any)._db;
    db.execute
      .mockResolvedValueOnce({ rows: [{ total_users: 10, total_domains: 2, active_users_24h: 3 }] }) // user stats
      .mockResolvedValueOnce({ rows: [{ total_exams: 5 }] }) // exam stats
      .mockResolvedValueOnce({ rows: [{ status: 'completed', count: 3 }] }) // exam status stats
      .mockResolvedValueOnce({ rows: [{ domainName: 'Math', count: 3 }] }) // domain activity stats
      .mockResolvedValueOnce({ rows: [{ avgTime: 120 }] }) // exam stats avg time
      .mockResolvedValueOnce({ rows: [{ quadrant: 'mastery', count: 1 }] }); // efficiency stats

    await expect(repo.getPlatformMetrics()).resolves.toEqual({
      totalUsers: 10,
      totalExams: 5,
      totalDomains: 2,
      activeUsers24h: 3,
    });
    await expect(repo.getExamActivity()).resolves.toEqual({
      statusStats: [{ status: 'completed', count: 3 }],
      domainActivity: [{ domainName: 'Math', count: 3 }],
      avgTime: 120,
    });
    await expect(repo.getEfficiencyAnalytics()).resolves.toEqual([{ quadrant: 'mastery', count: 1 }]);
    await expect(repo.getAuditLogs(null, 10)).resolves.toEqual({ data: [{ id: 'a1' }], nextCursor: null });
    const rbacMock = {
      groupBy: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([{ role: 'ADMIN', count: 1 }])
      })
    };
    leftJoinMock.mockReturnValue(rbacMock as any);
    await expect(repo.getRBACMetrics()).resolves.toEqual([{ role: 'ADMIN', count: 1 }]);
    await expect(repo.getAllDomainHierarchy()).resolves.toEqual([{ id: 'd1' }]);
  });
});
