import { describe, it, expect, vi } from 'vitest'

import { ExamEngine } from '@/modules/exam-engine/exam.engine'
import { ExamRepository } from '@/modules/exam-engine/repositories/exam.repository'
import { SelectionService } from '@/modules/selection-engine/selection.service'
import { container } from '@/modules/core/container'

describe('ExamEngine start race branch', () => {
  it('recovers via race-condition handler when unique constraint hits', async () => {
    const startedAt = new Date(Date.now() - 20_000)
    container.reset()

    vi.spyOn(ExamRepository.prototype, 'checkIdempotency')
      .mockResolvedValueOnce(undefined as any) // initial check
      .mockResolvedValueOnce({ examId: 'e1', userId: 'u1', key: 'dup' } as any) // handleRaceCondition
    vi.spyOn(SelectionService.prototype, 'composeExam').mockResolvedValue({
      questions: [{ id: 'q1', questionText: 'Q', options: [], codeSnippet: null, type: 'mcq' }],
      blueprint: { id: 'bp1', timeLimit: 60 },
    } as any)
    vi.spyOn(ExamRepository.prototype, 'createExamWithQuestions').mockRejectedValue({
      code: '23505', message: 'unq_user_key'
    })
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
      id: 'e1',
      status: 'started',
      durationSeconds: 600,
      startedAt,
      examQuestions: [{ order: 1, question: { id: 'q1', questionText: 'Q', options: [], codeSnippet: null, type: 'mcq' } }]
    } as any)

    const res = await container.get(ExamEngine).startExam('u1', 'bp1', 'dup')
    expect(res.examId).toBe('e1')
  })
})
