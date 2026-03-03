import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';
import { ScoringEngine } from '../scoring.engine';

vi.mock('@/modules/report-engine/performance.service', () => ({
  PerformanceService: {
    invalidateCache: vi.fn().mockResolvedValue(undefined),
    refreshAnalytics: vi.fn().mockResolvedValue(undefined),
    cacheReport: vi.fn().mockResolvedValue(undefined),
    getCachedReport: vi.fn().mockResolvedValue(null),
  },
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
  it('adds mapping_type and category dimensions when skills provide them', async () => {
    const exam = {
      id: 'exam-1',
      userId: 'u1',
      status: 'started',
      startedAt: new Date(),
      completedAt: new Date(),
      blueprintId: null,
      examQuestions: [
        {
          isCorrect: true,
          question: {
            id: 'q1',
            topicId: 't1',
            subtopicId: 'st1',
            difficulty: 'expert',
            questionSkills: [
              { skill: { id: 'sk1', name: 'Algo', weight: 2, category: 'technical', mappingType: 'conceptual' } },
              { skill: { id: 'sk2', name: 'DS', weight: null, category: 'process', mappingType: 'practical' } },
            ],
          },
        },
      ],
    };

    (db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(exam) };
    (db.query as any).topics = {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 't1',
          name: 'Topic 1',
          subject: { id: 's1', name: 'Subject 1', domain: { id: 'd1', name: 'Domain 1' } },
          topicSkills: [{ skill: { id: 'sk1', name: 'Algo', weight: 2, category: 'technical', mappingType: 'conceptual' } }],
          subtopics: [{ id: 'st1', name: 'Subtopic 1' }],
        },
      ]),
    };

    (db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    (db as any).insert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([]) }) });
    (db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    const score = await ScoringEngine.calculateExamResults('exam-1');
    expect(score).toBe(100);
    // should have inserted results_by_dimension
    expect((db as any).insert).toHaveBeenCalled();
  });

  it('falls back to failure path and marks exam failed when upstream throws', async () => {
    (db.query as any).exams = { findFirst: vi.fn().mockRejectedValue(new Error('boom')) };
    (db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) });

    await expect(ScoringEngine.calculateExamResults('bad-exam')).rejects.toThrow('boom');
    expect((db as any).update).toHaveBeenCalled();
  });
});
