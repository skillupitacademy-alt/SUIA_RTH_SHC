import { describe, it, expect } from 'vitest'
import { ResilienceService } from '../resilience.service'

describe('ResilienceService (core)', () => {
  it('disables features when SAFE_MODE true', async () => {
    process.env.SAFE_MODE = 'true'
    const enabled = await ResilienceService.isFeatureEnabled('analytics')
    expect(enabled).toBe(false)
    process.env.SAFE_MODE = undefined
  })

  it('disables specific feature flag', async () => {
    process.env.DISABLE_ANALYTICS = 'true'
    const enabled = await ResilienceService.isFeatureEnabled('analytics')
    expect(enabled).toBe(false)
    process.env.DISABLE_ANALYTICS = undefined
  })
})
