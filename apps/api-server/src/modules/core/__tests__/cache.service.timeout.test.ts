import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '../cache.service'

describe('cacheService timeout/error branches', () => {
  it('get returns null on error', async () => {
    ;(cacheService as any).client = { get: vi.fn().mockRejectedValue(new Error('fail')) }
    const result = await cacheService.get('k')
    expect(result).toBeNull()
  })

  it('withTimeout resolves to fallback when timed out', async () => {
    const p = (cacheService as any).withTimeout(new Promise(() => {}), 5)
    await expect(p).resolves.toBe(5)
  })
})
