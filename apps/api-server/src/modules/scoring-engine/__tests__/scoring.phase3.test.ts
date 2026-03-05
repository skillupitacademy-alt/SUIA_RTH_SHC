import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { container } from '@/modules/core/container'
import { PerformanceService } from '@/modules/report-engine/performance.service'
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine'

const mockPerformanceService = {
  invalidateCache: vi.fn().mockResolvedValue(undefined),
  refreshAnalytics: vi.fn().mockResolvedValue(undefined),
  cacheReport: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@/modules/report-engine/performance.service', () => ({
  PerformanceService: vi.fn().mockImplementation(() => mockPerformanceService),
}))

describe('ScoringEngine phase 3 coverage', () => {
  it('marks exam failed when scoring throws because exam is missing', async () => {
    container.register(PerformanceService, mockPerformanceService as any)
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(undefined) }
    ;(db as any).update = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    })

    await expect(container.get(ScoringEngine).calculateExamResults('missing-exam')).rejects.toThrow('Exam not found')
    expect((db as any).update).toHaveBeenCalled()
  });
});
