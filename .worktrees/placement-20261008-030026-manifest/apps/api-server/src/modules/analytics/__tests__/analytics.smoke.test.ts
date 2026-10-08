import { describe, it, expect } from 'vitest'

describe('Analytics modules load', () => {
  it('user-analytics service imports', async () => {
    const mod = await import('../user-analytics.service')
    expect(mod.UserAnalyticsService).toBeDefined()
  })

  it('insight-engine service imports', async () => {
    const mod = await import('../insight-engine.service')
    expect(mod.InsightEngineService).toBeDefined()
  })
})
