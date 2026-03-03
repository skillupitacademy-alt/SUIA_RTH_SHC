import { describe, it, expect, vi, beforeEach } from 'vitest'

import { db } from '@quiz/db'
import { JobOrchestrator } from '@/modules/system/job-orchestrator'
import { JobsService, JobType } from '@/modules/system/jobs.service'
import { ExamEngine } from '../exam.engine'

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
    process.env.QSTASH_TOKEN = 'token'

    ;(db.query as any) = {
      exams: {
        findFirst: vi.fn().mockResolvedValueOnce(baseExam).mockResolvedValue({
          ...baseExam,
          examQuestions: [
            { id: 'eq1', questionId: 'q1', responseMetadata: null, question: { type: 'mcq', correctAnswer: 'A' } },
          ],
        }),
      },
    }

    ;(db.update as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'exam1' }]),
        }),
      }),
    })

    ;(db.insert as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
      onConflictDoNothing: vi.fn().mockResolvedValue(undefined),
    })

    ;(JobsService.createJob as any) = vi.fn().mockResolvedValue({ id: 'job-1' })

    ;(JobOrchestrator.runJob as any) = vi.fn()
  })

  it('falls back to local runner when queue enqueue fails', async () => {
    const { queueService } = await import('../../core/queue.service')
    ;(queueService.enqueue as any) = vi.fn().mockResolvedValue({ success: false })

    const result = await ExamEngine.completeExam('exam1', 'u1')
    expect(result.status).toBe('processing')
    expect(queueService.enqueue).toHaveBeenCalledWith(JobType.EXAM_SCORING, expect.anything())
    expect(JobOrchestrator.runJob).toHaveBeenCalledWith('job-1', 'u1')
  })

  it('does not trigger local runner when enqueue succeeds', async () => {
    const { queueService } = await import('../../core/queue.service')
    ;(queueService.enqueue as any) = vi.fn().mockResolvedValue({ success: true })

    await ExamEngine.completeExam('exam1', 'u1')
    expect(queueService.enqueue).toHaveBeenCalled()
    expect(JobOrchestrator.runJob).not.toHaveBeenCalled()
  })
})
