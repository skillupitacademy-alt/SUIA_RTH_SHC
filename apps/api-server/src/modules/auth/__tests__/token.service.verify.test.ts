import { describe, it, expect, vi } from 'vitest'
import { SignJWT } from 'jose'

// Import TokenService lazily after setting env secrets
const loadService = async () => {
  vi.resetModules()
  process.env.JWT_SECRET = 'secret-key'
  process.env.JWT_REFRESH_SECRET = 'refreshsecret-key'
  process.env.ADMIN_JWT_SECRET = 'admin-secret-key'
  const mod = await import('../token.service')
  return mod.TokenService
}

describe('TokenService verify branches', () => {
  it('verifies access token for admin audience', async () => {
    const TokenService = await loadService()
    const token = await new SignJWT({ userId: 'u1', email: 'a@b.com', roles: [], isAdmin: true, aud: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!))

    const payload = await TokenService.verifyAccessToken(token, { isAdmin: true, audience: 'admin' })
    expect(payload.isAdmin).toBe(true)
  })

  it('rejects refresh token with wrong audience', async () => {
    const TokenService = await loadService()
    const token = await new SignJWT({ userId: 'u1', isAdmin: false, aud: 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(new TextEncoder().encode(process.env.JWT_REFRESH_SECRET!))

    await expect(TokenService.verifyRefreshToken(token, { isAdmin: false, audience: 'admin' })).rejects.toThrow()
  })
})
