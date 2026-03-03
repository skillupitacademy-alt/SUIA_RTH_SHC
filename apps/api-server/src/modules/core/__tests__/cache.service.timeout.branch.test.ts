import { describe, it, expect, vi, afterEach } from 'vitest'

import { cacheService } from '../cache.service'

describe('cacheService withTimeout branch', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('enters cooldown when redis call times out', async () => {
    vi.useFakeTimers()
    const hangingPromise = new Promise(() => {})
    ;(cacheService as any).redis = {
      get: vi.fn().mockReturnValue(hangingPromise),
    }
    ;(cacheService as any).redisDeadUntil = 0

    const getPromise = cacheService.get('slow-key')
    // advance past REDIS_TIMEOUT_MS (1000)
    vi.advanceTimersByTime(1500)
    const value = await getPromise

    expect(value).toBeNull()
    expect((cacheService as any).redisDeadUntil).toBeGreaterThan(Date.now())
  })
})
