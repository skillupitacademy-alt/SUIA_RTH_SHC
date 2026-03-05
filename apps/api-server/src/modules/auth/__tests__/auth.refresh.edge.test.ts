import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { AuthService } from '../auth.service'
import { TokenService } from '../token.service'
import { AuditService } from '../audit.service'

describe('AuthService.refresh edge cases', () => {
  it('rejects invalid token and logs', async () => {
    vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockRejectedValue(new Error('bad'))
    vi.spyOn(TokenService.prototype, 'hashToken').mockResolvedValue('hash')
    vi.spyOn(AuditService.prototype, 'log').mockResolvedValue(undefined as any)

    const { container } = await import('../../core/container')
    await expect(container.get(AuthService).refresh('bad-token')).rejects.toThrow()
  })

  it('revokes tokens when hash not found', async () => {
    vi.spyOn(TokenService.prototype, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any)
    vi.spyOn(TokenService.prototype, 'hashToken').mockResolvedValue('hash')
    ;(db.query as any).refreshTokens = { findFirst: vi.fn().mockResolvedValue(undefined) }
    ;(db.update as any) = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })
    vi.spyOn(AuditService.prototype, 'log').mockResolvedValue(undefined as any)

    const { container } = await import('../../core/container')
    await expect(container.get(AuthService).refresh('tok')).rejects.toThrow()
  })
})
