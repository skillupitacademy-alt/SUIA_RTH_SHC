import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '../cache.service'

describe('CacheService cooldown branch', () => {
  it('skips redis when in cooldown and returns fallback on get', async () => {
    const getSpy = vi.fn().mockResolvedValue('should-not-run')
    ;(cacheService as any).redis = { get: getSpy }
    ;(cacheService as any).redisDeadUntil = Date.now() + 60_000

    const value = await cacheService.get('missing-key')
    expect(value).toBeNull()
    expect(getSpy).toHaveBeenCalled()
  })

  it('uses local fallback when increment runs during cooldown', async () => {
    const incrSpy = vi.fn().mockResolvedValue(1)
    ;(cacheService as any).redis = { incr: incrSpy, pexpire: vi.fn(), pttl: vi.fn().mockResolvedValue(1000) }
    ;(cacheService as any).redisDeadUntil = Date.now() + 60_000

    const result = await cacheService.increment('ip:1', 5000)
    expect(result.count).toBe(1)
    expect(incrSpy).toHaveBeenCalled()
  })
})
