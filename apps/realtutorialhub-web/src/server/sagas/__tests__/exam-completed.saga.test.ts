import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  publishJSON: vi.fn(),
  loggerInfo: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    warn: mocks.loggerWarn,
    error: mocks.loggerError,
  },
}))

import { ExamCompletedSaga } from '../exam-completed.saga'

describe('ExamCompletedSaga', () => {
  const payload = {
    userId: crypto.randomUUID(),
    examResultId: crypto.randomUUID(),
    weakSubtopics: [
      {
        subtopicId: crypto.randomUUID(),
        subtopicName: 'Promise chains',
        score: 41,
        threshold: 60,
      },
    ],
  }

  const remediationService = {
    createPlan: vi.fn(),
    markFailed: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    remediationService.createPlan.mockResolvedValue({
      examResultId: payload.examResultId,
      weakSubtopics: [],
      recommendations: [],
      overallProgress: { completed: 0, total: 0 },
      status: 'pending',
    })
    remediationService.markFailed.mockResolvedValue(undefined)
    mocks.publishJSON.mockResolvedValue({ messageId: 'msg-1' })
  })

  const createSaga = () =>
    new ExamCompletedSaga({
      remediationService: remediationService as never,
      getQStash: () => ({
        publishJSON: mocks.publishJSON,
      }),
      appUrl: 'https://realtutorialhub.test',
    })

  it('creates a remediation plan and enqueues refresh and notification workers', async () => {
    const saga = createSaga()

    await expect(saga.execute(payload)).resolves.toMatchObject({
      examResultId: payload.examResultId,
    })

    expect(remediationService.createPlan).toHaveBeenCalledWith(
      payload.userId,
      payload.examResultId,
      payload.weakSubtopics
    )
    expect(mocks.publishJSON).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        url: 'https://realtutorialhub.test/api/workers/refresh-weak-areas-view',
        body: { userId: payload.userId },
        retries: 1,
      })
    )
    expect(mocks.publishJSON).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        url: 'https://realtutorialhub.test/api/workers/send-remediation-notification',
        body: payload,
        retries: 3,
      })
    )
  })

  it('continues when the refresh worker enqueue fails', async () => {
    mocks.publishJSON
      .mockRejectedValueOnce(new Error('refresh failed'))
      .mockResolvedValueOnce({ messageId: 'msg-2' })

    const saga = createSaga()
    await expect(saga.execute(payload)).resolves.toMatchObject({
      examResultId: payload.examResultId,
    })

    expect(mocks.loggerWarn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'remediation.view_refresh_best_effort_failed',
        examResultId: payload.examResultId,
      })
    )
    expect(mocks.publishJSON).toHaveBeenCalledTimes(2)
  })

  it('marks the plan as failed when plan creation throws', async () => {
    remediationService.createPlan.mockRejectedValueOnce(new Error('plan failed'))

    const saga = createSaga()
    await expect(saga.execute(payload)).rejects.toThrow('plan failed')

    expect(remediationService.markFailed).toHaveBeenCalledWith(
      payload.userId,
      payload.examResultId,
      payload.weakSubtopics
    )
    expect(mocks.loggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'remediation.plan_failed',
        examResultId: payload.examResultId,
      })
    )
  })
})

