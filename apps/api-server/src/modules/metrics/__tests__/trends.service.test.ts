import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  examsFindManyMock,
  resultsByDimensionFindManyMock,
  selectWhereMock,
  selectGroupByMock,
  selectInnerJoinWhereMock,
  selectFromMock,
  selectMock,
  trajectoryMock,
} = vi.hoisted(() => {
  const _selectWhereMock = vi.fn();
  const _selectGroupByMock = vi.fn();
  const _selectInnerJoinWhereMock = vi.fn();
  const _selectFromMock = vi.fn(() => ({
    where: _selectWhereMock,
    innerJoin: vi.fn(() => ({
      where: _selectInnerJoinWhereMock.mockImplementation(() => ({
        orderBy: vi.fn().mockResolvedValue([]),
        groupBy: _selectGroupByMock
      })),
    })),
    groupBy: _selectGroupByMock,
    orderBy: vi.fn(),
  }));
  return {
    examsFindManyMock: vi.fn(),
    resultsByDimensionFindManyMock: vi.fn(),
    selectWhereMock: _selectWhereMock,
    selectGroupByMock: _selectGroupByMock,
    selectInnerJoinWhereMock: _selectInnerJoinWhereMock,
    selectFromMock: _selectFromMock,
    selectMock: vi.fn(() => ({ from: _selectFromMock })),
    trajectoryMock: vi.fn(),
  };
});

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      exams: { findMany: examsFindManyMock },
      resultsByDimension: { findMany: resultsByDimensionFindManyMock },
    },
    select: selectMock,
  },
  exams: { id: 'exams.id', status: 'exams.status', completedAt: 'exams.completedAt', userId: 'exams.userId', totalScore: 'exams.totalScore' },
  resultsByDimension: { examId: 'resultsByDimension.examId', dimensionType: 'resultsByDimension.dimensionType', dimensionId: 'resultsByDimension.dimensionId', name: 'resultsByDimension.name', accuracy: 'resultsByDimension.accuracy' },
}));

vi.mock('@/modules/intelligence/forecast.service', () => ({
  ForecastService: { calculateTrajectory: trajectoryMock },
}));

import { TrendsService } from '../trends.service';

