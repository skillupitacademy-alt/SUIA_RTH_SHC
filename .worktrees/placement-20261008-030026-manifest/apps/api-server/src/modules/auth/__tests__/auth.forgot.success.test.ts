import { describe, it, expect, vi } from 'vitest'

import { EmailService } from '@/modules/email/EmailService'
import { PasswordRecoveryService } from '../password-recovery.service'
import { AuthService } from '../auth.service'

vi.mock('@/modules/email/EmailService');
vi.mock('@/modules/auth/brand-db', () => ({
  getAuthBrandContext: vi.fn(() => ({ db: {}, tables: {} })),
  shouldUseBrandBinding: vi.fn(() => false),
}));
vi.mock('@/modules/auth/audit.service', () => ({
  AuditService: class AuditService {},
}));
vi.mock('@/modules/auth/password.service', () => ({
  PasswordService: class PasswordService {},
}));

describe('AuthService.forgotPassword success path', () => {
  it('sends reset email when env present', async () => {
    const userRepo = {
      withDb() {
        return this;
      },
      findWithDetails: vi.fn().mockResolvedValue({
        id: 'u1',
        email: 'user@example.com',
        passwordHash: 'hash',
        userRoles: [{ role: { name: 'USER' } }],
      }),
      createResetToken: vi.fn().mockResolvedValue(undefined),
    };
    const auditService = {
      log: vi.fn().mockResolvedValue(undefined),
    };
    const passwordService = {
      hash: vi.fn(),
    };
    process.env.APP_URL = 'https://app.test'

    const emailSpy = vi.spyOn(EmailService, 'sendPasswordResetEmail').mockResolvedValue(undefined as any);
    const recoveryService = new PasswordRecoveryService(userRepo as any, auditService as any, passwordService as any);
    const service = new AuthService(undefined, undefined, undefined, recoveryService as any);
    await expect(service.forgotPassword('user@example.com', undefined, 'realtutorialhub')).resolves.toBe(true)
    expect(emailSpy).toHaveBeenCalled()
  })
})
