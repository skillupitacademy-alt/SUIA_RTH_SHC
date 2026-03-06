import { beforeEach, describe, expect, it, vi } from 'vitest';

const { executeMock, trendSummaryMock, periodDeltaMock, domainDeltasMock, execHealthMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  trendSummaryMock: vi.fn(),
  periodDeltaMock: vi.fn(),
  domainDeltasMock: vi.fn(),
  execHealthMock: vi.fn(),
}));

vi.mock('@quiz/db', () => ({
  db: {
    execute: executeMock,
  },
}));

vi.mock('@/modules/metrics/trends.service', () => ({
  TrendsService: {
    getTrendSummary: trendSummaryMock,
    getPeriodDelta: periodDeltaMock,
    getDomainDeltas: domainDeltasMock,
    getExecHealth: execHealthMock,
  },
}));

import { AdminAnalyticsEngine } from '../admin.analytics.engine';

describe('AdminAnalyticsEngine', () => {
  const repository = {
    getPlatformMetrics: vi.fn(),
    getExamActivity: vi.fn(),
    getEfficiencyAnalytics: vi.fn(),
    getAuditLogs: vi.fn(),
    getAllDomainHierarchy: vi.fn(),
    getRBACMetrics: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('covers platform metrics, exam activity, efficiency, and misc endpoints', async () => {
    const engine = new AdminAnalyticsEngine(repository as any);
    repository.getPlatformMetrics.mockResolvedValue({ users: 10 });
    repository.getExamActivity.mockResolvedValue({
      statusStats: [{ status: 'started', count: 1 }, { status: 'completed', count: 2 }],
      domainActivity: [{ domainName: 'Math', count: 3 }],
      avgTime: 120,
    });
    repository.getEfficiencyAnalytics.mockResolvedValue([
      { quadrant: 'mastery', count: 5 },
      { quadrant: 'persistence', count: 4 },
      { quadrant: 'rash', count: 2 },
      { quadrant: 'struggle', count: 1 },
      { quadrant: 'no_data', count: 3 },
    ]);
    repository.getAuditLogs.mockResolvedValue([{ id: 'a1' }]);
    repository.getRBACMetrics.mockResolvedValue({ admins: 1 });
    repository.getAllDomainHierarchy.mockResolvedValue([
      {
        id: 'd1',
        name: 'Domain',
        subjects: [
          {
            id: 's1',
            name: 'Subject',
            topics: [
              {
                id: 't1',
                name: 'Topic',
                questions: [{ difficulty: 'simple', subtopicId: 'st1' }],
                subtopics: [{ id: 'st1', name: 'Subtopic' }],
              },
            ],
          },
        ],
      },
    ]);

    await expect(engine.getPlatformMetrics()).resolves.toEqual({ users: 10 });
    await expect(engine.getExamActivity()).resolves.toEqual({
      started: 1,
      completed: 2,
      abandoned: 0,
      byDomain: [{ name: 'Math', count: 3 }],
      avgCompletionTimeMinutes: 2,
    });
    await expect(engine.getEfficiencyAnalytics()).resolves.toEqual({
      mastery: 5,
      persistence: 4,
      rash: 2,
      struggle: 1,
      noData: 3,
      total: 15,
    });
    await expect(engine.getRecentAuditLogs(5)).resolves.toEqual([{ id: 'a1' }]);
    await expect(engine.getRBACMetrics()).resolves.toEqual({ admins: 1 });
    await expect(engine.getBlueprintMetrics()).resolves.toEqual({ total: 0, active: 0, popular: [] });
    await expect(engine.getGrowthZones()).resolves.toEqual({ areas: [] });
    await expect(engine.getSecuritySignals()).resolves.toEqual({ threats: [], status: 'nominal' });
    await expect(engine.getAccountMetrics()).resolves.toEqual({ active: 0, new: 0, churn: 0 });
    await expect(engine.getLiveSessions()).resolves.toEqual({ active: 0, peak24h: 0 });

    const health = await engine.getContentHealthReport();
    expect(health[0].stats.total).toBe(1);
  });

  it('covers performance analytics success and fallback branches', async () => {
    const engine = new AdminAnalyticsEngine(repository as any);
    repository.getEfficiencyAnalytics.mockResolvedValue([{ quadrant: 'mastery', count: 2 }]);

    trendSummaryMock.mockResolvedValue({ avgScore: 74, passRate: 0.8, totalExams: 5, bestSkill: null, worstSkill: null, currentStreak: 3 });
    periodDeltaMock.mockResolvedValue({ currentAvg: 74, previousAvg: 70, deltaPct: 4 });
    domainDeltasMock.mockResolvedValue({ d1: { current: 70, previous: 64, delta: 6 } });
    execHealthMock.mockReturnValue('green');

    executeMock
      .mockResolvedValueOnce({ rows: [{ dimensionId: 'd1', name: 'Domain 1', avgAccuracy: 72, count: 10 }] })
      .mockResolvedValueOnce({ rows: [{ difficulty: 'simple', avgAccuracy: 81 }] })
      .mockResolvedValueOnce({ rows: [{ isPass: true, count: 8 }, { isPass: false, count: 2 }] });

    const success = await engine.getPerformanceAnalytics('7d');
    expect(success.summary.healthStatus).toBe('green');
    expect(success.domains[0].delta).toBe(6);

    trendSummaryMock.mockRejectedValueOnce(new Error('boom'));
    periodDeltaMock.mockRejectedValueOnce(new Error('boom'));
    domainDeltasMock.mockRejectedValueOnce(new Error('boom'));
    repository.getEfficiencyAnalytics.mockRejectedValueOnce(new Error('boom'));
    execHealthMock.mockReturnValueOnce('red');
    executeMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const fallback = await engine.getPerformanceAnalytics('7d');
    expect(fallback.summary.avgScore).toBe(0);
    expect(fallback.passFailTrends).toEqual({ pass: 0, fail: 0 });
  });

  it('covers efficiency/default-mapping branches with sparse analytics rows', async () => {
    const engine = new AdminAnalyticsEngine(repository as any);
    repository.getExamActivity.mockResolvedValue({
      statusStats: [{ status: 'started', count: undefined }],
      domainActivity: [{ domainName: null, count: null }],
      avgTime: null,
    });
    repository.getEfficiencyAnalytics.mockResolvedValue([]);

    await expect(engine.getExamActivity()).resolves.toEqual({
      started: 0,
      completed: 0,
      abandoned: 0,
      byDomain: [{ name: null, count: 0 }],
      avgCompletionTimeMinutes: 0,
    });
    await expect(engine.getEfficiencyAnalytics()).resolves.toEqual({
      mastery: 0,
      persistence: 0,
      rash: 0,
      struggle: 0,
      noData: 0,
      total: 0,
    });

    trendSummaryMock.mockResolvedValue({ avgScore: 10, passRate: 0.1, totalExams: 1, bestSkill: null, worstSkill: null, currentStreak: 0 });
    periodDeltaMock.mockResolvedValue({ currentAvg: 10, previousAvg: null, deltaPct: null });
    domainDeltasMock.mockResolvedValue({});
    execHealthMock.mockReturnValue('yellow');
    executeMock
      .mockResolvedValueOnce({ rows: [{ dimensionId: null, name: null, avgAccuracy: undefined, count: undefined }] })
      .mockResolvedValueOnce({ rows: [{ difficulty: 'simple', avgAccuracy: undefined }] })
      .mockResolvedValueOnce({ rows: [] });

    const sparse = await engine.getPerformanceAnalytics('7d');
    expect(sparse.domains[0]).toEqual({
      id: null,
      name: null,
      avgAccuracy: 0,
      sampleSize: 0,
      delta: 0,
    });
    expect(sparse.difficulty[0]).toEqual({ level: 'simple', avgAccuracy: 0 });
  });
});
