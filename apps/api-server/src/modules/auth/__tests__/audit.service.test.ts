import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, auditLogs, sessions, refreshTokens, users } from '@quiz/db';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  db: {
    insert: vi.fn().mockImplementation((_table: any) => ({ values: vi.fn() })),
  },
  auditLogs: { tableName: 'audit_logs' },
  sessions: { tableName: 'sessions' },
  refreshTokens: { tableName: 'refresh_tokens' },
  users: { tableName: 'users' }
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
