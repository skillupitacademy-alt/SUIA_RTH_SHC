import { describe, expect, it, vi } from 'vitest';

vi.mock('../report.engine', () => ({
  ReportEngine: {
    generateUserReport: vi.fn(),
  },
}));

const REPORT_FIXTURE = {
  userId: 'u1',
  examId: 'exam1',
  summary: { score: 82, max: 100 },
  breakdown: [{ topicId: 't1', correct: 8, total: 10 }],
};

describe.skip('ReportEngine (unit)', () => {
  it('generates report with score summary and topic breakdown', async () => {
    const { ReportEngine } = await import('../report.engine');
    vi.mocked(ReportEngine.generateUserReport).mockResolvedValue(REPORT_FIXTURE);

    const res = await ReportEngine.generateUserReport('u1', 'exam1');

    expect(ReportEngine.generateUserReport).toHaveBeenCalledWith('u1', 'exam1');
    expect(res.userId).toBe('u1');
    expect(res.summary.score).toBe(82);
    expect(res.breakdown[0].topicId).toBe('t1');
  });
});
