import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((_: string, fn: (span: { setAttribute: (k: string, v: string) => void }) => unknown) =>
    fn({ setAttribute: vi.fn() })),
}));

describe('ReportEngine (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('computes performance summary for user exams', async () => {
    const { ReportEngine } = await import('@/modules/report-engine/report.engine');
    const mockDb = {
      query: {
        exams: {
          findMany: vi.fn().mockResolvedValue([
            { totalScore: 80, dimensions: [{ id: 'd1' }] },
            { totalScore: null, dimensions: [] },
          ]),
        },
      },
    };

    const engine = new ReportEngine(mockDb as any);
    const res = await engine.getUserPerformance('u1');

    expect(res.examsCompleted).toBe(2);
    expect(res.averageScore).toBe(40);
    expect(res.dimensions).toHaveLength(1);
  });
});
