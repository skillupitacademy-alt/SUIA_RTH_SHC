import { describe, it, expect, vi } from 'vitest'
import { container } from '@/modules/core/container'
import { db } from '@quiz/db'
import { ExamEngine } from '@/modules/exam-engine/exam.engine'
import { cacheService } from '@/modules/core/cache.service'
import { ExamRepository } from '../repositories/exam.repository'

describe('ExamEngine branch coverage', () => {
  it('submitAnswer throws when exam status is not started', async () => {
    vi.spyOn(ExamRepository.prototype, 'findQuestionByExamAndQuestion').mockResolvedValue({
      id: 'eq1', question: { type: 'mcq', correctAnswer: 'A' }, responseMetadata: null,
    });
    const exam = { id: 'e1', status: 'completed', userId: 'u1', durationSeconds: 100, startedAt: new Date() }
    vi.spyOn(ExamEngine.prototype as any, 'getAndCacheActiveExam').mockResolvedValue(exam)
    vi.spyOn(cacheService, 'get').mockResolvedValue(null)
    vi.spyOn(ExamEngine.prototype as any, 'checkExamTimeLimit').mockReturnValue(undefined)

    await expect(container.get(ExamEngine).submitAnswer('e1', 'q1', 'A', 'u1')).rejects.toThrow(/not active/)
  })
})
