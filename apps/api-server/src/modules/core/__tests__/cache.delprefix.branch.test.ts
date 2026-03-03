import { describe, it, expect } from 'vitest'

import { cacheService } from '../cache.service'

describe('cacheService delByPrefix', () => {
  it('removes keys matching prefix', async () => {
    ;(cacheService as any).cache = {
      keys: () => ['a:1', 'b:2', 'a:3'],
      delete: vi.fn(),
    }
    await cacheService.delByPrefix('a:')
    expect((cacheService as any).cache.delete).toHaveBeenCalledTimes(2)
  })
})
