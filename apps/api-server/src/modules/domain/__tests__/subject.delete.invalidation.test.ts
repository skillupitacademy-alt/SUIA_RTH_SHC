import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { cacheService } from '@/modules/core/cache.service'
import { SubjectService } from '../domain.service'

describe('SubjectService deleteSubject cache invalidation', () => {
  it('deletes subject and invalidates domains cache', async () => {
    const delSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 's1' }]),
      }),
    })
    ;(db.delete as any) = delSpy
    const cacheDel = vi.spyOn(cacheService as any, 'del').mockResolvedValue(undefined)

    const res = await SubjectService.deleteSubject('s1')
    expect(res).toEqual([{ id: 's1' }])
    expect(cacheDel).toHaveBeenCalledWith('metadata:domains:all')
    cacheDel.mockRestore()
  })
})
