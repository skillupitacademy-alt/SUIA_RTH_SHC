import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { cacheService } from '@/modules/core/cache.service'
import { DomainService } from '../domain.service'

describe('DomainService.getAllDomains cache error path', () => {
  it('falls back to db when cache get throws and sets cache', async () => {
    const sample = [{ id: 'd1', status: 'active' }]
    vi.spyOn(cacheService as any, 'get').mockRejectedValue(new Error('boom'))
    vi.spyOn(cacheService as any, 'set').mockResolvedValue(undefined)
    ;(db.query as any) = {
      domains: {
        findMany: vi.fn().mockResolvedValue(sample),
      },
    }

    const result = await DomainService.getAllDomains()
    expect(result).toEqual(sample)
    expect(cacheService.set).toHaveBeenCalled()
  })
})
