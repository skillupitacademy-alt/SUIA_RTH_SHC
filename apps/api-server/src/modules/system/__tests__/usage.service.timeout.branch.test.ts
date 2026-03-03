import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { UsageService } from '../usage.service'
import { cacheService } from '@/modules/core/cache.service'

describe('UsageService timeout/error branches', () => {
  it('returns error state when Neon query times out', async () => {
    ;(db.execute as any) = vi.fn().mockImplementation(() => new Promise(() => {}))
    const res = await UsageService['getNeonUsage']()
    expect(res.status).toBe('_error')
    expect(res.configured).toBe(true)
  })

  it('returns not_configured when redis not configured', async () => {
    const usageSpy = vi.spyOn(cacheService, 'getUsage').mockResolvedValue({ configured: false } as any)
    const res = await UsageService['getRedisUsage']()
    expect(res.status).toBe('not_configured')
    usageSpy.mockRestore()
  })
})
