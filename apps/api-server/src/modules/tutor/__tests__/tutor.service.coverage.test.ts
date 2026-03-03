import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { TutorService } from '../tutor.service'
import { cacheService } from '@/modules/core/cache.service'
import { ResilienceService } from '@/modules/core/resilience.service'

describe('TutorService.processExamResults', () => {
  it('skips when feature disabled', async () => {
    vi.spyOn(ResilienceService, 'isFeatureEnabled').mockResolvedValue(false)
    await TutorService.processExamResults('e1')
    expect(ResilienceService.isFeatureEnabled).toHaveBeenCalledWith('ai_tutor')
  })

  it('creates recommendations and notifications for weak topics', async () => {
    vi.spyOn(ResilienceService, 'isFeatureEnabled').mockResolvedValue(true)
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue({ userId: 'u1' }) }
    ;(db.select as any) = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([
        { topicId: 't1', topicName: 'Loops', accuracy: 40 },
      ]),
    })

    const txInsert = vi.fn().mockResolvedValue(undefined)
    const txQuery = {
      userRecommendations: { findFirst: vi.fn().mockResolvedValue(null) },
      topics: { findFirst: vi.fn().mockResolvedValue({ learningUrl: 'https://loops', detailedNotesPath: '/notes/loops.pdf' }) },
      notesDeliveryLocks: { findFirst: vi.fn().mockResolvedValue(null) },
    }

    ;(db.transaction as any) = vi.fn(async (cb: any) => cb({
      query: txQuery,
      insert: vi.fn().mockReturnValue({ values: txInsert }),
    }))

    vi.spyOn(cacheService, 'get').mockResolvedValue(null)
    vi.spyOn(cacheService, 'set').mockResolvedValue(undefined as any)

    await TutorService.processExamResults('e1')
    expect(txInsert).toHaveBeenCalled()
  })
})
