import { describe, it, expect, vi, beforeEach } from 'vitest'
import { db } from '@quiz/db'
import { container } from '@/modules/core/container'
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine'

describe('ScoringEngine branch coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    container.reset()
  })

  it('skips inserting results when no dimensions', async () => {
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue({ id: 'e1', examQuestions: [], blueprint: {} }) }
    ;(db.query as any).topics = { findMany: vi.fn().mockResolvedValue([]) }
    ;(db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    ;(db as any).insert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue(undefined) })
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    ;(db as any).transaction = vi.fn(async (fn) => fn(db))

    const res = await container.get(ScoringEngine).calculateExamResults('e1')
    expect(res).toBe(0)
    expect((db as any).insert).not.toHaveBeenCalled()
  })
})
