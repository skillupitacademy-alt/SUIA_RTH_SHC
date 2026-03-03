import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { cacheService } from '@/modules/core/cache.service'
import { DomainService } from '@/modules/domain/domain.service'

describe('DomainService cache invalidation branches', () => {
  it('deleteDomain clears cached hierarchy', async () => {
    const delSpy = vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as never)
    const where = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'd1' }]) })
    ;(db.delete as any) = vi.fn().mockReturnValue({ where })

    await DomainService.deleteDomain('d1')

    expect(delSpy).toHaveBeenCalledWith('metadata:domains:all')
    expect(delSpy).toHaveBeenCalledWith('metadata:domain-hierarchy:d1')
  })
})
