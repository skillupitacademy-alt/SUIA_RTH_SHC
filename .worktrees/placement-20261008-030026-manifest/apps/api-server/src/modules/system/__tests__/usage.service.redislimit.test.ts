import { describe, it, expect, vi } from 'vitest'

import { UsageService } from '@/modules/system/usage.service'

describe('UsageService redis usage percent branch', () => {
  it('flags warning when usage over 80%', async () => {
    vi.spyOn(UsageService as any, 'getNeonUsage').mockResolvedValue({ status: 'ok', configured: true, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getRedisUsage').mockResolvedValue({
      status: 'warning',
      configured: true,
      checkedAt: new Date().toISOString(),
      metrics: { usagePercent: 85 }
    })
    vi.spyOn(UsageService as any, 'getResendStatus').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getCloudflareStats').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })

    const res = await UsageService.getAllUsage()
    expect(res.redis.status).toBe('warning')
  })
})
