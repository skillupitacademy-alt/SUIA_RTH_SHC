import { describe, it, expect } from 'vitest'

describe('ReportEngine module loads', () => {
  it('imports without error', async () => {
    const mod = await import('../report.engine')
    expect(mod.ReportEngine).toBeDefined()
  })
})
