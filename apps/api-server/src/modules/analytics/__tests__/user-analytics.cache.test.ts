import { describe, it, expect, vi } from 'vitest'

import { UserAnalyticsService } from '@/modules/analytics/user-analytics.service'

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn().mockResolvedValue({ topics: [], difficulty: { simple: 0, intermediate: 0, expert: 0 }, pacing: null }),
    set: vi.fn().mockResolvedValue(undefined),
  }
}))

vi.mock('@/lib/db', () => ({
  sql: vi.fn().mockResolvedValue([]),
}))

describe('UserAnalyticsService caching', () => {
  it('returns cached adaptive snapshot when present', async () => {
    const res = await UserAnalyticsService.getAdaptiveSnapshot('u1')
    expect(res.topics).toEqual([])
  })
})
