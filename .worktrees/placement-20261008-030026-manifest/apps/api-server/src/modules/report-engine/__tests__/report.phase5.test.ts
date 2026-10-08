import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/tracer', () => ({
  withSpan: vi.fn((_: string, fn: (span: { setAttribute: (k: string, v: string) => void }) => unknown) =>
    fn({ setAttribute: vi.fn() })),
}));

describe('ReportEngine phase 5 resilience', () => {
  it('returns cached premium report to avoid heavy recomputation', async () => {
    const { ReportEngine } = await import('@/modules/report-engine/report.engine')
    const cached = { examId: 'e1', score: 90 } as any
    const perf = { getCachedReport: vi.fn().mockResolvedValue(cached) }
    const mockDb = { query: { exams: { findFirst: vi.fn() } }, execute: vi.fn() }

    const engine = new ReportEngine(mockDb as any, perf as any)
    const res = await engine.getPremiumExamReport('e1')

    expect(res).toBe(cached)
    expect(mockDb.query.exams.findFirst).not.toHaveBeenCalled()
  })
})
