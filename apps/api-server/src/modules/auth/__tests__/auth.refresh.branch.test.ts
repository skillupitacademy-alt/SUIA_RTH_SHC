import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { AuditService } from '@/modules/auth/audit.service'
import { AuthService } from '@/modules/auth/auth.service'
import * as TokenModule from '@/modules/auth/token.service'

// Force decodeJwt to a harmless payload before AuthService.refresh runs
vi.mock('jose', () => ({ decodeJwt: () => ({ isAdmin: false }) }))

vi.mock('@/modules/auth/token.service', async () => {
  const actual = await vi.importActual<typeof import('@/modules/auth/token.service')>('@/modules/auth/token.service')
  return {
    ...actual,
    TokenService: {
      ...actual.TokenService,
      decodeJwt: () => ({ isAdmin: false }),
      verifyRefreshToken: vi.fn().mockResolvedValue({ userId: 'u1', isAdmin: false }),
      generateAccessToken: vi.fn().mockResolvedValue('new-at'),
      generateRefreshToken: vi.fn().mockResolvedValue('new-rt'),
      hashToken: vi.fn().mockResolvedValue('hash'),
    },
  }
})

describe('AuthService refresh branch coverage', () => {
  it('revokes tokens when stored token missing (reuse alert path)', async () => {
    const TokenService = (TokenModule as any).TokenService
    ;(db.query as any).refreshTokens = { findFirst: vi.fn().mockResolvedValue(undefined) }
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    ;(db as any).select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([
        { id: 'u1', email: 'u1@example.com', isBlocked: false, roleName: 'USER' }
      ])
    })
    const logSpy = vi.spyOn(AuditService, 'log').mockResolvedValue(undefined as never)

    await expect(AuthService.refresh('any-token')).rejects.toThrow(/Session compromised/)
    expect(logSpy).toHaveBeenCalled()
    expect(TokenService.verifyRefreshToken).toHaveBeenCalled()
  })
})
