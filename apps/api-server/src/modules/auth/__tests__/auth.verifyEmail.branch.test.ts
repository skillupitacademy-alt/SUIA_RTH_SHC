import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { AuthService } from '../auth.service'

describe('AuthService.verifyEmail branches', () => {
  it('verifies token success path', async () => {
    const tokenRow = { id: 'vt1', userId: 'u1', token: 'tok', expiresAt: new Date(Date.now() + 1000) }
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

    const result = await AuthService.verifyEmail('tok')
    expect(result).toBe(true)
  })

  it('throws on invalid or expired token', async () => {
    ;(db.query as any) = {
      verificationTokens: {
        findFirst: vi.fn().mockResolvedValue(undefined),
      },
    }
    await expect(AuthService.verifyEmail('bad')).rejects.toThrow(/Invalid or expired/)
  })
})
