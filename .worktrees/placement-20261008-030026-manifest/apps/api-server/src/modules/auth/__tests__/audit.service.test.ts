import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, auditLogs, sessions, refreshTokens, users } from '@quiz/db';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    insert: vi.fn().mockImplementation((_table: any) => ({ values: vi.fn() })),
  },
  auditLogs: { tableName: 'audit_logs' },
  userProfiles: { tableName: 'user_profiles' },
  roles: { tableName: 'roles' },
  userRoles: { tableName: 'user_roles' },
  verificationTokens: { tableName: 'verification_tokens' },
  passwordResetTokens: { tableName: 'password_reset_tokens' },
  loginAttempts: { tableName: 'login_attempts' },
  sessions: { tableName: 'sessions' },
  refreshTokens: { tableName: 'refresh_tokens' },
  users: { tableName: 'users' }
}));

vi.mock('@quiz/db-rth', () => ({
  db: {
    insert: vi.fn().mockImplementation((_table: any) => ({ values: vi.fn() })),
  },
  auditLogs: { tableName: 'audit_logs' },
  users: { tableName: 'users' },
  userProfiles: { tableName: 'user_profiles' },
  roles: { tableName: 'roles' },
  userRoles: { tableName: 'user_roles' },
  verificationTokens: { tableName: 'verification_tokens' },
  passwordResetTokens: { tableName: 'password_reset_tokens' },
  refreshTokens: { tableName: 'refresh_tokens' },
  loginAttempts: { tableName: 'login_attempts' },
}));

vi.mock('@quiz/db-skillup', () => ({
  db: {
    insert: vi.fn().mockImplementation((_table: any) => ({ values: vi.fn() })),
  },
  auditLogs: { tableName: 'audit_logs' },
  users: { tableName: 'users' },
  userProfiles: { tableName: 'user_profiles' },
  roles: { tableName: 'roles' },
  userRoles: { tableName: 'user_roles' },
  verificationTokens: { tableName: 'verification_tokens' },
  passwordResetTokens: { tableName: 'password_reset_tokens' },
  refreshTokens: { tableName: 'refresh_tokens' },
  loginAttempts: { tableName: 'login_attempts' },
}));

describe('AuditService (Legacy Suite)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    container.register(AuditService, new AuditService(db as any));
  });

  it('logs an action', async () => {
    const service = container.get(AuditService);
    await service.log({ action: 'test' });
    expect(db.insert).toHaveBeenCalled();
  });
});


