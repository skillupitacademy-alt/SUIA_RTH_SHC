import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '../cache.service'

describe('cacheService fallbacks', () => {
  it('set/del catch errors without throwing', async () => {
    ;(cacheService as any).redis = { set: vi.fn().mockRejectedValue(new Error('redis down')), del: vi.fn().mockRejectedValue(new Error('redis down')) }
    await expect(cacheService.set('k', 'v')).resolves.not.toThrow()
    await expect(cacheService.del('k')).resolves.not.toThrow()
  })

  it('cooldown branch returns fallback when redis in cooldown', async () => {
    ;(cacheService as any).redis = { get: vi.fn() }
    ;(cacheService as any).redisDeadUntil = Date.now() + 60000
    const val = await (cacheService as any).withTimeout(Promise.resolve('remote'), 'fallback')
    expect(val).toBe('fallback')
  })
})
