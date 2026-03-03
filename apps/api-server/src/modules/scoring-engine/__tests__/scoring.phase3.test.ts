import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { PerformanceService } from '@/modules/report-engine/performance.service'
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine'

describe('ScoringEngine phase 3 coverage', () => {
  it('marks exam failed when scoring throws because exam is missing', async () => {
    vi.spyOn(PerformanceService, 'invalidateCache').mockResolvedValue(undefined as never)
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(undefined) }
    ;(db as any).update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    })

    await expect(ScoringEngine.calculateExamResults('missing-exam')).rejects.toThrow('Exam not found')
    expect((db as any).update).toHaveBeenCalled()
  })
})
