import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '@/modules/core/cache.service'
import { DomainService } from '../domain.service'

describe('DomainService.getDomainHierarchy cache hit', () => {
  it('returns cached hierarchy without querying db', async () => {
    const cached = { id: 'd1', subjects: [] }
    const getSpy = vi.spyOn(cacheService as any, 'get').mockResolvedValue(cached)
    const setSpy = vi.spyOn(cacheService as any, 'set')

    const result = await DomainService.getDomainHierarchy('d1')
    expect(result).toEqual(cached)
    expect(setSpy).not.toHaveBeenCalled()
    getSpy.mockRestore()
    setSpy.mockRestore()
  })
})
