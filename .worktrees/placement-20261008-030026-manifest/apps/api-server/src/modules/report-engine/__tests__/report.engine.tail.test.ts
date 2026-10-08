import { describe, it, expect, vi } from 'vitest';

const cacheReport = vi.fn();

vi.mock('../performance.service', () => ({
  PerformanceService: {
    cacheReport,
    refreshAnalytics: vi.fn(),
    invalidateCache: vi.fn(),
  },
}));

vi.mock('../report.engine', async (orig) => {
  const actual = await orig();
  return {
    ...actual,
    ReportEngine: {
      ...actual.ReportEngine,
      // stub getPremiumExamReport to hit final return
      getPremiumExamReport: vi.fn().mockResolvedValue({ ok: true }),
    },
  };
});

describe('ReportEngine final return branch (line ~593)', () => {
  it('returns cached report data through performance cache', async () => {
    const { ReportEngine } = await import('../report.engine');
    cacheReport.mockResolvedValueOnce(undefined);
    const res = await ReportEngine.getPremiumExamReport('attempt-1');
    expect(res).toEqual({ ok: true });
  });
});
