import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { container } from '@/modules/core/container'
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine'

describe('ScoringEngine branch coverage', () => {
  it('skips inserting results when no dimensions', async () => {
    const exam = {
      id: 'e1',
      examQuestions: [],
      status: 'started',
      startedAt: new Date(),
    }
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(exam) }
    ;(db.query as any).topics = { findMany: vi.fn().mockResolvedValue([]) }
    ;(db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    ;(db as any).insert = vi.fn()
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })

    const res = await container.get(ScoringEngine).calculateExamResults('e1')
    expect(res).toBe(0)
    expect((db as any).insert).not.toHaveBeenCalled()
  })
})
