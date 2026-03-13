import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { container } from '@/modules/core/container'
import { ScoringEngine } from '@/modules/scoring-engine/scoring.engine'
import { installSelectMock } from '../../../test/select-mock'

describe('ScoringEngine dimension branches', () => {
  it('includes mapping_type and category dimensions', async () => {
    const exam = {
      id: 'e1',
      userId: 'u1',
      status: 'started',
      startedAt: new Date(),
      completedAt: new Date(),
      blueprintId: null,
    }
    const eqRows = [{
      examQuestion: { id: 'eq1', examId: 'e1', questionId: 'q1', isCorrect: true },
      question: {
        id: 'q1',
        difficulty: 'simple',
        topicId: 't1',
        subtopicId: 'st1',
        questionText: 'Q',
        correctAnswer: 'A',
      },
      skill: { id: 's1', name: 'Skill', weight: 2, category: 'cat', mappingType: 'map' }
    }]
    const topicRaw = [{
      topic: { id: 't1', name: 'Topic', subjectId: 'sub1' },
      subject: { id: 'sub1', name: 'Subject', domainId: 'd1' },
      domain: { id: 'd1', name: 'Domain' },
    }]
    const topicSkillRows = [{
      topicSkill: { topicId: 't1', skillId: 's1' },
      skill: { id: 's1', name: 'Skill', weight: 2, category: 'cat', mappingType: 'map' },
    }]
    const subtopicRows = [{ id: 'st1', topicId: 't1', name: 'Subtopic' }]

    installSelectMock(db as any, [
      { resolveOn: 'limit', result: [{ exam, blueprint: {} }] },
      { resolveOn: 'where', result: eqRows },
      { resolveOn: 'where', result: topicRaw },
      { resolveOn: 'where', result: topicSkillRows },
      { resolveOn: 'where', result: subtopicRows },
    ])
    ;(db as any).delete = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) })
    ;(db as any).insert = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue(undefined) })
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    ;(db as any).transaction = vi.fn(async (fn) => fn(db))

    const score = await container.get(ScoringEngine).calculateExamResults('e1')
    expect(score).toBe(100)
    expect((db as any).insert).toHaveBeenCalled()
  })
})
