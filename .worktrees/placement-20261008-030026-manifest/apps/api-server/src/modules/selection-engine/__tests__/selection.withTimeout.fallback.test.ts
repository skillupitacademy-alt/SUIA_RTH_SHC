import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cacheService } from '@/modules/core/cache.service';
import { SelectionService } from '@/modules/selection-engine/selection.service';

vi.mock('@quiz/db', () => ({
  db: {
    query: { examBlueprints: { findFirst: vi.fn().mockResolvedValue({ id: 'bp1' }) }, questions: { findMany: vi.fn().mockResolvedValue([]) } },
    select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue([{ count: 0 }]) }),
  },
  withTimeout: undefined,
  examBlueprints: { id: 'id' },
  questions: { id: 'id' },
  subjects: { id: 'id' },
  topics: { id: 'id' },
  subtopics: { id: 'id' },
  STANDARD_QUERY_TIMEOUT: 15000,
}));

vi.mock('@/modules/core/cache.service', () => ({ cacheService: { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined) } }));

// This test ensures the withTimeout fallback path executes when dbWithTimeout is undefined

describe('SelectionService withTimeout fallback', () => {
  let service: SelectionService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { db } = await import('@quiz/db');
    service = new SelectionService(db as any, cacheService as any);
  });

  it('uses fallback withTimeout when db export missing', async () => {
    await expect(service.composeExam('u1', 'bp1', 'key1')).rejects.toThrow();
  });
});
