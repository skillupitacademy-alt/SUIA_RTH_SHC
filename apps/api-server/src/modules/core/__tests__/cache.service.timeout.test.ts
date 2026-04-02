import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CacheService } from '../cache.service'

beforeEach(() => {
  ;(CacheService as unknown as { instance?: CacheService }).instance = undefined
})

describe('cacheService timeout/error branches', () => {
  it('get returns null on error', async () => {
    const cacheService = CacheService.getInstance({ redis: { get: vi.fn().mockRejectedValue(new Error('fail')) } as any })
    const result = await cacheService.get('k')
    expect(result).toBeNull()
  })

  it('withTimeout resolves to fallback when timed out', async () => {
    const cacheService = CacheService.getInstance({ redis: { get: vi.fn() } as any })
    const p = (cacheService as any).withTimeout(new Promise(() => {}), 5)
    await expect(p).resolves.toBe(5)
  })
})
