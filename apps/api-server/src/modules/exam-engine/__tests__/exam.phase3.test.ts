import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { cacheService } from '@/modules/core/cache.service'
import { ExamEngine } from '@/modules/exam-engine/exam.engine'

describe('Exam/Selection/Scoring/Report phase 3 coverage', () => {
  it('startExam recovers via race-condition handler when unique key collision occurs', async () => {
    const startedAt = new Date(Date.now() - 30_000)
    ;(db.query as any).idempotencyKeys = { findFirst: vi.fn().mockResolvedValue({ examId: 'exam-1', userId: 'u1', key: 'dup' }) }
    ;(db.query as any).exams = {
      findFirst: vi.fn().mockResolvedValue({
        id: 'exam-1',
        status: 'started',
        durationSeconds: 600,
        startedAt,
        examQuestions: [
          {
            order: 1,
            question: { id: 'q1', questionText: 'Q?', options: [], codeSnippet: null, type: 'mcq' }
          }
        ]
      })
    }
    ;(db as any).transaction = vi.fn().mockImplementation(async () => {
      const err: any = { code: '23505', message: 'unq_user_key' }
      throw err
    })

    const result = await ExamEngine.startExam('u1', 'blueprint-1', 'dup')
    expect(result.examId).toBe('exam-1')
    expect(result.firstQuestion?.id).toBe('q1')
  })

  it('executeSubmitAnswer short-circuits when idempotency key already recorded', async () => {
    const getSpy = vi.spyOn(cacheService, 'get').mockResolvedValue('seen' as any)
    // Access the private helper through indexer for targeted branch coverage
    const res = await (ExamEngine as any).executeSubmitAnswer({}, 'exam-x', 'q1', 'A', 'user-1', 'idem-1')
    expect(res).toBeUndefined()
    expect(getSpy).toHaveBeenCalled()
  })
})
