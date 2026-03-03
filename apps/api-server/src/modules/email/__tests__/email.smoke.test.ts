import { describe, it, expect } from 'vitest'

describe('Email module loads', () => {
  it('imports EmailService', async () => {
    const mod = await import('../EmailService')
    expect(mod.EmailService).toBeDefined()
  })
})
