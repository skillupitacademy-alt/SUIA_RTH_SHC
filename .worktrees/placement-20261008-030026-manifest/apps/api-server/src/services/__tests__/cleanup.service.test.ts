import { describe, it, expect, vi } from 'vitest';

const dbMocks = vi.hoisted(() => {
  const deleteReturn = (label: string) =>
    vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: `${label}-1` }]),
      })),
    }));

  const db = {
    delete: vi.fn(),
  } as any;

  db.delete
    .mockImplementationOnce(deleteReturn('session'))
    .mockImplementationOnce(deleteReturn('refresh'))
    .mockImplementationOnce(deleteReturn('revoked'))
    .mockImplementationOnce(deleteReturn('verify'))
    .mockImplementationOnce(deleteReturn('pwd'))
    .mockImplementationOnce(deleteReturn('audit'))
    .mockImplementationOnce(deleteReturn('jobs'));

  return { db };
});

vi.mock('@quiz/db', () => ({
  db: dbMocks.db,
  sessions: {} as any,
  refreshTokens: {} as any,
  revokedTokens: {} as any,
  verificationTokens: {} as any,
  passwordResetTokens: {} as any,
  auditLogs: {} as any,
  backgroundJobs: { status: 'status', createdAt: 'createdAt' } as any,
}));

import { CleanupService } from '../cleanup.service';

describe('CleanupService', () => {
  it('returns success on happy path', async () => {
    await expect(CleanupService.runCleanupJob()).resolves.toEqual({ success: true });
  });

  it('propagates errors from delete operations', async () => {
    const erroringDelete = vi.fn(() => {
      throw new Error('boom');
    }) as any;
    const dbModule = await import('@quiz/db');
    (dbModule as any).db.delete = erroringDelete;

    await expect(CleanupService.runCleanupJob()).rejects.toThrow('boom');
  });
});
