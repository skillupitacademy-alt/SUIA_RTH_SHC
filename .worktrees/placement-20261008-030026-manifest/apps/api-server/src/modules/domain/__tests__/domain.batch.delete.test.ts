import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { SubjectService, TopicService, DomainService } from '../domain.service'
import { cacheService } from '@/modules/core/cache.service'

describe('Domain/Subject/Topic batch deletes invalidate caches', () => {
  it('deleteSubjectsBatch and deleteDomainsBatch clear caches', async () => {
    vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as any)
    ;(db.delete as any) = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'x' }]),
      }),
    })

    await SubjectService.deleteSubjectsBatch(['s1', 's2'])
    expect(cacheService.del).toHaveBeenCalled()

    ;(db.delete as any).mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'd1' }]),
      }),
    })
    await DomainService.deleteDomainsBatch(['d1'])
    expect(cacheService.del).toHaveBeenCalled()
  })
})
