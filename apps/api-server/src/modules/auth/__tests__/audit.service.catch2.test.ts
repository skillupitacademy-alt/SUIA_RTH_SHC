import { describe, it, expect, vi } from 'vitest';

const valuesMock = vi.fn();

vi.mock('@quiz/db', () => ({
  db: { insert: () => ({ values: valuesMock }) },
  auditLogs: {},
}));

describe('AuditService catch line 29', () => {
  it('handles insert failure without throwing', async () => {
    valuesMock.mockRejectedValueOnce(new Error('fail'));
    const { AuditService } = await import('../audit.service');
    await expect(AuditService.log({ action: 'x' })).resolves.toBeUndefined();
  });
});
