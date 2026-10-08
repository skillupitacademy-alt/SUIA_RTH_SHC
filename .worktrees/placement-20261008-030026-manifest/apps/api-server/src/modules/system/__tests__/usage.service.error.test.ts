import { describe, it, expect, vi } from 'vitest'

import { UsageService } from '@/modules/system/usage.service'

describe('UsageService error branches', () => {
  it('returns _error when Neon query rejects', async () => {
    vi.spyOn(UsageService as any, 'getNeonUsage').mockRejectedValue(new Error('neon down'))
    vi.spyOn(UsageService as any, 'getRedisUsage').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getResendStatus').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getCloudflareStats').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })

    const res = await UsageService.getAllUsage()
    expect(res.neon.status).toBe('_error')
  })
})
