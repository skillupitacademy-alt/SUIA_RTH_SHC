import { describe, it, expect, vi } from 'vitest';

vi.mock('../report-engine/performance.service', () => ({
  PerformanceService: { invalidateCache: vi.fn().mockResolvedValue(undefined) }
}));

vi.mock('@quiz/db', () => ({
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
  resultsByDimension: {},
}));

describe('ScoringEngine.calculateExamResults guard', () => {
  it('throws when exam not found (line 45)', async () => {
    const { ScoringEngine } = await import('../scoring.engine');
    await expect(ScoringEngine.calculateExamResults('missing')).rejects.toThrow(/Exam not found/);
  });
});

