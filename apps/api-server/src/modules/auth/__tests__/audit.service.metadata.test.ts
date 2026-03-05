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

describe('AuditService Metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    container.reset();
    container.register(AuditService, new AuditService(db as any));
  });

  it('log: handles complex metadata (Line 19)', async () => {
    const service = container.get(AuditService);
    await service.log({ userId: 'u1', action: 'test', metadata: { foo: 'bar' } });
    expect(db.insert).toHaveBeenCalled();
  });
});
