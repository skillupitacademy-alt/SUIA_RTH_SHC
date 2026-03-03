import { describe, it, expect } from 'vitest'

import { InsightEngineService } from '@/modules/analytics/insight-engine.service'

describe('InsightEngineService empty segments', () => {
  it('handles empty accuracy and scores safely', async () => {
    const res = InsightEngineService.analyzeMasteryTrend(
      'User',
      { accuracy: [], dates: [] },
      { scores: [] }
    )
    expect(res.sampleSize).toBe(0)
    expect(res.confidence).toBe('low')
  })
})