describe('TrendsService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    trajectoryMock.mockReturnValue({ predictedMasteryDate: null, isStruggling: false });
    // Re-mock select chain defaults after reset
    selectMock.mockReturnValue({ from: selectFromMock });
    selectFromMock.mockReturnValue({
      where: selectWhereMock,
      innerJoin: vi.fn(() => ({
        where: selectInnerJoinWhereMock.mockImplementation(() => ({
          orderBy: vi.fn().mockResolvedValue([]),
          groupBy: selectGroupByMock
        })),
      })),
      groupBy: selectGroupByMock,
      orderBy: vi.fn(),
    });
  });

  it('covers score trends, skill trends, and summary branches', async () => {
    const recentDate = new Date();
    examsFindManyMock.mockResolvedValueOnce([
      { id: 'e2', completedAt: recentDate, totalScore: 80, blueprint: { name: 'B2' } },
      { id: 'e1', completedAt: new Date(recentDate.getTime() - 86400000), totalScore: 60, blueprint: { name: 'B1' } },
    ]);
    const scoreTrends = await TrendsService.getScoreTrends({ userId: 'u1', range: '14d' });
    expect(scoreTrends.length).toBe(2);
    expect(scoreTrends[0].examId).toBe('e1');
    expect(scoreTrends[1].passed).toBe(true);

    const skillResults = [
      { examId: 'e3', skillId: 's1', skillName: 'Skill1', accuracy: 90, completedAt: recentDate },
      { examId: 'e2', skillId: 's1', skillName: 'Skill1', accuracy: 70, completedAt: new Date(recentDate.getTime() - 86400000) },
    ];
    selectInnerJoinWhereMock.mockImplementationOnce(() => ({
      orderBy: vi.fn().mockResolvedValue(skillResults)
    }));

    const skillTrends = await TrendsService.getSkillTrends({ range: '7d' });
    expect(skillTrends.length).toBeGreaterThan(0);
    expect(skillTrends[0].trend).toBe('improving');

    selectInnerJoinWhereMock.mockImplementationOnce(() => ({
      orderBy: vi.fn().mockResolvedValue([])
    }));
    await expect(TrendsService.getSkillTrends({ range: '77d' })).resolves.toEqual([]);

    examsFindManyMock.mockResolvedValueOnce([{ id: 'unq1', completedAt: recentDate, totalScore: 777, blueprint: { name: 'UQ' } }]);
    selectInnerJoinWhereMock.mockImplementationOnce(() => ({
      orderBy: vi.fn().mockResolvedValue([{ 
        examId: 'unq1', completedAt: recentDate, skillId: 's1', skillName: 'Skill1', accuracy: 88 
      }])
    }));

    const summary = await TrendsService.getTrendSummary({ range: '28d' });
    expect(summary.avgScore).toBe(777);
    expect(summary.totalExams).toBe(1);
  });

  it('covers period delta, exec health, and domain deltas', async () => {
    selectWhereMock
      .mockResolvedValueOnce([{ score: 80 }, { score: 70 }])
      .mockResolvedValueOnce([{ score: 60 }, { score: 55 }]);
    const delta = await TrendsService.getPeriodDelta('u1', '7d');
    expect(delta?.deltaPct).toBe(17);

    selectWhereMock.mockResolvedValueOnce([{ score: 80 }]).mockResolvedValueOnce([]);
    await expect(TrendsService.getPeriodDelta(undefined, '7d')).resolves.toBeNull();

    expect(TrendsService.getExecHealth(72, 1)).toBe('green');
    expect(TrendsService.getExecHealth(60, -2)).toBe('yellow');
    expect(TrendsService.getExecHealth(40, -10)).toBe('red');

    selectGroupByMock
      .mockResolvedValueOnce([{ id: 'd1', name: 'Domain1', score: 80 }])
      .mockResolvedValueOnce([{ id: 'd1', name: 'Domain1', score: 70 }, { id: null, name: 'Ignore', score: 10 }]);
    const domain = await TrendsService.getDomainDeltas('14d');
    expect(domain.d1.delta).toBe(10);
  });

  it('covers additional trend branches (missing dates, stable/declining, and parse-range fallback)', async () => {
    examsFindManyMock.mockResolvedValueOnce([
      { id: 'e2', completedAt: null, totalScore: null, blueprint: null },
    ]);
    const scoreTrends = await TrendsService.getScoreTrends({ range: 'bad-range' });
    expect(scoreTrends[0].score).toBe(0);
    expect(scoreTrends[0].blueprintName).toBeNull();

    const recentDate = new Date();
    examsFindManyMock.mockResolvedValueOnce([
      { id: 'e10', completedAt: recentDate },
      { id: 'e9', completedAt: new Date(recentDate.getTime() - 86400000) },
    ]);
    const results = [
      { examId: 'e10', skillId: 's-stable', skillName: null, accuracy: 50, completedAt: recentDate },
      { examId: 'e9', skillId: 's-stable', skillName: null, accuracy: 50, completedAt: new Date(recentDate.getTime() - 86400000) },
      { examId: 'e10', skillId: 's-dec', skillName: 'Decline', accuracy: 40, completedAt: recentDate },
      { examId: 'e9', skillId: 's-dec', skillName: 'Decline', accuracy: 60, completedAt: new Date(recentDate.getTime() - 86400000) },
    ];
    selectInnerJoinWhereMock.mockImplementationOnce(() => ({
      orderBy: vi.fn().mockResolvedValue(results)
    }));
    const skills = await TrendsService.getSkillTrends({ range: '7d' });
    expect(skills.some(s => s.trend === 'stable')).toBe(true);
    expect(skills.some(s => s.trend === 'declining')).toBe(true);
    expect(skills.some(s => s.skillName === 'Unknown Skill')).toBe(true);
  });

  it('covers summary null best/worst and period delta null deltaPct branch', async () => {
    examsFindManyMock.mockResolvedValueOnce([
      { totalScore: 55 },
      { totalScore: 50 },
      { totalScore: 40 },
    ]);
    examsFindManyMock.mockResolvedValueOnce([{ id: 'e1', completedAt: new Date(), totalScore: 50 }]);
    resultsByDimensionFindManyMock.mockResolvedValueOnce([{ examId: 'e1', dimensionType: 'skill', dimensionId: 's1', name: 'Skill1', accuracy: 50, completedAt: new Date() }]);
    selectInnerJoinWhereMock.mockImplementationOnce(() => ({
      orderBy: vi.fn().mockResolvedValue(resultsByDimensionFindManyMock())
    }));
    const summary = await TrendsService.getTrendSummary({ range: '7d' });
    expect(summary.bestSkill).toBeNull();
    expect(summary.worstSkill).toBeNull();

    selectWhereMock
      .mockResolvedValueOnce([]) // current window, avg null
      .mockResolvedValueOnce([{ score: 60 }, { score: 70 }, { score: 80 }]); // previous window, enough samples total
    const delta = await TrendsService.getPeriodDelta(undefined, '7d');
    expect(delta?.currentAvg).toBeNull();
    expect(delta?.deltaPct).toBeNull();
  });

  it('covers domain delta branch where current ids are missing and previous has unmatched ids', async () => {
    selectGroupByMock
      .mockResolvedValueOnce([{ id: null, name: 'Ignore', score: 90 }])
      .mockResolvedValueOnce([{ id: 'd9', name: 'PrevOnly', score: 40 }]);

    const domain = await TrendsService.getDomainDeltas('7d');
    expect(domain).toEqual({});
  });

  it('covers summary pass-rate and streak break paths with mixed pass/fail ordering', async () => {
    examsFindManyMock.mockResolvedValueOnce([
      { totalScore: 100, completedAt: new Date() },
      { totalScore: 50, completedAt: new Date() },
    ]);
    const summary = await TrendsService.getTrendSummary({ range: '7d' });
    expect(summary.avgScore).toBe(75); // (100 + 50) / 2 = 75
    expect(summary.passRate).toBeCloseTo(0.5, 1);
    expect(summary.currentStreak).toBe(0);
    expect(summary.bestSkill?.name).toBe('Rise');
    expect(summary.worstSkill?.name).toBe('Drop');
  });

  it('handles undefined totalScore during streak calculation', async () => {
    vi.resetAllMocks();
    selectMock.mockReturnValue({ from: selectFromMock });
    selectFromMock.mockReturnValue({
      where: selectWhereMock,
      innerJoin: vi.fn(() => ({
        where: selectInnerJoinWhereMock,
      })),
      groupBy: selectGroupByMock,
      orderBy: vi.fn(),
    });

    examsFindManyMock.mockResolvedValueOnce([
      { totalScore: undefined, completedAt: new Date() }, 
      { totalScore: 90, completedAt: new Date(Date.now() - 86400000) },
    ]);
    
    // getSkillTrends mock
    selectInnerJoinWhereMock.mockImplementationOnce(() => ({
      orderBy: vi.fn().mockResolvedValue([])
    }));

    const summary = await TrendsService.getTrendSummary({ range: '7d' });
    expect(summary.currentStreak).toBe(0);
  });
});


