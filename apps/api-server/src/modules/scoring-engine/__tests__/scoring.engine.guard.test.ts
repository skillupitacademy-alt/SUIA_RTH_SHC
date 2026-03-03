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
  db: mockDb,
  exams: {},
  resultsByDimension: {},
}));

describe('ScoringEngine early guard (line 45)', () => {
  it('throws when exam not found', async () => {
    const { ScoringEngine } = await import('../scoring.engine');
    await expect(ScoringEngine.calculateExamResults('missing')).rejects.toThrow('Exam not found');
  });
});
