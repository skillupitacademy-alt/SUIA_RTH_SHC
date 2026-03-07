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

    fromMock
      .mockReturnValueOnce([{ count: 10 }] as any) // users count
      .mockReturnValueOnce([{ count: 5 }] as any) // exams count
      .mockReturnValueOnce([{ count: 2 }] as any) // domains count
      .mockReturnValueOnce({ where: vi.fn().mockResolvedValue([{ count: 3 }]) } as any) // active users
      .mockReturnValueOnce({ groupBy: vi.fn().mockResolvedValue([{ status: 'completed', count: 3 }]) } as any) // exam activity status
      .mockReturnValueOnce({ where: vi.fn().mockReturnValue({ groupBy: vi.fn().mockResolvedValue([{ domainName: 'Math', count: 3 }]) }) } as any) // domain activity
      .mockReturnValueOnce({ where: vi.fn().mockResolvedValue([{ avgTime: 120 }]) } as any) // avg time
      .mockReturnValueOnce({ where: vi.fn().mockReturnValue({ groupBy: vi.fn().mockResolvedValue([{ quadrant: 'mastery', count: 1 }]) }) } as any) // efficiency
      .mockReturnValueOnce({ leftJoin: vi.fn().mockReturnValue({ groupBy: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue([{ role: 'ADMIN', count: 1 }]) }) }) } as any); // rbac

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
    await expect(repo.getAuditLogs(10)).resolves.toEqual({ data: [{ id: 'a1' }], nextCursor: null });
    await expect(repo.getRBACMetrics()).resolves.toEqual([{ role: 'ADMIN', count: 1 }]);
    await expect(repo.getAllDomainHierarchy()).resolves.toEqual([{ id: 'd1' }]);
  });
});
