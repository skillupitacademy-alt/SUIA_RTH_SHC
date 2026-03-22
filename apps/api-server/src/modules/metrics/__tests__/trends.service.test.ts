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

describe('TrendsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = {
      from: fromMock.mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      where: whereMock.mockReturnThis(),
      groupBy: groupByMock.mockReturnThis(),
      orderBy: orderByMock.mockReturnThis(),
      then: (resolve: any) => Promise.resolve([]).then(resolve)
    };
    selectMock.mockReturnValue(chain);
  });

  it('getScoreTrends covers all lines', async () => {
    findManyMock.mockResolvedValue([{ id: 'e1', totalScore: 80, blueprint: { name: 'B1' }, completedAt: new Date() }]);
    const res = await TrendsService.getScoreTrends({ userId: 'u1', range: '14d' });
    expect(res[0].score).toBe(80);
  });

  it('getSkillTrends covers complex logic including trajectory', async () => {
    const data = [
      { skillId: 's1', skillName: 'S1', accuracy: 90, completedAt: new Date() },
      { skillId: 's1', skillName: 'S1', accuracy: 80, completedAt: new Date(Date.now() - 86400000) },
    ];
    (selectMock() as any).then = (resolve: any) => Promise.resolve(data).then(resolve);
    // Mock ForecastService if necessary, or let it run
    const res = await TrendsService.getSkillTrends({ userId: 'u1' });
    expect(res[0].delta).toBe(10);
    expect(res[0].trend).toBe('improving');
  });

  it('getTrendSummary handles empty results', async () => {
    findManyMock.mockResolvedValue([]);
    const res = await TrendsService.getTrendSummary({ range: '7d' });
    expect(res.totalExams).toBe(0);
  });

  it('getPeriodDelta calculates time machine metrics', async () => {
    const scores = [{ score: 80 }, { score: 90 }];
    (selectMock() as any).then = (resolve: any) => Promise.resolve(scores).then(resolve);
    const res = await TrendsService.getPeriodDelta('u1', '28d');
    expect(res).not.toBeNull();
  });

  it('getExecHealth returns correct colors', () => {
    expect(TrendsService.getExecHealth(80, 5)).toBe('green');
    expect(TrendsService.getExecHealth(60, 0)).toBe('yellow');
    expect(TrendsService.getExecHealth(40, -10)).toBe('red');
  });

  it('getDomainDeltas covers SQL aggregation', async () => {
    (selectMock() as any).then = (resolve: any) => Promise.resolve([
        { id: 'd1', name: 'D1', score: 85 }
    ]).then(resolve);
    const res = await TrendsService.getDomainDeltas('7d');
    expect(res['d1'].current).toBe(85);
  });
});
