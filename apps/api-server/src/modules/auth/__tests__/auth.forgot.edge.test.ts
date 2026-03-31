import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'

import { AuditService } from '@/modules/auth/audit.service'
import { AuthService } from '@/modules/auth/auth.service'
import { EmailService } from '@/modules/email/EmailService'

describe('AuthService forgot password edge', () => {
  it('throws when APP_URL env is missing', async () => {
    vi.spyOn(AuditService.prototype, 'log').mockResolvedValue(undefined as never)
    vi.spyOn(EmailService, 'sendPasswordResetEmail').mockResolvedValue(undefined as never)
    ;(db.query as any).users = { findFirst: vi.fn().mockResolvedValue({
      id: 'u1',
      email: 'u1@example.com',
      passwordHash: 'pw',
      userRoles: [{ role: { name: 'ADMIN' } }]
    }) }
    ;(db as any).insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([])
      })
    })
    vi.stubEnv('APP_URL', '')

    const { container } = await import('../../core/container')
    await expect(container.get(AuthService).forgotPassword('u1@example.com', undefined, 'realtutorialhub')).rejects.toThrow(/APP_URL/)
  })
})
