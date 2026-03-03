import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { AuditService } from '@/modules/auth/audit.service'
import { AuthService } from '@/modules/auth/auth.service'
import { PasswordService } from '@/modules/auth/password.service'
import { SecurityService } from '@/modules/auth/security.service'
import { TokenService } from '@/modules/auth/token.service'

describe('AuthService login edge branches', () => {
  it('throws for blocked user', async () => {
    vi.spyOn(SecurityService, 'isAccountLocked').mockResolvedValue(false as never)
    vi.spyOn(PasswordService, 'compare').mockResolvedValue(true as never)
    vi.spyOn(AuditService, 'log').mockResolvedValue(undefined as never)
    vi.spyOn(SecurityService, 'trackLoginAttempt').mockResolvedValue(undefined as never)
    vi.spyOn(TokenService, 'generateAccessToken').mockResolvedValue('at')
    vi.spyOn(TokenService, 'generateRefreshToken').mockResolvedValue('rt')
    vi.spyOn(TokenService, 'hashToken').mockResolvedValue('hash')
    ;(db.query as any).users = { findFirst: vi.fn().mockResolvedValue({
      id: 'u1', email: 'u1@example.com', passwordHash: 'pw', isBlocked: true,
      userRoles: [{ role: { name: 'USER' } }],
      profile: {},
    }) }
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })

    await expect(AuthService.login('u1@example.com', 'pw')).rejects.toThrow(/blocked/i)
  })
})
