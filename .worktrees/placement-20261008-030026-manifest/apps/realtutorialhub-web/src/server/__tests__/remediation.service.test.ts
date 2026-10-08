import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const state = {
    selectRows: [] as Array<Array<Record<string, unknown>>>,
    insertRows: [] as Array<Array<Record<string, unknown>>>,
    updateRows: [] as Array<Array<Record<string, unknown>>>,
    insertValues: [] as Array<unknown>,
    updateValues: [] as Array<unknown>,
  }

  const createThenable = (queue: Array<Array<Record<string, unknown>>>) => {
    const query: Record<string, unknown> = {
      from: vi.fn(() => query),
      where: vi.fn(() => query),
      orderBy: vi.fn(() => query),
      limit: vi.fn(() => query),
      returning: vi.fn(() => query),
      values: vi.fn((values: unknown) => {
        state.insertValues.push(values)
        return query
      }),
      set: vi.fn((values: unknown) => {
        state.updateValues.push(values)
        return query
      }),
      onConflictDoUpdate: vi.fn(() => query),
      then: (resolve: (value: Array<Record<string, unknown>>) => void, reject: (reason: unknown) => void) =>
        Promise.resolve(queue.shift() ?? []).then(resolve, reject),
    }

    return query
  }

  const selectQuery = createThenable(state.selectRows)
  const insertQuery = createThenable(state.insertRows)
  const updateQuery = createThenable(state.updateRows)

  const dbClient = {
    select: vi.fn(() => selectQuery),
    insert: vi.fn(() => insertQuery),
    update: vi.fn(() => updateQuery),
    transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(dbClient)),
  }

  return {
    state,
    dbClient,
    redisGet: vi.fn(),
    redisSet: vi.fn(),
    redisDel: vi.fn(),
  }
})

vi.mock('@quiz/db-tutorial', () => ({
  db: mocks.dbClient,
  remediationTriggers: { name: 'remediation_triggers' },
  tutorialProgress: { name: 'tutorial_progress' },
  STANDARD_QUERY_TIMEOUT: 15_000,
  withTimeout: (promise: Promise<unknown>) => promise,
}))

import { RemediationService } from '../remediation.service'

