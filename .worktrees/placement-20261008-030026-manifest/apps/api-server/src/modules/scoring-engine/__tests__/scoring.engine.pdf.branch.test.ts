import { describe, it, expect, vi, beforeEach } from 'vitest';
import { container } from '@/modules/core/container';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { db } from '@quiz/db';
import { ScoringEngine } from '../scoring.engine';
import { installSelectMock } from '../../../test/select-mock';

const mockPerformanceService = {
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  refreshAnalytics: vi.fn().mockResolvedValue(undefined),
  cacheReport: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/modules/report-engine/performance.service', () => ({
  PerformanceService: vi.fn().mockImplementation(() => mockPerformanceService),
}));

vi.mock('@/modules/report-engine/report.engine', () => ({
  ReportEngine: {
    getPremiumExamReport: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../services/reports/ReportMaterializer', () => ({
  ReportMaterializer: {
    materialize: vi.fn().mockResolvedValue({}),
  },
}));

describe('ScoringEngine PDF trigger branch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
    container.register(PerformanceService, mockPerformanceService as any);
  });

  it('logs but does not throw when fetch rejects (lines 194,209)', async () => {
    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [{ exam: { id: 'ex1', userId: 'u1', status: 'started', startedAt: new Date(), completedAt: new Date(), blueprintId: null }, blueprint: {} }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [] }, // topicRaw
      { resolveOn: 'where', result: [] }, // topicSkillRows
      { resolveOn: 'where', result: [] }, // subtopicRows
    ]);
    (db.delete as any) = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    (db.insert as any) = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) });
    (db.update as any) = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    (db.transaction as any) = vi.fn(async (fn) => fn(db));

    // make fetch reject to hit catch block
    (global.fetch as any) = vi.fn().mockRejectedValue(new Error('pdf fail'));

    await expect(container.get(ScoringEngine).calculateExamResults('ex1')).resolves.toBe(0);
  });

  it('handles scoring failure and failed status update (lines 45, 209)', async () => {
    const selectMock = vi.fn();
    selectMock
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ exam: { id: 'ex2', userId: 'u1', status: 'started', startedAt: new Date(), completedAt: new Date(), blueprintId: null }, blueprint: {} }]),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockRejectedValue(new Error('topics boom')),
      }));
    (db as any).select = selectMock;

    // Make the status update fail to hit line 209
    const whereReject = vi.fn().mockRejectedValue(new Error('update fail'));
    (db.update as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: whereReject }),
    });

    await expect(container.get(ScoringEngine).calculateExamResults('ex2')).rejects.toBeInstanceOf(Error);
    expect(selectMock).toHaveBeenCalled();
    expect(whereReject).toHaveBeenCalled();
  });
});
