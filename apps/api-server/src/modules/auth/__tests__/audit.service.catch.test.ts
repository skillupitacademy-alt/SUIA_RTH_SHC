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

describe('AuditService catch branch', () => {
  it('logs error but does not throw when insert fails', async () => {
    mockInsert.mockImplementationOnce(() => { throw new Error('db down'); });
    const { AuditService } = await import('../audit.service');
    // AuditService.log is now an INSTANCE method
    const service = new AuditService();
    await expect(
      service.log({ userId: 'u', action: 'test', metadata: { a: 1 } }),
    ).resolves.toBeUndefined();
    expect(mockInsert).toHaveBeenCalled();
  });
});
