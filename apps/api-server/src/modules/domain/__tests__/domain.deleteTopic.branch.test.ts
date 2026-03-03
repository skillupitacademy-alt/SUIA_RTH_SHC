import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { cacheService } from '@/modules/core/cache.service'
import { TopicService } from '../domain.service'

describe('TopicService deleteTopic branch', () => {
  it('deletes topic and leaves cache untouched (no subjectId)', async () => {
    const delSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 't1' }]),
    })
    ;(db.delete as any) = delSpy

    // ensure cache del is not accidentally called for topics without subject context
    const cacheDel = vi.spyOn(cacheService as any, 'del').mockResolvedValue(undefined)

    const res = await TopicService.deleteTopic('t1')
    expect(res).toEqual([{ id: 't1' }])
    expect(cacheDel).not.toHaveBeenCalled()
    expect(delSpy).toHaveBeenCalled()
  })

  it('deleteTopicsBatch handles multiple ids', async () => {
    const delSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 't1' }, { id: 't2' }]),
    })
    ;(db.delete as any) = delSpy

    const res = await TopicService.deleteTopicsBatch(['t1', 't2'])
    expect(res).toHaveLength(2)
    expect(delSpy).toHaveBeenCalled()
  })
})
