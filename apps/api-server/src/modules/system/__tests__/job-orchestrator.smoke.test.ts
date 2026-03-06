import { describe, it, expect } from 'vitest'

describe('JobOrchestrator module loads', () => {
  it('imports without error', async () => {
    const mod = await import('../job-orchestrator')
    expect(mod.JobOrchestrator).toBeDefined()
  }, 20000)
})
