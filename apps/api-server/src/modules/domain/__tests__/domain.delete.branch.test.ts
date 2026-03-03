import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { DomainService, SubjectService, TopicService } from '../domain.service'
import { cacheService } from '@/modules/core/cache.service'

describe('DomainService delete invalidations', () => {
  it('deleteSubject and deleteTopic clear caches', async () => {
    vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as any)
    ;(db.delete as any) = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 's1' }]),
      }),
    })

    await SubjectService.deleteSubject('s1')
    expect(cacheService.del).toHaveBeenCalled()

    ;(db.delete as any).mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 't1' }]),
      }),
    })
    await TopicService.deleteTopic('t1')
    expect(cacheService.del).toHaveBeenCalled()
  })
})
