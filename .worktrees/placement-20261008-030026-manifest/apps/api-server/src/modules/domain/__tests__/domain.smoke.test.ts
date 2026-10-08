import { describe, it, expect } from 'vitest'

describe('Domain module loads', () => {
  it('imports DomainService', async () => {
    const mod = await import('../domain.service')
    expect(mod.DomainService).toBeDefined()
  })
})
