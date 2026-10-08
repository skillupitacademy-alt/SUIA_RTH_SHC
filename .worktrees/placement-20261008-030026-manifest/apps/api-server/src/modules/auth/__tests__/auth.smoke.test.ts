import { describe, it, expect } from 'vitest'

describe('AuthService module loads', () => {
  it('should import AuthService without throwing', { timeout: 20000 }, async () => {
    const mod = await import('../auth.service')
    expect(mod.AuthService).toBeDefined()
  })
})
