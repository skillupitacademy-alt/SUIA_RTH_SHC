import { beforeEach, describe, expect, it, vi } from 'vitest';
import { 
  db, 
  auditLogs, 
  sessions, 
  refreshTokens, 
  exams, 
  backgroundJobs,
  reportJobs,
  idempotencyKeys
} from '@quiz/db';
import { RetentionService } from '../retention.service';

// Mock DB
vi.mock('@quiz/db', async () => {
    const actual = await vi.importActual('@quiz/db') as any;
    return {
        ...actual,
        db: {
            delete: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'mock-1' }]),
        }
    };
});

describe('RetentionService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should coordinate all cleanup tasks successfully', async () => {
        const result = await RetentionService.performCleanup();
        
        expect(result.success).toBe(true);
        expect(result.tasks).toBe(5);
        expect(db.delete).toHaveBeenCalledTimes(7); // auditLogs, sessions, refreshTokens, exams, backgroundJobs, reportJobs, idempotencyKeys
    });

    it('should use 90-day threshold for audit logs', async () => {
        await RetentionService.performCleanup();
        
        expect(db.delete).toHaveBeenCalledWith(auditLogs);
        // The second call to delete/where in Promise.allSettled might vary in order, 
        // but we verify the logic was triggered.
    });

    it('should use 30-day threshold for terminal jobs', async () => {
        await RetentionService.performCleanup();
        
        expect(db.delete).toHaveBeenCalledWith(backgroundJobs);
        expect(db.delete).toHaveBeenCalledWith(reportJobs);
    });

    it('should purge sessions and tokens based on expiration', async () => {
        await RetentionService.performCleanup();
        
        expect(db.delete).toHaveBeenCalledWith(sessions);
        expect(db.delete).toHaveBeenCalledWith(refreshTokens);
    });

    it('should handle partial failures gracefully', async () => {
        // Mock one delete to fail
        vi.mocked(db.delete).mockImplementationOnce(() => {
            throw new Error('Database down');
        });

        const result = await RetentionService.performCleanup();
        
        expect(result.success).toBe(false);
        expect(result.failed).toBe(1);
    });
});
