import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { AuditService } from '@/modules/auth/audit.service'
import { AuthService } from '@/modules/auth/auth.service'
import { SecurityService } from '@/modules/auth/security.service'
import { TokenService } from '@/modules/auth/token.service'

// Lightweight Phase 2 coverage (real checks, minimal dependencies)
describe('Auth phase 2 coverage', () => {
  it('signup throws when user already exists', async () => {
    // arrange
    const existingUser = { id: 'u1', email: 'x@example.com' }
    ;(db.query as any).users = { findFirst: vi.fn().mockResolvedValue(existingUser) }
    vi.spyOn(AuditService, 'log').mockResolvedValue(undefined as never)

    // act / assert
    await expect(AuthService.signup('x@example.com', 'pw', 'Test')).rejects.toThrow('User already exists')
  })

  it('login blocks when SecurityService reports lockout', async () => {
    vi.spyOn(SecurityService, 'isAccountLocked').mockResolvedValue(true as never)
    vi.spyOn(AuditService, 'log').mockResolvedValue(undefined as never)

    await expect(AuthService.login('locked@example.com', 'pw')).rejects.toThrow(/temporarily locked/i)
  })

  it('refresh denies infra audience when role missing', async () => {
    // token verification succeeds but user lacks INFRASTRUCTURE role
    vi.spyOn(TokenService, 'verifyRefreshToken').mockResolvedValue({ userId: 'u1' } as any)
    vi.spyOn(TokenService, 'hashToken').mockResolvedValue('hash' as never)
    vi.spyOn(TokenService, 'generateAccessToken').mockResolvedValue('new-access' as never)
    vi.spyOn(TokenService, 'generateRefreshToken').mockResolvedValue('new-refresh' as never)
    ;(db.query as any).refreshTokens = { findFirst: vi.fn().mockResolvedValue({ userId: 'u1', revoked: false, expiresAt: new Date(Date.now() + 1000) }) }
    ;(db.query as any).exams = { findFirst: vi.fn().mockResolvedValue(undefined) }
    ;(db as any).select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnValue([
        { id: 'u1', email: 'u1@example.com', isBlocked: false, roleName: 'USER' }
      ])
    })
    ;(db as any).update = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }) })

    const jwtLike = 'eyJhbGciOiJIUzI1NiJ9.eyJpc0FkbWluIjpmYWxzZX0.signature'
    await expect(AuthService.refresh(jwtLike, undefined, undefined, 'infra')).rejects.toThrow(/Infrastructure privileges/)
  })

  it('resendVerification throws when email already verified', async () => {
    ;(db.query as any).users = { findFirst: vi.fn().mockResolvedValue({ id: 'u1', emailVerified: true }) }

    await expect(AuthService.resendVerification('u1')).rejects.toThrow('Email already verified')
  })
})
