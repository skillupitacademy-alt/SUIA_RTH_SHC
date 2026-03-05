import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db, auditLogs } from '@quiz/db';
import { AuditService } from '../audit.service';
import { container } from '../../core/container';

vi.mock('@quiz/db', () => ({
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
