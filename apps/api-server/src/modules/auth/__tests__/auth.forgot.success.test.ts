import { describe, it, expect, vi } from 'vitest'

import { db } from '@quiz/db'
import { EmailService } from '@/modules/email/EmailService'
import { AuthService } from '../auth.service'

vi.mock('@/modules/email/EmailService');

describe('AuthService.forgotPassword success path', () => {
  it('sends reset email when env present', async () => {
    ;(db.query as any) = {
      users: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'u1',
          email: 'user@example.com',
          passwordHash: 'hash',
          userRoles: [{ role: { name: 'USER' } }],
        }),
      },
    }
    ;(db.insert as any) = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnThis(),
    })
    process.env.NEXT_PUBLIC_WEB_APP_URL = 'https://app.test'

    const emailSpy = vi.spyOn(EmailService, 'sendPasswordResetEmail').mockResolvedValue(undefined as any);
    const { container } = await import('../../core/container')
    await expect(container.get(AuthService).forgotPassword('user@example.com')).resolves.toBe(true)
    expect(emailSpy).toHaveBeenCalled()
  })
})
