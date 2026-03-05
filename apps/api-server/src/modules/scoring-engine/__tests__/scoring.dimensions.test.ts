import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { container } from '@/modules/core/container'
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine'

describe('ScoringEngine dimension branches', () => {
  it('includes mapping_type and category dimensions', async () => {
    const exam = {
      id: 'e1',
      examQuestions: [{
        isCorrect: true,
        question: {
          id: 'q1',
          difficulty: 'simple',
          topicId: 't1',
          subtopicId: 'st1',
          questionSkills: [{ skill: { id: 's1', name: 'Skill', weight: 2, category: 'cat', mappingType: 'map' } }],
        }
      }],
      status: 'started',
      startedAt: new Date(),
    }
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(exam) }
    ;(db.query as any).topics = { findMany: vi.fn().mockResolvedValue([{
      id: 't1',
      name: 'Topic',
      subject: { id: 'sub1', name: 'Subject', domain: { id: 'd1', name: 'Domain' } },
      topicSkills: [{ skill: { id: 's1', name: 'Skill', weight: 2, category: 'cat', mappingType: 'map' } }],
      subtopics: [{ id: 'st1', name: 'Subtopic' }]
    }]) }
    ;(db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    ;(db as any).insert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue(undefined) })
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })

    const score = await container.get(ScoringEngine).calculateExamResults('e1')
    expect(score).toBe(100)
    expect((db as any).insert).toHaveBeenCalled()
  })
})
