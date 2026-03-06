import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

import { ResilienceManager } from '@/modules/core/resilience.manager'

describe('Phase 5 - performance & resilience hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('backs off heavy work when high-load mode is enabled', async () => {
    const manager = ResilienceManager.getInstance()
    manager.setHighLoad(true)

    const task = vi.fn().mockResolvedValue('ok')
    const res = await manager.runHeavyTask('report-generation', task)

    expect(res).toBeNull()
    expect(task).not.toHaveBeenCalled()
  })

  it('runs heavy work when high-load mode is disabled', async () => {
    const manager = ResilienceManager.getInstance()
    manager.setHighLoad(false)

    const task = vi.fn().mockResolvedValue('ok')
    const res = await manager.runHeavyTask('report-generation', task)

    expect(res).toBe('ok')
    expect(task).toHaveBeenCalled()
  })
})
