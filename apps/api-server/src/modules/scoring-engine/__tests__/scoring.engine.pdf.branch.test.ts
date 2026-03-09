import { describe, it, expect, vi, beforeEach } from 'vitest';
import { container } from '@/modules/core/container';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { db } from '@quiz/db';
import { ScoringEngine } from '../scoring.engine';

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
    (db.query as any) = {
      exams: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'ex1',
          userId: 'u1',
          status: 'started',
          startedAt: new Date(),
          lastAnsweredAt: null,
          examQuestions: [],
        }),
      },
    };
    (db.delete as any) = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    (db.insert as any) = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) });
    (db.update as any) = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    (db.transaction as any) = vi.fn(async (fn) => fn(db));
    (db.query as any).topics = { findMany: vi.fn().mockResolvedValue([]) };

    // make fetch reject to hit catch block
    (global.fetch as any) = vi.fn().mockRejectedValue(new Error('pdf fail'));

    await expect(container.get(ScoringEngine).calculateExamResults('ex1')).resolves.toBe(0);
  });

  it('handles scoring failure and failed status update (lines 45, 209)', async () => {
    // Exam with a question so topics.findMany is invoked (branch ~45)
    const examQuestion = { question: { topicId: 't1', questionSkills: [], subtopics: [] } };
    (db.query as any) = {
      exams: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'ex2',
          userId: 'u1',
          status: 'started',
          startedAt: new Date(),
          lastAnsweredAt: null,
          examQuestions: [examQuestion],
        }),
      },
      topics: {
        findMany: vi.fn().mockRejectedValue(new Error('topics boom')),
      },
    };

    // Make the status update fail to hit line 209
    const whereReject = vi.fn().mockRejectedValue(new Error('update fail'));
    (db.update as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: whereReject }),
    });

    await expect(container.get(ScoringEngine).calculateExamResults('ex2')).rejects.toBeInstanceOf(Error);
    expect((db.query as any).topics.findMany).toHaveBeenCalled();
    expect(whereReject).toHaveBeenCalled();
  });
});
