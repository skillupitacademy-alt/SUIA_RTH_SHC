import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockDb } from '../../__test-utils__/mock-db';
import { UsageService } from '../system/usage.service';
import { VectorService } from '../core/vector.service';
import { SkillService } from '../domain/skill.service';

// Mock DB
vi.mock('@quiz/db', () => ({
  STANDARD_QUERY_TIMEOUT: 15000,
  QUICK_QUERY_TIMEOUT: 5000,
  REPORT_QUERY_TIMEOUT: 30000,
  MIGRATION_TIMEOUT: 120000,
  withTimeout: vi.fn(async (promise: Promise<any>) => promise),
  db: mockDb,
  skills: { id: 'skills.id' },
}));

describe('Consolidated Infrastructure Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('UsageService', () => {
    it('reports health and handles unconfigured states', async () => {
        const originalEnv = process.env.UPSTASH_REDIS_REST_URL;
        delete process.env.UPSTASH_REDIS_REST_URL;
        
        const status = await UsageService.getAllUsage();
        expect(status.redis.status).toBe('not_configured');
        
        process.env.UPSTASH_REDIS_REST_URL = originalEnv;
    });

    it('covers error state branches', async () => {
        const errState = (UsageService as any).getErrorState(new Error('Test'));
        expect(errState.status).toBe('_error');
    });
  });

  describe('Vector & Skill Services', () => {
    it('triggers VectorService deletion handling', async () => {
        const mockIndex = { delete: vi.fn().mockRejectedValue(new Error('Vector Crash')) };
        (VectorService as any).index = mockIndex;
        
        await VectorService.deleteQuestion('q1');
        expect(mockIndex.delete).toHaveBeenCalled();
    });

    it('verifies SkillService batch deletion', async () => {
        await SkillService.deleteSkillsBatch(['s1', 's2']);
        expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});


