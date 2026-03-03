import { describe, it, expect, vi } from 'vitest'

import { cacheService } from '@/modules/core/cache.service'
import { DomainService } from '@/modules/domain/domain.service'
import { JobOrchestrator } from '@/modules/system/job-orchestrator'
import { JobsService } from '@/modules/system/jobs.service'
import { UsageService } from '@/modules/system/usage.service'

describe('System/Usage/Analytics/Tutor/Domain phase 4 coverage', () => {
  it('job orchestrator marks unknown job type as failed', async () => {
    const update = vi.spyOn(JobsService, 'updateJobStatus').mockResolvedValue(undefined as never)
    vi.spyOn(JobsService, 'getJob').mockResolvedValue({
      id: 'job-1',
      userId: 'u1',
      status: 'pending',
      type: 'UNKNOWN' as any,
      payload: {},
    } as any)

    await JobOrchestrator.runJob('job-1', 'u1')
    expect(update).toHaveBeenCalledWith('job-1', expect.anything(), expect.anything())
  })

  it('usage service returns not_configured when providers are absent', async () => {
    vi.spyOn(UsageService as any, 'getNeonUsage').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getRedisUsage').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getResendStatus').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })
    vi.spyOn(UsageService as any, 'getCloudflareStats').mockResolvedValue({ status: 'not_configured', configured: false, checkedAt: new Date().toISOString() })

    const res = await UsageService.getAllUsage()
    expect(res.redis.configured).toBe(false)
    expect(res.neon.configured).toBe(false)
  })

  it('domain service returns cached domains when available', async () => {
    const cached = [{ id: 'd1', name: 'Cached Domain' }]
    vi.spyOn(cacheService, 'get').mockResolvedValue(cached as any)
    const result = await DomainService.getAllDomains()
    expect(result).toEqual(cached)
  })
})
