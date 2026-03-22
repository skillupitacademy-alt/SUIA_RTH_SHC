import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TrendsService } from '../trends.service';

const {
  findManyMock,
  selectMock,
  fromMock,
  whereMock,
  groupByMock,
  orderByMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  selectMock: vi.fn(),
  fromMock: vi.fn(),
  whereMock: vi.fn(),
  groupByMock: vi.fn(),
  orderByMock: vi.fn(),
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      exams: { findMany: findManyMock },
    },
    select: selectMock,
  },
  exams: { id: 'exams.id', userId: 'exams.userId', completedAt: 'exams.completedAt', status: 'exams.status', totalScore: 'exams.totalScore' },
  resultsByDimension: { dimensionType: 'resultsByDimension.dimensionType', accuracy: 'resultsByDimension.accuracy', examId: 'resultsByDimension.examId', dimensionId: 'resultsByDimension.dimensionId', name: 'resultsByDimension.name' },
}));

describe('TrendsService Ultimate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockReturnValue({
      from: fromMock.mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: whereMock.mockReturnThis(),
      groupBy: groupByMock.mockReturnThis(),
      orderBy: orderByMock.mockReturnThis(),
      then: (resolve: any) => Promise.resolve([]).then(resolve)
    });
  });

  it('covers all static methods', async () => {
    findManyMock.mockResolvedValue([{ id: 'e1', totalScore: 80, blueprint: { name: 'B1' }, completedAt: new Date() }]);
    await TrendsService.getScoreTrends({ userId: 'u1' });
    await TrendsService.getSkillTrends({ userId: 'u1' });
    await TrendsService.getTrendSummary({ range: '7d' });
    await TrendsService.getPeriodDelta('u1');
    expect(TrendsService.getExecHealth(80, 5)).toBe('green');
    await TrendsService.getDomainDeltas();
  });
});
