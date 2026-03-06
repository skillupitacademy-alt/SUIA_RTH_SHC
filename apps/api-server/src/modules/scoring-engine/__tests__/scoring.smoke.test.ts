import { describe, it, expect } from 'vitest'

describe('ScoringEngine module loads', () => {
  it('imports without error', async () => {
    const mod = await import('../scoring.engine')
    expect(mod.ScoringEngine).toBeDefined()
  }, 20000)
})
