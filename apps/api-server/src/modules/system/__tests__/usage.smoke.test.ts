import { describe, it, expect } from 'vitest'

describe('UsageService module loads', () => {
  it('imports without error', async () => {
    const mod = await import('../usage.service')
    expect(mod.UsageService).toBeDefined()
  })
})
