import { describe, it, expect, vi, beforeEach } from 'vitest'

import { db } from '@quiz/db'
import { AuthService } from '../auth.service'
import { AuditService } from '../audit.service'
import { UserRepository } from '../repositories/user.repository'
import { container } from '@/modules/core/container'

describe('AuthService.verifyEmail branches', () => {
  beforeEach(() => {
    container.reset()
  })

  it('verifies token success path', async () => {
    const tokenRow = { id: 'vt1', userId: 'u1', token: 'tok', expiresAt: new Date(Date.now() + 60 * 60 * 1000) }
    ;(db.query as any) = {
      verificationTokens: {
        findFirst: vi.fn().mockResolvedValue(tokenRow),
      },
    }
    ;(db.update as any) = vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    })
    ;(db.delete as any) = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    })

    container.register(UserRepository, {
      findToken: vi.fn().mockResolvedValue(tokenRow),
      verifyEmail: vi.fn().mockResolvedValue(undefined),
      deleteToken: vi.fn().mockResolvedValue(undefined),
    } as any)
    container.register(AuditService, {
      log: vi.fn().mockResolvedValue(undefined),
    } as any)
    const result = await container.get(AuthService).verifyEmail('tok')
    expect(result).toBe(true)
  })

  it('throws on invalid or expired token', async () => {
    ;(db.query as any) = {
      verificationTokens: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
    }
    container.register(UserRepository, {
      findToken: vi.fn().mockResolvedValue(undefined),
      verifyEmail: vi.fn(),
      deleteToken: vi.fn(),
    } as any)
    container.register(AuditService, {
      log: vi.fn().mockResolvedValue(undefined),
    } as any)
    await expect(container.get(AuthService).verifyEmail('bad')).rejects.toThrow(/Invalid or expired/)
  })
})
