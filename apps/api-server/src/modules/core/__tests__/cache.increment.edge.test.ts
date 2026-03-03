import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '@/modules/core/cache.service'

describe('CacheService increment edge', () => {
  it('uses local fallback when redis unavailable', async () => {
    ;(cacheService as any).redis = null
    const res1 = await cacheService.increment('rate:user1', 1000)
    const res2 = await cacheService.increment('rate:user1', 1000)
    expect(res2.count).toBeGreaterThan(res1.count)
  })
})
