import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignatureError } from '@upstash/qstash'

const mocks = vi.hoisted(() => ({
  verifyQStashRequest: vi.fn(),
  redisGet: vi.fn(),
  redisSet: vi.fn(),
  redisDel: vi.fn(),
  dbExecute: vi.fn(),
  loggerInfo: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('../../qstash', () => ({
  verifyQStashRequest: mocks.verifyQStashRequest,
}))

vi.mock('@upstash/redis', () => ({
  Redis: class {
    get = mocks.redisGet
    set = mocks.redisSet
    del = mocks.redisDel
    constructor() {}
  },
}))

vi.mock('@quiz/db-tutorial', () => ({
  db: {
    execute: mocks.dbExecute,
  },
  STANDARD_QUERY_TIMEOUT: 15_000,
  withTimeout: (promise: Promise<unknown>) => promise,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfo,
    error: mocks.loggerError,
  },
}))

import { POST } from '../route'

describe('refresh-weak-areas-view worker', () => {
  const payload = {
    userId: crypto.randomUUID(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.verifyQStashRequest.mockResolvedValue(JSON.stringify(payload))
    mocks.redisGet.mockResolvedValue(null)
    mocks.redisSet.mockResolvedValue('OK')
    mocks.redisDel.mockResolvedValue(1)
    mocks.dbExecute.mockResolvedValue(undefined)

    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.example.com')
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'redis-token')
  })

  it('refreshes the materialized view and returns 200', async () => {
    const response = await POST(new Request('https://realtutorialhub.test/api/workers/refresh-weak-areas-view', {
      method: 'POST',
    }))

    expect(response.status).toBe(200)
    expect(mocks.redisSet).toHaveBeenNthCalledWith(1, `view-refresh:${payload.userId}`, 'processing', { ex: 60, nx: true })
    expect(mocks.dbExecute).toHaveBeenCalledTimes(1)
    expect(mocks.redisSet).toHaveBeenNthCalledWith(2, `view-refresh:${payload.userId}`, 'processed', { ex: 60 })
    expect(mocks.loggerInfo).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'mv.refreshed',
        userId: payload.userId,
      })
    )
  })

  it('returns 401 for invalid signature', async () => {
    mocks.verifyQStashRequest.mockRejectedValueOnce(new SignatureError('invalid signature'))

    const response = await POST(new Request('https://realtutorialhub.test/api/workers/refresh-weak-areas-view', {
      method: 'POST',
    }))

    expect(response.status).toBe(401)
    expect(mocks.dbExecute).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed payloads', async () => {
    mocks.verifyQStashRequest.mockResolvedValueOnce(JSON.stringify({}))

    const response = await POST(new Request('https://realtutorialhub.test/api/workers/refresh-weak-areas-view', {
      method: 'POST',
    }))

    expect(response.status).toBe(400)
    expect(mocks.dbExecute).not.toHaveBeenCalled()
  })
})

