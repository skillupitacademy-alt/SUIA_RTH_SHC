import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { DomainService } from '../domain.service'
import { cacheService } from '@/modules/core/cache.service'

describe('DomainService coverage', () => {
  it('getAllDomains returns cache hit and sets cache on miss', async () => {
    const domains = [{ id: 'd1', status: 'active' }]
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(domains as any)
    const cached = await DomainService.getAllDomains()
    expect(cached).toEqual(domains)

    // miss path
    ;(cacheService.get as any).mockRejectedValueOnce(new Error('cache down'))
    ;(db.query as any).domains = { findMany: vi.fn().mockResolvedValue(domains) }
    vi.spyOn(cacheService, 'set').mockResolvedValue(undefined as any)
    const fresh = await DomainService.getAllDomains()
    expect(fresh).toEqual(domains)
    expect(cacheService.set).toHaveBeenCalled()
  })

  it('getDomainHierarchy caches null and result; deleteDomain invalidates caches', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null)
    ;(db.query as any).domains = { findFirst: vi.fn().mockResolvedValue(null) }
    vi.spyOn(cacheService, 'set').mockResolvedValue(undefined as any)
    const miss = await DomainService.getDomainHierarchy('d-x')
    if (miss !== null) {
      throw new Error('expected null hierarchy')
    }

    // when domain exists
    (cacheService.get as any).mockResolvedValueOnce(null)
    ;(db.query as any).domains.findFirst = vi.fn().mockResolvedValue({ id: 'd1', subjects: [] })
    const found = await DomainService.getDomainHierarchy('d1')
    expect(found?.id).toBe('d1')
    expect(cacheService.set).toHaveBeenCalled()

    vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as any)
    ;(db.delete as any) = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'd1' }]),
      }),
    })
    await DomainService.deleteDomain('d1')
    expect(cacheService.del).toHaveBeenCalled()
  })
})
