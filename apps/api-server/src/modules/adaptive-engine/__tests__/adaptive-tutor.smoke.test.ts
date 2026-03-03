import { describe, it, expect } from 'vitest'

// Smoke import for adaptive tutor service (previously 0% coverage)
describe('AdaptiveTutorService smoke', () => {
  it('imports without throwing', async () => {
    const mod = await import('@/modules/adaptive-engine/adaptive-tutor.service')
    expect(mod.AdaptiveTutorService).toBeDefined()
  })
})
