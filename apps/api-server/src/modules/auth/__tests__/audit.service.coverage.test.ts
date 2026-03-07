import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, auditLogs } from '@quiz/db';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: {
    insert: vi.fn().mockReturnValue({ values: vi.fn() }),
  },
  auditLogs: { userId: 'u', action: 'a' },
}));

describe('AuditService Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    container.register(AuditService, new AuditService(db as any));
  });

  it('log: performs basic insert (Line 16)', async () => {
    const service = container.get(AuditService);
    await service.log({ userId: 'u1', action: 'test' });
    expect(db.insert).toHaveBeenCalled();
  });
});


