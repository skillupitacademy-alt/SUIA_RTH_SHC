import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { cacheService } from '@/modules/core/cache.service'
import { SelectionService } from '@/modules/selection-engine/selection.service'

describe('SelectionService resolveBlueprint and criteria branches', () => {
  it('falls back to domain-based blueprint lookup when id miss', async () => {
    vi.spyOn(cacheService, 'get').mockResolvedValue(null)
    ;(db.query as any).examBlueprints = {
      findFirst: vi.fn()
        .mockResolvedValueOnce(null) // id lookup miss
        .mockResolvedValueOnce({ id: 'bp2', domains: ['d1'], status: 'active', totalQuestions: 5, timeLimit: 5, createdAt: new Date(), updatedAt: new Date(), createdById: 'u1' })
    }

    const res = await (SelectionService as any).resolveBlueprint('u1', 'd1', {})
    expect(res.id).toBe('bp2')
  })
})
