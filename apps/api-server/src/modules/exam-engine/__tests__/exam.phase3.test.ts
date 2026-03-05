import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '@/modules/core/cache.service'
import { ExamEngine } from '@/modules/exam-engine/exam.engine'
import { ExamRepository } from '@/modules/exam-engine/repositories/exam.repository'
import { SelectionService } from '@/modules/selection-engine/selection.service'
import { container } from '@/modules/core/container'

describe('Exam/Selection/Scoring/Report phase 3 coverage', () => {
  it('startExam recovers via race-condition handler when unique key collision occurs', async () => {
    const startedAt = new Date(Date.now() - 30_000)
    container.reset()

    vi.spyOn(ExamRepository.prototype, 'checkIdempotency')
      .mockResolvedValueOnce(undefined as any) // initial check
      .mockResolvedValueOnce({ examId: 'exam-1', userId: 'u1', key: 'dup' } as any) // in handleRaceCondition
    vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
      questions: [{ id: 'q1', questionText: 'Q?', options: [], codeSnippet: null, type: 'mcq' }],
      blueprint: { id: 'b1', timeLimit: 60 },
    } as any)
    vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockRejectedValue({
      code: '23505', message: 'unq_user_key'
    })
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
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
    } as any)

    const result = await container.get(ExamEngine).startExam('u1', 'blueprint-1', 'dup')
    expect(result.examId).toBe('exam-1')
    expect(result.firstQuestion?.id).toBe('q1')
  })

  it('submitAnswer short-circuits when idempotency key already recorded', async () => {
    container.reset()
    const getSpy = vi.spyOn(cacheService, 'get').mockResolvedValue('seen' as any)
    
    // submitAnswer with idempotency key should short-circuit when cache has value
    const engine = container.get(ExamEngine)
    await engine.submitAnswer('exam-x', 'q1', 'A', 'user-1', 'idem-1')
    expect(getSpy).toHaveBeenCalled()
  })
})
