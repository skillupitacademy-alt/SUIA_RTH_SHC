import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@quiz/db'
import { container } from '@/modules/core/container'
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine'
import { installSelectMock } from '../../../test/select-mock'

describe('ScoringEngine branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    container.reset()
  })

  it('skips inserting results when no dimensions', async () => {
    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [{ exam: { id: 'e1', userId: 'u1', status: 'completed', startedAt: new Date(), completedAt: new Date(), blueprintId: null }, blueprint: {} }] },
      { resolveOn: 'where', result: [] }, // examQuestions join
      { resolveOn: 'where', result: [] }, // topicRaw
      { resolveOn: 'where', result: [] }, // topicSkillRows
      { resolveOn: 'where', result: [] }, // subtopicRows
    ])
    ;(db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    ;(db as any).insert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue(undefined) })
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    ;(db as any).transaction = vi.fn(async (fn) => fn(db))

    const res = await container.get(ScoringEngine).calculateExamResults('e1')
    expect(res).toBe(0)
    expect((db as any).insert).not.toHaveBeenCalled()
  })
})
