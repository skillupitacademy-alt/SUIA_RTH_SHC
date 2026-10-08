import { describe, it, expect, vi } from 'vitest';
import { db } from '@quiz/db';

const mockInsert = vi.fn();

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    insert: () => ({
      values: mockInsert,
    }),
  },
  users: {},
  userProfiles: {},
  roles: {},
  userRoles: {},
  auditLogs: {},
  verificationTokens: {},
  passwordResetTokens: {},
  refreshTokens: {},
  loginAttempts: {},
}));

describe('AuditService catch branch 2', () => {
  it('logs error but does not throw when insert fails with non-Error', async () => {
    mockInsert.mockImplementationOnce(() => { throw 'primitive error'; });
    const { AuditService } = await import('../audit.service');
    const service = new AuditService();
    await expect(
      service.log({ userId: 'u', action: 'test', metadata: { a: 1 } }),
    ).resolves.toBeUndefined();
    expect(mockInsert).toHaveBeenCalled();
  });
});


