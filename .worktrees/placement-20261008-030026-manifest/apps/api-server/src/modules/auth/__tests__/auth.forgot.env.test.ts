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

function createAuthServiceWithRecovery(findWithDetailsResult: unknown) {
  const userRepo = {
    withDb() {
      return this;
    },
    findWithDetails: vi.fn().mockResolvedValue(findWithDetailsResult),
    createResetToken: vi.fn().mockResolvedValue(undefined),
  };
  const auditService = {
    log: vi.fn().mockResolvedValue(undefined),
  };
  const passwordService = {
    hash: vi.fn(),
  };
  const recoveryService = new PasswordRecoveryService(userRepo as any, auditService as any, passwordService as any);

  return new AuthService(undefined, undefined, undefined, recoveryService as any);
}

describe('AuthService.forgotPassword env guards', () => {
  it('succeeds when APP_URL env is missing for admin user', async () => {
    vi.stubEnv('APP_URL', '')
    const service = createAuthServiceWithRecovery({
      id: 'u1',
      email: 'a@example.com',
      passwordHash: 'hash',
      userRoles: [{ role: { name: 'ADMIN' } }],
    });
    await expect(service.forgotPassword('a@example.com', undefined, 'realtutorialhub')).resolves.toBe(true)
  })

  it('succeeds when APP_URL env is missing for non-admin user', async () => {
    vi.stubEnv('APP_URL', '')
    const service = createAuthServiceWithRecovery({
      id: 'u2',
      email: 'u@example.com',
      passwordHash: 'hash',
      userRoles: [{ role: { name: 'USER' } }],
    });
    await expect(service.forgotPassword('u@example.com', undefined, 'realtutorialhub')).resolves.toBe(true)
  })
})
