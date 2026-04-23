import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { DomainService } from '../domain.service'
import { cacheService } from '@/modules/core/cache.service'

describe('DomainService error branches', () => {
  it('swallows cache set error on getAllDomains', async () => {
    (cacheService.get as any) = vi.fn().mockResolvedValue(null)
    ;(db.query as any).domains = { findMany: vi.fn().mockResolvedValue([{ id: 'd1' }]) }
    vi.spyOn(cacheService, 'set').mockRejectedValue(new Error('cache fail'))

    const res = await DomainService.getAllDomains()
    expect(res[0].id).toBe('d1')
  })

  it('returns null when hierarchy cache get throws', async () => {
    vi.spyOn(cacheService, 'get').mockRejectedValueOnce(new Error('boom'))
    ;(db.query as any).domains = { findFirst: vi.fn().mockResolvedValue(null) }
    const res = await DomainService.getDomainHierarchy('missing')
    expect(res).toBeNull()
  })
})
