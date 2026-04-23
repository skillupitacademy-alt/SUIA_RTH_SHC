import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { ReportEngine } from '@/modules/report-engine/report.engine'

describe('ReportEngine phase 3 coverage', () => {
  it('getUserPerformance returns zeroed stats when no exams', async () => {
    (db.query as any).exams = { findMany: vi.fn().mockResolvedValue([]) }

    const res = await ReportEngine.getUserPerformance('user-x')
    expect(res.examsCompleted).toBe(0)
    expect(res.averageScore).toBe(0)
  })

  it('calculatePercentile returns median 50 when cohort size is <= 1', async () => {
    (db.query as any).exams = { findMany: vi.fn().mockResolvedValue([{
      id: 'e1',
      totalScore: 80,
      examQuestions: [{ isCorrect: true }],
    }]) }

    const percentile = await (ReportEngine as any).calculatePercentile('e1', null, 80)
    expect(percentile).toBe(50)
  })
})
