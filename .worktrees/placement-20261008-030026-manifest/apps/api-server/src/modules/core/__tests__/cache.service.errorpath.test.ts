import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '../cache.service'
import { logger } from '@/lib/logger'

describe('cacheService set error path', () => {
  it('logs and continues when redis set throws', async () => {
    (cacheService as any).cache = {
      set: vi.fn(),
    }
    ;(cacheService as any).redis = {
      set: vi.fn().mockRejectedValue(new Error('redis down')),
    }
    await cacheService.set('k', 'v')
    expect(logger.error).toHaveBeenCalled()
  })
})
