import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlatformEventTypes } from '@quiz/events'
import { SignatureError } from '@upstash/qstash'

const mocks = vi.hoisted(() => ({
  receiverVerify: vi.fn(),
  sagaExecute: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('@upstash/qstash', () => {
  class MockSignatureError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'SignatureError'
    }
  }

  return {
    SignatureError: MockSignatureError,
    Receiver: class {
      verify = mocks.receiverVerify
      constructor() {}
    },
  }
})

vi.mock('../../../../../server/sagas/exam-completed.saga', () => ({
  ExamCompletedSaga: class {
    execute = mocks.sagaExecute
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

import { POST } from '../route'

const createEnvelope = (data: Record<string, unknown>) => ({
  id: crypto.randomUUID(),
  type: PlatformEventTypes.EXAM_COMPLETED,
  correlationId: crypto.randomUUID(),
  source: 'exam-engine',
  occurredAt: new Date('2026-03-22T12:00:00.000Z').toISOString(),
  version: 1,
  data,
})

const createRequest = (data: Record<string, unknown>, signature = 'valid-signature') =>
  new Request('https://realtutorialhub.test/api/workers/handle-exam-completed', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'upstash-signature': signature,
    },
    body: JSON.stringify(createEnvelope(data)),
  })

describe('handle-exam-completed worker', () => {
  const userId = crypto.randomUUID()
  const examResultId = crypto.randomUUID()
  const weakSubtopics = [
    {
      subtopicId: crypto.randomUUID(),
      subtopicName: 'Promise chains',
      score: 41,
      threshold: 60,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.receiverVerify.mockResolvedValue(undefined)
    mocks.sagaExecute.mockResolvedValue({
      examResultId,
      weakSubtopics: [],
      recommendations: [],
      overallProgress: { completed: 0, total: 0 },
      status: 'pending',
    })

    vi.stubEnv('QSTASH_CURRENT_SIGNING_KEY', 'current-signing-key')
    vi.stubEnv('QSTASH_NEXT_SIGNING_KEY', 'next-signing-key')
  })

  it('creates the remediation plan through the saga and returns 200', async () => {
    const response = await POST(createRequest({ userId, examResultId, weakSubtopics }))

    expect(response.status).toBe(200)
    expect(mocks.sagaExecute).toHaveBeenCalledWith({ userId, examResultId, weakSubtopics })
  })

  it('returns 401 for an invalid QStash signature', async () => {
    mocks.receiverVerify.mockRejectedValue(new SignatureError('invalid signature'))

    const response = await POST(createRequest({ userId, examResultId, weakSubtopics }))

    expect(response.status).toBe(401)
    expect(mocks.sagaExecute).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed payloads', async () => {
    const malformed = createEnvelope({
      examResultId,
      weakSubtopics,
    })

    const response = await POST(new Request('https://realtutorialhub.test/api/workers/handle-exam-completed', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'upstash-signature': 'valid-signature',
      },
      body: JSON.stringify(malformed),
    }))

    expect(response.status).toBe(400)
    expect(mocks.sagaExecute).not.toHaveBeenCalled()
  })
})
