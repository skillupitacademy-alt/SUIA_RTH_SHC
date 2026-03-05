import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ExamEngine } from '../exam.engine'
import { ExamRepository } from '../repositories/exam.repository'
import { PerformanceService } from '@/modules/report-engine/performance.service'
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine'
import { JobOrchestrator } from '@/modules/system/job-orchestrator'
import { JobsService, JobType } from '@/modules/system/jobs.service'
import { cacheService } from '@/modules/core/cache.service'
import { container } from '@/modules/core/container'

vi.mock('../../core/queue.service', () => ({
  queueService: {
    enqueue: vi.fn(),
  },
}))

vi.mock('@/modules/system/job-orchestrator', () => ({
  JobOrchestrator: {
    runJob: vi.fn(),
  },
}))

vi.mock('@/modules/system/jobs.service', () => ({
  JobsService: {
    createJob: vi.fn(),
  },
  JobType: {
    EXAM_SCORING: 'EXAM_SCORING',
  },
}))

describe('ExamEngine completeExam queue branch', () => {
  const baseExam = {
    id: 'exam1',
    userId: 'u1',
    status: 'started',
    durationSeconds: 600,
    lastAnsweredAt: null,
    startedAt: new Date().toISOString(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    container.reset()
    process.env.QSTASH_TOKEN = 'token'

    vi.spyOn(PerformanceService.prototype, 'invalidateCache').mockResolvedValue(undefined as any)
    vi.spyOn(ExamRepository.prototype, 'checkIdempotency').mockResolvedValue(null as any)
    vi.spyOn(ExamRepository.prototype, 'findById').mockResolvedValue(baseExam as any)
    vi.spyOn(ExamRepository.prototype, 'updateStatus').mockResolvedValue([{ id: 'exam1' }] as any)
    vi.spyOn(ExamRepository.prototype, 'findByIdWithQuestions').mockResolvedValue({
      ...baseExam,
      examQuestions: [
        { id: 'eq1', questionId: 'q1', responseMetadata: null, question: { type: 'mcq', correctAnswer: 'A' } },
      ],
    } as any)
    vi.spyOn(ExamRepository.prototype, 'recordIdempotency').mockResolvedValue(undefined as any)
    vi.spyOn(ExamRepository.prototype, 'updateExamQuestionResponse').mockResolvedValue(undefined as any)
    vi.spyOn(ExamRepository.prototype, 'updateLastAnswered').mockResolvedValue(undefined as any)
    vi.spyOn(AnswerEvaluationEngine.prototype, 'evaluate').mockReturnValue(true)
    vi.spyOn(cacheService, 'get').mockResolvedValue({ answer: 'A' } as any)

    ;(JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-1' })
    ;(JobOrchestrator.runJob as any) = vi.fn()
  })

  it('falls back to local runner when queue enqueue fails', async () => {
    const { queueService } = await import('../../core/queue.service')
    ;(queueService.enqueue as any) = vi.fn().mockResolvedValue({ success: false })

    const result = await container.get(ExamEngine).completeExam('exam1', 'u1')
    expect(result.status).toBe('processing')
    expect(queueService.enqueue).toHaveBeenCalledWith(JobType.EXAM_SCORING, expect.anything())
    expect(JobOrchestrator.runJob).toHaveBeenCalledWith('job-1', 'u1')
  })

  it('does not trigger local runner when enqueue succeeds', async () => {
    const { queueService } = await import('../../core/queue.service')
    ;(queueService.enqueue as any) = vi.fn().mockResolvedValue({ success: true })

    await container.get(ExamEngine).completeExam('exam1', 'u1')
    expect(queueService.enqueue).toHaveBeenCalled()
    expect(JobOrchestrator.runJob).not.toHaveBeenCalled()
  })
})
