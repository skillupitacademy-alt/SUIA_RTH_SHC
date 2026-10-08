import { describe, it, expect, vi } from 'vitest'

import { Redis } from '@upstash/redis'

import { cacheService } from '@/modules/core/cache.service'

describe('CacheService cooldown + timeout branches', () => {
  it('enters cooldown and returns fallback on timeout', async () => {
    const redis = {
      get: vi.fn().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5))
      )
    } as unknown as Redis
    ;(cacheService as any).redis = redis
    ;(cacheService as any).redisDeadUntil = 0
    const res = await cacheService.get('key')
    expect(res).toBeNull()
    expect((cacheService as any).redisDeadUntil).toBeGreaterThan(Date.now())
  })
})
