import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  logger: {
    child: vi.fn(() => ({
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    })),
  },
}))

import { logger } from '@/lib/logger'
import { withLogging } from '@/lib/withLogging'

describe('Phase 1 - foundational safety nets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('captures route errors via error boundaries and redacts PII', async () => {
    const handler = vi.fn(() => {
      throw new Error('boom admin@example.com token=secret')
    })
    const wrapped = withLogging(handler, { component: 'core', operation: 'phase1' })
    const req = {
      headers: new Headers(),
      method: 'GET',
      nextUrl: new URL('https://example.com/api/test'),
    } as unknown as Request

    const res = await wrapped(req as any, {} as any)

    expect(res.status).toBe(500)
    const child = vi.mocked(logger.child).mock.results[0]?.value
    expect(child.error).toHaveBeenCalled()
    const logged = child.error.mock.calls[0][0]
    expect(logged.error).toContain('[REDACTED_EMAIL]')
  })

  it('loads environment configuration from the SSOT config module', async () => {
    const originalEnv = { ...process.env }
    process.env.ALLOWED_ORIGINS = ' https://a.test , https://b.test '
    process.env.NEXT_PUBLIC_WEB_APP_URL = 'https://web.test'
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.test'

    vi.resetModules()
    const { config } = await import('@/config')

    expect(config.cors.allowedOrigins).toEqual(['https://a.test', 'https://b.test'])
    process.env = originalEnv
  })
})
