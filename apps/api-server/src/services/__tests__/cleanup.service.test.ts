import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CleanupService } from '../cleanup.service';

const { mockDb } = vi.hoisted(() => {
  const m = {
    delete: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
  } as any;
  return { mockDb: m };
});

vi.mock('@quiz/db', () => ({
  db: mockDb,
  sessions: { id: 's_id', expiresAt: 's_exp' },
  refreshTokens: { id: 'rt_id', expiresAt: 'rt_exp' },
  revokedTokens: { id: 'rv_id', expiresAt: 'rv_exp' },
  verificationTokens: { id: 'vt_id', expiresAt: 'vt_exp' },
  passwordResetTokens: { id: 'pr_id', expiresAt: 'pr_exp' },
  auditLogs: { id: 'al_id', createdAt: 'al_cat' },
  backgroundJobs: { id: 'bj_id', createdAt: 'bj_cat', status: 'bj_st' },
}));

describe('CleanupService (T96)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should execute all cleanup operations and return success', async () => {
        // Spy on console.log/error to keep test output clean
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const result = await CleanupService.runCleanupJob();

        expect(result.success).toBe(true);
        // Verify that db.delete was called for different tables
        expect(mockDb.delete).toHaveBeenCalledTimes(7);
    });
});
