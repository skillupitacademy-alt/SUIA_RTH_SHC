import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  let captured: any;
  return {
    captured,
    setCaptured: (d: any) => {
      mocks.captured = d;
    },
    insertSpy: vi.fn(),
    childSpy: vi.fn().mockReturnValue({ error: vi.fn() }),
  };
});

vi.mock('@quiz/db', () => ({
  db: {
    insert: (table: any) => ({
      values: (data: any) => {
        mocks.setCaptured({ table, ...data });
        return Promise.resolve(data);
      },
    }),
    auditLogs: {} as any,
  },
  auditLogs: {} as any,
}));

vi.mock('@/lib/logger', () => ({
  logger: { child: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }) },
}));

describe('AuditService metadata null branch', () => {
  beforeEach(() => {
    vi.resetModules();
    mocks.captured = undefined;
  });

  it('writes metadata null when not provided', async () => {
    const { AuditService } = await import('../audit.service');

    await AuditService.log({ action: 'no_metadata' });

    expect(mocks.captured).toBeDefined();
    expect(mocks.captured?.metadata).toBeNull();
  });
});
