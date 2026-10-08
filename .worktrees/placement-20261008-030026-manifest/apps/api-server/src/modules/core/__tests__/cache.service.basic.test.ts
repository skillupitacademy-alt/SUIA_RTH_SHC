import { describe, it, expect, vi } from 'vitest'
import { CacheService } from '../cache.service'
import { logger } from '@/lib/logger'

describe('CacheService (core)', () => {
  it('returns local hit without touching Redis', async () => {
    const cache = CacheService.getInstance()
    // @ts-expect-error private access for test
    cache.cache.set('k1', 'v1')
    const redisGet = vi.spyOn(cache as any, 'redis', 'get').mockReturnValue(null)

    const val = await cache.get<string>('k1')

    expect(val).toBe('v1')
    expect(redisGet).not.toHaveBeenCalled()
  })

  it('falls back to Redis get and backfills local cache', async () => {
    (CacheService as any).instance = undefined
    const cache = CacheService.getInstance()
    const redis = { get: vi.fn().mockResolvedValue('r2') }
    Reflect.set(cache as any, 'redis', redis)
    vi.spyOn(cache as any, 'withTimeout').mockResolvedValue('r2')

    const val = await cache.get<string>('k2')

    expect(val).toBe('r2')
    expect(redis.get).toHaveBeenCalledWith('k2')
    // @ts-expect-error private access
    expect(cache.cache.get('k2')).toBe('r2')
  })

  it('enters cooldown on Redis timeout and returns fallback null', async () => {
    const cache = CacheService.getInstance()
    const redis = { get: vi.fn().mockRejectedValue(new Error('Redis Timeout')) }
    Reflect.set(cache as any, 'redis', redis)
    Reflect.set(cache as any, 'withTimeout', vi.fn().mockRejectedValue(new Error('Redis Timeout')))

    const val = await cache.get<string>('k-timeout')

    expect(val).toBeNull()
  })

  it('delByPrefix tolerates LRU errors and logs', async () => {
    const cache = CacheService.getInstance()
    const spyWarn = vi.spyOn(logger, 'error')
    // @ts-expect-error private access
    vi.spyOn(cache.cache, 'keys').mockImplementation(() => { throw new Error('boom') })
    await cache.delByPrefix('pfx')
    expect(spyWarn).toHaveBeenCalled()
  })
})
