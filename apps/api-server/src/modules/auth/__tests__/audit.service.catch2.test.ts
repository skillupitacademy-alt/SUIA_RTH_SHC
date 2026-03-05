import { describe, it, expect, vi } from 'vitest';
import { db } from '@quiz/db';

const mockInsert = vi.fn();

vi.mock('@quiz/db', () => ({
  db: {
    insert: () => ({
      values: mockInsert,
    }),
  },
  auditLogs: {},
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
