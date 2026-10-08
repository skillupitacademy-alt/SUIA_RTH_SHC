import { describe, it, expect, vi, beforeEach } from 'vitest';

import { db } from '@quiz/db';
import { container } from '@/modules/core/container';
import { PerformanceService } from '@/modules/report-engine/performance.service';
import { ScoringEngine } from '../scoring.engine';
import { installSelectMock } from '../../../test/select-mock';

const mockPerformanceService = {
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  refreshAnalytics: vi.fn().mockResolvedValue(undefined),
  cacheReport: vi.fn().mockResolvedValue(undefined),
  getCachedReport: vi.fn().mockResolvedValue(null),
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

describe('ScoringEngine mapping/category branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.register(PerformanceService, mockPerformanceService as any);
  });

  it('adds mapping_type and category dimensions when skills provide them', async () => {
    const exam = {
      id: 'exam-1',
      userId: 'u1',
      status: 'started',
      startedAt: new Date(),
      completedAt: new Date(),
      blueprintId: null,
    };
    const eqRows = [
      {
        examQuestion: { id: 'eq1', examId: 'exam-1', questionId: 'q1', isCorrect: true },
        question: { id: 'q1', topicId: 't1', subtopicId: 'st1', difficulty: 'expert', questionText: 'Q', correctAnswer: 'A' },
        skill: { id: 'sk1', name: 'Algo', weight: 2, category: 'technical', mappingType: 'conceptual' },
      },
      {
        examQuestion: { id: 'eq1', examId: 'exam-1', questionId: 'q1', isCorrect: true },
        question: { id: 'q1', topicId: 't1', subtopicId: 'st1', difficulty: 'expert', questionText: 'Q', correctAnswer: 'A' },
        skill: { id: 'sk2', name: 'DS', weight: null, category: 'process', mappingType: 'practical' },
      },
    ];
    const topicRaw = [{
      topic: { id: 't1', name: 'Topic 1', subjectId: 's1' },
      subject: { id: 's1', name: 'Subject 1', domainId: 'd1' },
      domain: { id: 'd1', name: 'Domain 1' },
    }];
    const topicSkillRows = [{
      topicSkill: { topicId: 't1', skillId: 'sk1' },
      skill: { id: 'sk1', name: 'Algo', weight: 2, category: 'technical', mappingType: 'conceptual' },
    }];
    const subtopicRows = [{ id: 'st1', topicId: 't1', name: 'Subtopic 1' }];

    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [{ exam, blueprint: {} }] },
      { resolveOn: 'where', result: eqRows },
      { resolveOn: 'where', result: topicRaw },
      { resolveOn: 'where', result: topicSkillRows },
      { resolveOn: 'where', result: subtopicRows },
    ]);

    (db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    (db as any).insert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) });
    (db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });
    (db as any).transaction = vi.fn(async (fn) => fn(db));

    const score = await container.get(ScoringEngine).calculateExamResults('exam-1');
    expect(score).toBe(100);
    // should have inserted results_by_dimension
    expect((db as any).insert).toHaveBeenCalled();
  });

  it('falls back to failure path and marks exam failed when upstream throws', async () => {
    (db as any).select = vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error('boom')),
    }));
    (db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    await expect(container.get(ScoringEngine).calculateExamResults('bad-exam')).rejects.toThrow('boom');
    expect((db as any).update).toHaveBeenCalled();
  });
});
