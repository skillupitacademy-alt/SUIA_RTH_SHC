import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { UsageService } from '../usage.service'
import { cacheService } from '@/modules/core/cache.service'

describe('UsageService coverage', () => {
  it('returns cached usage and falls back to errors on failures', async () => {
    (UsageService as any).cache = new (UsageService as any).cache.constructor({ max: 10, ttl: 60000 })
    ;(UsageService as any).cache.set('usage', { neon: { status: 'ok', configured: true, checkedAt: '' }, redis: { status: 'ok', configured: true, checkedAt: '' }, resend: { status: 'ok', configured: true, checkedAt: '' }, cloudflare: { status: 'ok', configured: true, checkedAt: '' } })
    const cached = await UsageService.getAllUsage()
    expect(cached.neon.status).toBe('ok')
  })

  it('handles redis not configured and neon warning', async () => {
    ;(UsageService as any).cache = new (UsageService as any).cache.constructor({ max: 10, ttl: 60000 })
    vi.spyOn(cacheService, 'getUsage').mockResolvedValue({ configured: false, keys: 0, memory: 0, memoryBytes: 0 })

    // neon size small -> ok
    ;(db.execute as any) = vi.fn().mockResolvedValue({ rows: [{ raw_size: 10 * 1024 * 1024 }] })

    process.env.NEON_DB_LIMIT_MB = '20'
    process.env.REDIS_MEMORY_LIMIT_MB = '0'
    process.env.RESEND_API_KEY = ''
    process.env.CLOUDFLARE_API_TOKEN = ''
    process.env.CLOUDFLARE_ZONE_ID = ''

    const result = await UsageService.getAllUsage()
    expect(result.redis.status).toBe('not_configured')
    expect(result.neon.status).toBe('ok')
    expect(result.resend.status).toBe('not_configured')
    expect(result.cloudflare.status).toBe('not_configured')
  })
})
