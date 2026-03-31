import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { EmailService } from '@/modules/email/EmailService'
import { AuthService } from '../auth.service'

vi.mock('@/modules/email/EmailService');

describe('AuthService.forgotPassword env guards', () => {
  it('succeeds when APP_URL env is missing for admin user', async () => {
    ;(db.query as any) = {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'a@example.com',
          passwordHash: 'hash',
          userRoles: [{ role: { name: 'ADMIN' } }],
        }),
      },
    }
    ;(db.insert as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
    })
    vi.stubEnv('APP_URL', '')
    const { container } = await import('../../core/container')
    await expect(container.get(AuthService).forgotPassword('a@example.com', undefined, 'realtutorialhub')).resolves.toBe(true)
  })

  it('succeeds when APP_URL env is missing for non-admin user', async () => {
    ;(db.query as any) = {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'u2',
          email: 'u@example.com',
          passwordHash: 'hash',
          userRoles: [{ role: { name: 'USER' } }],
        }),
      },
    }
    ;(db.insert as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
    })
    vi.stubEnv('APP_URL', '')
    const { container } = await import('../../core/container')
    await expect(container.get(AuthService).forgotPassword('u@example.com', undefined, 'realtutorialhub')).resolves.toBe(true)
  })
})
