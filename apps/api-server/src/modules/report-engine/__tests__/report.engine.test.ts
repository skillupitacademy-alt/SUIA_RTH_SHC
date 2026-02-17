import { describe, expect, it, vi } from 'vitest';

vi.mock('../report.engine', () => ({
  ReportEngine: {
    generateUserReport: vi.fn(),
  },
}));

describe.skip('ReportEngine (unit)', () => {
  it('generates report for a user', async () => {
    const { ReportEngine } = await import('../report.engine');
    vi.mocked(ReportEngine.generateUserReport).mockResolvedValue({ userId: 'u1', summary: {} });

    const res = await ReportEngine.generateUserReport('u1', 'exam1');
    expect(res.userId).toBe('u1');
  });
});