describe('RemediationService', () => {
  const userId = crypto.randomUUID()
  const examResultId = crypto.randomUUID()
  const weakSubtopics = [
    {
      subtopicId: crypto.randomUUID(),
      subtopicName: 'Promise chains',
      score: 41,
      threshold: 60,
    },
    {
      subtopicId: crypto.randomUUID(),
      subtopicName: 'Async control flow',
      score: 55,
      threshold: 60,
    },
  ]

  const createService = () =>
    new RemediationService({
      dbClient: mocks.dbClient as never,
      getRedis: () => ({
        get: mocks.redisGet,
        set: mocks.redisSet,
        del: mocks.redisDel,
      }),
      now: () => new Date('2026-03-22T12:00:00.000Z'),
    })

  const buildTriggerRow = (overrides: Record<string, unknown> = {}) => ({
    id: crypto.randomUUID(),
    examResultId,
    userId,
    weakSubtopics,
    weakSubtopicIds: weakSubtopics.map((item) => item.subtopicId),
    recommendedContentTypes: ['notes', 'layman'],
    status: 'pending',
    createdAt: new Date('2026-03-22T12:00:00.000Z'),
    updatedAt: new Date('2026-03-22T12:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  })

  const buildProgressRow = (subtopicId: string, status: 'not_started' | 'in_progress' | 'completed') => ({
    id: crypto.randomUUID(),
    userId,
    subtopicId,
    status,
    blocksCompleted: [],
    remediationTriggered: true,
    score: null,
    timeSpentSec: 0,
    completedAt: status === 'completed' ? new Date('2026-03-22T12:00:00.000Z') : null,
    version: 1,
    createdAt: new Date('2026-03-22T12:00:00.000Z'),
    updatedAt: new Date('2026-03-22T12:00:00.000Z'),
    deletedAt: null,
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.state.selectRows.length = 0
    mocks.state.insertRows.length = 0
    mocks.state.updateRows.length = 0
    mocks.state.insertValues.length = 0
    mocks.state.updateValues.length = 0
    mocks.redisGet.mockResolvedValue(null)
    mocks.redisSet.mockResolvedValue('OK')
    mocks.redisDel.mockResolvedValue(1)
  })

  it('creates a remediation plan and persists weak subtopic progress', async () => {
    mocks.state.selectRows.push([])
    mocks.state.insertRows.push([buildTriggerRow()], [])

    const service = createService()
    const plan = await service.createPlan(userId, examResultId, weakSubtopics)

    expect(mocks.dbClient.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.redisSet).toHaveBeenNthCalledWith(1, `remediation:${examResultId}`, 'processing', { ex: 86_400, nx: true })
    expect(mocks.redisSet).toHaveBeenNthCalledWith(2, `remediation:${examResultId}`, 'processed', { ex: 86_400 })
    expect(mocks.state.insertValues[0]).toEqual(expect.objectContaining({
      examResultId,
      userId,
      weakSubtopics,
      weakSubtopicIds: weakSubtopics.map((item) => item.subtopicId),
      status: 'pending',
    }))
    expect(plan.examResultId).toBe(examResultId)
    expect(plan.weakSubtopics).toHaveLength(2)
    expect(plan.status).toBe('pending')
  })

  it('returns the existing plan when the idempotency key already exists', async () => {
    mocks.redisGet.mockResolvedValueOnce('processed')
    mocks.state.selectRows.push([buildTriggerRow()], [buildProgressRow(weakSubtopics[0].subtopicId, 'not_started')])

    const service = createService()
    const plan = await service.createPlan(userId, examResultId, weakSubtopics)

    expect(mocks.dbClient.transaction).not.toHaveBeenCalled()
    expect(plan.recommendations).toEqual(['notes', 'layman'])
  })

  it('marks a subtopic as remediated and completes the trigger when all subtopics are done', async () => {
    const triggerId = crypto.randomUUID()
    const subtopicId = weakSubtopics[0].subtopicId

    mocks.state.selectRows.push([
      buildTriggerRow({
        id: triggerId,
        status: 'pending',
      }),
    ])
    mocks.state.selectRows.push([
      buildProgressRow(weakSubtopics[0].subtopicId, 'completed'),
      buildProgressRow(weakSubtopics[1].subtopicId, 'completed'),
    ])
    mocks.state.updateRows.push([
      {
        id: crypto.randomUUID(),
        userId,
        subtopicId,
        status: 'completed',
        blocksCompleted: [],
        remediationTriggered: true,
        score: null,
        timeSpentSec: 0,
        completedAt: new Date('2026-03-22T12:00:00.000Z'),
        version: 2,
        createdAt: new Date('2026-03-22T12:00:00.000Z'),
        updatedAt: new Date('2026-03-22T12:00:00.000Z'),
        deletedAt: null,
      },
    ])
    mocks.state.updateRows.push([
      {
        id: triggerId,
        examResultId,
        userId,
        weakSubtopics,
        weakSubtopicIds: weakSubtopics.map((item) => item.subtopicId),
        recommendedContentTypes: ['notes'],
        status: 'completed',
        createdAt: new Date('2026-03-22T12:00:00.000Z'),
        updatedAt: new Date('2026-03-22T12:00:00.000Z'),
        deletedAt: null,
      },
    ])

    const service = createService()
    const plan = await service.markSubtopicRemediated(userId, subtopicId)

    expect(mocks.dbClient.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.state.updateValues[0]).toEqual(expect.objectContaining({
      status: 'completed',
    }))
    expect(plan?.status).toBe('completed')
  })
})
