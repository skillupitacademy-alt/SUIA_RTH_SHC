import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  requireStudent: vi.fn(),
  getPlan: vi.fn(),
}))

vi.mock('../../../../../../lib/assignment-auth', () => ({
  AssignmentAuthError: class AssignmentAuthError extends Error {
    statusCode = 401
  },
  requireStudent: mocks.requireStudent,
}))

vi.mock('../../../../../../server/remediation.service', () => ({
  RemediationService: class {
    getPlan = mocks.getPlan
  },
}))

import { GET } from '../route'

describe('remediation route', () => {
  const userId = crypto.randomUUID()
  const examResultId = crypto.randomUUID()

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireStudent.mockResolvedValue({ userId, roles: ['student'] })
    mocks.getPlan.mockResolvedValue({
      examResultId,
      weakSubtopics: [
        {
          subtopicId: crypto.randomUUID(),
          subtopicName: 'Promise chains',
          score: 41,
          threshold: 60,
          progress: 'in_progress',
        },
      ],
      recommendations: ['notes'],
      overallProgress: { completed: 0, total: 1 },
      status: 'in_progress',
    })
  })

  it('returns the remediation plan for authenticated students', async () => {
    const response = await GET(new Request(`https://realtutorialhub.test/api/tutorial/remediation/${examResultId}`), {
      params: Promise.resolve({ examResultId }),
    })

    expect(response.status).toBe(200)
    expect(mocks.getPlan).toHaveBeenCalledWith(userId, examResultId)
  })

  it('returns 401 when the student session is missing', async () => {
    mocks.requireStudent.mockRejectedValueOnce(Object.assign(new Error('Unauthorized'), { statusCode: 401 }))

    const response = await GET(new Request(`https://realtutorialhub.test/api/tutorial/remediation/${examResultId}`), {
      params: Promise.resolve({ examResultId }),
    })

    expect(response.status).toBe(401)
  })

  it('returns 404 when the remediation plan does not exist', async () => {
    mocks.getPlan.mockResolvedValueOnce(undefined)

    const response = await GET(new Request(`https://realtutorialhub.test/api/tutorial/remediation/${examResultId}`), {
      params: Promise.resolve({ examResultId }),
    })

    expect(response.status).toBe(404)
  })
})
