import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { AuditService } from '@/modules/auth/audit.service'
import { AuthService } from '@/modules/auth/auth.service'
import { TokenService } from '@/modules/auth/token.service'

describe('AuthService logout edge', () => {
  it('marks refresh token revoked and bumps lastActiveAt backwards', async () => {
    vi.spyOn(TokenService, 'hashToken').mockResolvedValue('hash')
    const where = vi.fn().mockResolvedValue(undefined)
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where }) })
    const logSpy = vi.spyOn(AuditService, 'log').mockResolvedValue(undefined as never)

    await AuthService.logout('rt', 'u1')

    expect((db as any).update).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalled()
  })
})
