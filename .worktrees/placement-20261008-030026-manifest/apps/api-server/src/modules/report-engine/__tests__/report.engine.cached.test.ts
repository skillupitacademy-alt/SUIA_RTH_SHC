import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { cacheService } from '@/modules/core/cache.service'
import { ReportEngine } from '@/modules/report-engine/report.engine'

describe('ReportEngine cached vs rebuild branches', () => {
  it('returns cached report if present', async () => {
    const cached = { examId: 'e1', score: 80 }
    vi.spyOn(cacheService, 'get').mockResolvedValue(cached as any)
    ;(db as any).query = { exams: { findFirst: vi.fn().mockResolvedValue(null) } }
    const dbSpy = vi.spyOn((db as any).query.exams, 'findFirst')

    const res = await ReportEngine.getPremiumExamReport('e1')
    expect(res).toEqual(cached)
    expect(dbSpy).not.toHaveBeenCalled()
  })
})
