import { describe, it, expect, vi } from 'vitest'

import { redis } from '@/lib/redis'
import { UserAnalyticsService } from '../user-analytics.service'

describe('UserAnalyticsService.getAdaptiveSnapshot', () => {
  it('returns cached snapshot when present', async () => {
    const cached = { topics: [], difficulty: { simple: 1, intermediate: 2, expert: 3 }, pacing: null }
    ;(redis.get as any) = vi.fn().mockResolvedValue(cached)

    const result = await UserAnalyticsService.getAdaptiveSnapshot('u1')
    expect(result).toEqual(cached)
    expect(redis.get).toHaveBeenCalled()
  })

  it('builds snapshot and sets cache on miss', async () => {
    ;(redis.get as any) = vi.fn().mockResolvedValue(null)
    ;(redis.set as any) = vi.fn().mockResolvedValue('ok')

    vi.spyOn(UserAnalyticsService, 'getTopicPerformance').mockResolvedValue([
      { topicId: 't1', topicName: 'Topic 1', accuracy: 50 },
    ])
    vi.spyOn(UserAnalyticsService, 'getDifficultyAccuracy').mockResolvedValue({
      simple: 60,
      intermediate: 70,
      expert: 80,
    })
    vi.spyOn(UserAnalyticsService, 'getPacingStats').mockResolvedValue({
      min: 1,
      q1: 2,
      median: 3,
      q3: 4,
      max: 5,
    })

    const result = await UserAnalyticsService.getAdaptiveSnapshot('u1')
    expect(result.topics[0].topicId).toBe('t1')
    expect(redis.set).toHaveBeenCalled()
  })
})
