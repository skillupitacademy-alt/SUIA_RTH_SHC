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
      where: _selectInnerJoinWhereMock,
    })),
    groupBy: _selectGroupByMock,
  }));
  return {
    examsFindManyMock: vi.fn(),
    resultsByDimensionFindManyMock: vi.fn(),
    selectWhereMock: _selectWhereMock,
    selectGroupByMock: _selectGroupByMock,
    selectInnerJoinWhereMock: _selectInnerJoinWhereMock.mockImplementation(() => ({ groupBy: _selectGroupByMock })),
    selectFromMock: _selectFromMock,
    selectMock: vi.fn(() => ({ from: _selectFromMock })),
    trajectoryMock: vi.fn(),
  };
});

vi.mock('@quiz/db', () => ({
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
    vi.clearAllMocks();
    trajectoryMock.mockReturnValue({ predictedMasteryDate: null, isStruggling: false });
  });

  it('covers score trends, skill trends, and summary branches', async () => {
    examsFindManyMock.mockResolvedValueOnce([
      { id: 'e2', completedAt: new Date('2025-01-02'), totalScore: 80, blueprint: { name: 'B2' } },
      { id: 'e1', completedAt: new Date('2025-01-01'), totalScore: 60, blueprint: { name: 'B1' } },
    ]);
    const scoreTrends = await TrendsService.getScoreTrends({ userId: 'u1', range: '14d' });
    expect(scoreTrends[0].examId).toBe('e1');
    expect(scoreTrends[1].passed).toBe(true);

    examsFindManyMock.mockResolvedValueOnce([
      { id: 'e3', completedAt: new Date('2025-01-03') },
      { id: 'e2', completedAt: new Date('2025-01-02') },
      { id: 'e1', completedAt: new Date('2025-01-01') },
    ]);
    resultsByDimensionFindManyMock.mockResolvedValueOnce([
      { examId: 'e3', dimensionType: 'skill', dimensionId: 's1', name: 'Skill1', accuracy: 90 },
      { examId: 'e2', dimensionType: 'skill', dimensionId: 's1', name: 'Skill1', accuracy: 70 },
      { examId: 'e1', dimensionType: 'skill', dimensionId: 's2', name: 'Skill2', accuracy: 40 },
      { examId: 'e1', dimensionType: 'skill', dimensionId: null, name: 'Bad', accuracy: 10 },
    ]);
    const skillTrends = await TrendsService.getSkillTrends({ range: '7d' });
    expect(skillTrends[0].trend).toBe('improving');

    examsFindManyMock.mockResolvedValueOnce([]);
    await expect(TrendsService.getSkillTrends({ range: 'bad' })).resolves.toEqual([]);

    examsFindManyMock.mockResolvedValueOnce([
      { totalScore: 80 },
      { totalScore: 75 },
      { totalScore: 40 },
    ]);
    examsFindManyMock.mockResolvedValueOnce([{ id: 'e1', completedAt: new Date(), totalScore: 80 }]);
    resultsByDimensionFindManyMock.mockResolvedValueOnce([{ examId: 'e1', dimensionType: 'skill', dimensionId: 's1', name: 'Skill1', accuracy: 88 }]);
    const summary = await TrendsService.getTrendSummary({ range: '28d' });
    expect(summary.avgScore).toBe(65);
    expect(summary.currentStreak).toBe(2);

    examsFindManyMock.mockResolvedValueOnce([]);
    const empty = await TrendsService.getTrendSummary({ range: '90d' });
    expect(empty.totalExams).toBe(0);
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

    examsFindManyMock.mockResolvedValueOnce([
      { id: 'e10', completedAt: new Date('2025-01-10') },
      { id: 'e9', completedAt: new Date('2025-01-09') },
      { id: 'e8', completedAt: new Date('2025-01-08') },
    ]);
    resultsByDimensionFindManyMock.mockResolvedValueOnce([
      // stable branch delta=0
      { examId: 'e10', dimensionType: 'skill', dimensionId: 's-stable', name: null, accuracy: 50 },
      { examId: 'e9', dimensionType: 'skill', dimensionId: 's-stable', name: null, accuracy: 50 },
      // declining branch delta<-5
      { examId: 'e10', dimensionType: 'skill', dimensionId: 's-dec', name: 'Decline', accuracy: 40 },
      { examId: 'e9', dimensionType: 'skill', dimensionId: 's-dec', name: 'Decline', accuracy: 60 },
      // missing exam date path (should be ignored)
      { examId: 'missing', dimensionType: 'skill', dimensionId: 's-ignore', name: 'X', accuracy: 99 },
    ]);
    const skills = await TrendsService.getSkillTrends({ range: '7d' });
    expect(skills.some(s => s.trend === 'stable')).toBe(true);
    expect(skills.some(s => s.trend === 'declining')).toBe(true);
    expect(skills.some(s => s.skillName === 'Unknown Skill')).toBe(true);
  });
});
