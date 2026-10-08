import { describe, it, expect, vi } from 'vitest';
import { installSelectMock } from '../../../test/select-mock';
import { db } from '@quiz/db';

vi.mock('../report-engine/performance.service', () => ({
  PerformanceService: { invalidateCache: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    query: {
      exams: { findFirst: vi.fn().mockResolvedValue(undefined) },
      topics: { findMany: vi.fn().mockResolvedValue([]) },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          catch: vi.fn().mockResolvedValue(undefined),
        })),
      })),
    })),
  },
  exams: {},
  examBlueprints: {},
  examQuestions: {},
  questions: {},
  questionSkills: {},
  skills: {},
  resultsByDimension: {},
  topics: {},
  subjects: {},
  domains: {},
  subtopics: {},
  topicSkills: {},
}));

describe('ScoringEngine.calculateExamResults guard', () => {
  it('throws when exam not found (line 45)', async () => {
    const { container } = await import('@/modules/core/container');
    const { ScoringEngine } = await import('../scoring.engine');
    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [] },
    ]);
    await expect(container.get(ScoringEngine).calculateExamResults('missing')).rejects.toThrow(/Exam not found/);
  }, 20000);
});


