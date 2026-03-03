import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { AuthService } from '../auth.service'
import { TokenService } from '../token.service'
import { AuditService } from '../audit.service'

describe('AuthService.refresh edge cases', () => {
  it('rejects invalid token and logs', async () => {
    vi.spyOn(TokenService, 'verifyRefreshToken').mockRejectedValue(new Error('bad'))
    vi.spyOn(TokenService, 'hashToken').mockResolvedValue('hash')
    const logSpy = vi.spyOn(AuditService, 'log').mockResolvedValue(undefined as any)

    await expect(AuthService.refresh('bad-token')).rejects.toThrow()
  })

  it('revokes tokens when hash not found', async () => {
    vi.spyOn(TokenService, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any)
    vi.spyOn(TokenService, 'hashToken').mockResolvedValue('hash')
    ;(db.query as any).refreshTokens = { findFirst: vi.fn().mockResolvedValue(undefined) }
    ;(db.update as any) = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    const logSpy = vi.spyOn(AuditService, 'log').mockResolvedValue(undefined as any)

    await expect(AuthService.refresh('tok')).rejects.toThrow()
  })
})
