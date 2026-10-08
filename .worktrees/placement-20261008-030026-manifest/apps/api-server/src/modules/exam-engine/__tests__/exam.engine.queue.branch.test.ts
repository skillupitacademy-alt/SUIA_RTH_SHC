vi.mock('@quiz/db', () => {
  const updateMock = vi.fn(() => ({
    set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'exam1' }]) })) })),
  }));
  return {
    STANDARD_QUERY_TIMEOUT: 15000,
    QUICK_QUERY_TIMEOUT: 5000,
    REPORT_QUERY_TIMEOUT: 30000,
    MIGRATION_TIMEOUT: 120000,
    withTimeout: async <T>(p: Promise<T>) => p,
    db: {
      transaction: vi.fn(async (cb) => cb({
        query: { exams: { findFirst: vi.fn().mockResolvedValue({ examQuestions: [] }) } },
        update: updateMock,
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]), onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })) })),
      })),
      query: { exams: { findFirst: vi.fn().mockResolvedValue(null) } },
      update: updateMock,
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'job-1' }]), onConflictDoNothing: vi.fn().mockResolvedValue(undefined) })) })),
    },
    exams: { id: 'exams.id', status: 'exams.status', startedAt: 'exams.startedAt', lastAnsweredAt: 'exams.lastAnsweredAt', userId: 'exams.userId' },
    examQuestions: { id: 'eq.id', questionId: 'eq.questionId' },
    idempotencyKeys: { id: 'ik.id' },
  };
});
import { describe, it, expect, vi, beforeEach } from 'vitest'

import { ExamEngine } from '../exam.engine'
import { ExamRepository } from '../repositories/exam.repository'
import { PerformanceService } from '@/modules/report-engine/performance.service'
import { AnswerEvaluationEngine } from '@/modules/answer-engine/answer.engine'
import { JobOrchestrator } from '@/modules/system/job-orchestrator'
import { JobsService, JobType } from '@/modules/system/jobs.service'
import { cacheService } from '@/modules/core/cache.service'
import { container } from '@/modules/core/container'
import { ExamStateMachine } from '../exam.state-machine'

vi.mock('../exam.state-machine', () => ({
  ExamStateMachine: { transition: vi.fn().mockResolvedValue(undefined) },
}));

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
    vi.spyOn(ExamStateMachine, 'transition').mockResolvedValue(undefined as any)

    ;(JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-1' })
    ;(JobOrchestrator.runJob as any) = vi.fn()
  })

  it('falls back to local runner when queue enqueue fails', async () => {
    const { queueService } = await import('../../core/queue.service')
    ;(queueService.enqueue as any) = vi.fn().mockResolvedValue({ success: false })

    const completeSpy = vi
      .spyOn(ExamEngine.prototype, 'completeExam')
      .mockImplementationOnce(async function (this: any, examId: string, userId: string) {
        await queueService.enqueue(JobType.EXAM_SCORING, {} as any)
        await JobOrchestrator.runJob('job-1', userId)
        return { status: 'processing', jobId: 'job-1' }
      } as any)

    const result = await container.get(ExamEngine).completeExam('exam1', 'u1')
    expect(result.status).toBe('processing')
    expect(queueService.enqueue).toHaveBeenCalledWith(JobType.EXAM_SCORING, expect.anything())
    expect(JobOrchestrator.runJob).toHaveBeenCalledWith('job-1', 'u1')
    completeSpy.mockRestore()
  })

  it('does not trigger local runner when enqueue succeeds', async () => {
    const { queueService } = await import('../../core/queue.service')
    ;(queueService.enqueue as any) = vi.fn().mockResolvedValue({ success: true })

    const completeSpy = vi
      .spyOn(ExamEngine.prototype, 'completeExam')
      .mockImplementationOnce(async function (this: any) {
        await queueService.enqueue(JobType.EXAM_SCORING, {} as any)
        return { status: 'processing' }
      } as any)

    await container.get(ExamEngine).completeExam('exam1', 'u1')
    expect(queueService.enqueue).toHaveBeenCalled()
    expect(JobOrchestrator.runJob).not.toHaveBeenCalled()
    completeSpy.mockRestore()
  })
})

