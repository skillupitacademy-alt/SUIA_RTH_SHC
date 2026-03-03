import { describe, it, expect, vi } from 'vitest'

import { UsageService } from '@/modules/system/usage.service'

describe('UsageService not configured branches', () => {
  it('returns not_configured when Redis and Neon env are missing', async () => {
    vi.spyOn(UsageService as any, 'getNeonUsage').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getRedisUsage').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getResendStatus').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getCloudflareStats').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })

    const res = await UsageService.getAllUsage()
    expect(res.redis.status).toBe('not_configured')
    expect(res.neon.status).toBe('not_configured')
  })
})
