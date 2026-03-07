import { describe, it, expect, vi } from 'vitest';

const mockDb = {
  query: {
    exams: { findFirst: vi.fn().mockRejectedValue(new Error('Exam not found')) },
  },
  update: vi.fn(() => ({
    set: () => ({
      where: () =>
        // return a real Promise so `.catch` is available on the chain
        Promise.resolve(),
    }),
  })),
};

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: mockDb,
  exams: {},
  resultsByDimension: {},
}));

describe('ScoringEngine early guard (line 45)', () => {
  it('throws when exam not found', async () => {
    const { container } = await import('@/modules/core/container');
    const { ScoringEngine } = await import('../scoring.engine');
    await expect(container.get(ScoringEngine).calculateExamResults('missing')).rejects.toThrow('Exam not found');
  }, 20000);
});


