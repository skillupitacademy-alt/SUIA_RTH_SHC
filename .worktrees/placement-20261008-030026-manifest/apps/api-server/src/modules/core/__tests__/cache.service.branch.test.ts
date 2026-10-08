import { describe, it, expect, vi } from 'vitest'

import { Redis } from '@upstash/redis'

import { cacheService } from '@/modules/core/cache.service'

// Focused branch coverage for timeout/cooldown paths.
describe('CacheService branch coverage', () => {
  it('returns fallback when Redis get rejects (catch path)', async () => {
    // force a redis instance
    const redisGet = vi.fn().mockRejectedValue(new Error('boom'))
    ;(cacheService as any).redis = { get: redisGet } as unknown as Redis
    const { LoggerService } = await import('@/modules/core/logger.service')
    const spy = vi.spyOn(LoggerService.prototype, 'error').mockImplementation(() => {}) // silence possible logs

    const res = await cacheService.get('missing-key')
    expect(res).toBeNull()
    expect(redisGet).toHaveBeenCalled()

    spy.mockRestore()
  })
})
