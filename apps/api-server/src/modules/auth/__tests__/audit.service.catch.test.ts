import { describe, it, expect, vi } from 'vitest';

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
    mockInsert.mockRejectedValueOnce(new Error('db down'));
    const { AuditService } = await import('../audit.service');
    await expect(
      AuditService.log({ userId: 'u', action: 'test', metadata: { a: 1 } }),
    ).resolves.toBeUndefined();
    expect(mockInsert).toHaveBeenCalled();
  });
});
