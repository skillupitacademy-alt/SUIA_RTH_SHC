import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ReportEngine } from '../report.engine';
import { installSelectMock } from '../../../test/select-mock';

vi.mock('@/modules/report-engine/performance.service', () => ({
  PerformanceService: {
    cacheReport: vi.fn(),
    getCachedReport: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../report-interpreter.service', () => ({
  ReportInterpreter: {
    interpret: vi.fn().mockReturnValue({}),
  },
}));

describe('ReportEngine tutorInsights late branch', () => {
  beforeEach(() => {
    (ReportEngine as any)._db = undefined;
  });

  it('returns [] when score >= 95 and confidence high (branch ~591)', async () => {
    const exam = {
      id: 'ex1',
      userId: 'u1',
      status: 'completed',
      startedAt: new Date(),
      completedAt: new Date(),
      blueprintId: null,
      examQuestions: [],
    };

    const coreRow = {
      score: 96,
      question_count: 10,
      total_time: 100,
      mastery: 95,
      percentile: 90,
      confidence: 'HIGH',
      is_inconsistent: false,
      weakest_subtopic: null,
      weakest_skill: null,
      weakest_difficulty: null,
      stable_time_sec: 10,
      logic_time_sec: 10,
      neural_time_sec: 10,
      subtopics: [],
      skills: [],
      heatmap: [],
      difficulty: [],
      expert_drop_off: false,
    };

    const mockDb = {
      query: {
        exams: { findFirst: vi.fn().mockResolvedValue(exam) },
        resultsByDimension: { findMany: vi.fn().mockResolvedValue([]) },
        // Fallback hierarchy lookup (lines ~478) expects examQuestions with relations
        examQuestions: { findFirst: vi.fn().mockResolvedValue(null) },
        userProfiles: { findFirst: vi.fn().mockResolvedValue({ name: 'Test User' }) },
      },
      execute: vi.fn()
        // core query result
        .mockResolvedValueOnce({ rows: [coreRow] })
        // raw questions
        .mockResolvedValueOnce({ rows: [] }),
    };

    installSelectMock(mockDb as any, [
      { resolveOn: 'limit', result: [{ exam, blueprint: null }] },
      { resolveOn: 'limit', result: [{ name: 'Test User' }] }, // candidateName
    ]);

    (ReportEngine as any)._db = mockDb;

    const result = await ReportEngine.getPremiumExamReport('ex1');
    expect(result.tutorInsights).toEqual([]);
  });
});
