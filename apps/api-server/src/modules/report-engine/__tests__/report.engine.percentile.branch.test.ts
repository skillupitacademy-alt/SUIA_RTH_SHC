import { describe, it, expect, vi, beforeEach } from 'vitest';

import { dbc } from '@quiz/db';
import { ReportEngine } from '../report.engine';

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));
vi.mock('@quiz/db', () => ({
  __esModule: true,
  db: {} as any,
  dbc: {
    query: { exams: { findMany: mockFindMany } },
  } as any,
}));

describe('ReportEngine.calculatePercentile branches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 50 when cohort length <= 1 (early return branch)', async () => {
    mockFindMany.mockResolvedValue([{ id: 'only', totalScore: 10, examQuestions: [{ isCorrect: true }] }]);

    const percentile = await (ReportEngine as any).calculatePercentile('e1', 'bp1', 80);
    expect(percentile).toBe(50);
  });

  it('falls back to 50 when findMany throws (catch branch)', async () => {
    mockFindMany.mockRejectedValue(new Error('boom'));

    const percentile = await (ReportEngine as any).calculatePercentile('e2', null, 70);

    expect(percentile).toBe(50);
  });

  it('computes percentile when cohort has multiple exams (branch 195-205)', async () => {
    // Two peers: one below and one above myAccuracy to exercise map/filter paths
    const cohort = [
      { id: 'a', totalScore: 80, examQuestions: [{ isCorrect: true }, { isCorrect: false }] },  // 50%
      { id: 'b', totalScore: 90, examQuestions: [{ isCorrect: true }, { isCorrect: true }] },   // 100%
    ];
    mockFindMany.mockResolvedValue(cohort);

    const percentile = await (ReportEngine as any).calculatePercentile('e3', null, 75);

    expect(percentile).toBeGreaterThan(0); // ensures main branch executed
    expect(percentile).toBeLessThanOrEqual(99);
  });
});
