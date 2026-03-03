import { describe, it, expect } from 'vitest'

import { cacheService } from '../cache.service'

describe('cacheService getUsage', () => {
  it('parses redis info and dbsize', async () => {
    (cacheService as any).redisDeadUntil = 0
    ;(cacheService as any).redis = {
      info: async () => 'used_memory: 2048\r\nused_memory_human: 2K\r\n',
      dbsize: async () => 5,
    }

    const usage = await cacheService.getUsage()
    expect(usage.configured).toBe(true)
    expect(usage.keys).toBe(5)
    expect(usage.memory).toBe('2K')
    expect(usage.memoryBytes).toBe(2048)
  })

  it('returns fallback on info error', async () => {
    (cacheService as any).redis = {
      info: async () => { throw new Error('boom') },
      dbsize: async () => 0,
    }
    const usage = await cacheService.getUsage()
    expect(usage.configured).toBe(true)
    expect(usage.memory).toBe('0B')
    expect(usage.memoryBytes).toBe(0)
  })
})
