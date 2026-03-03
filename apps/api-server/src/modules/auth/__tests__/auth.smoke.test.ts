import { describe, it, expect } from 'vitest'

describe('AuthService module loads', () => {
  it('should import AuthService without throwing', async () => {
    const mod = await import('../auth.service')
    expect(mod.AuthService).toBeDefined()
  })
})
