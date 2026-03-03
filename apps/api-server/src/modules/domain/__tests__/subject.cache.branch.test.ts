import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { SubjectService } from '@/modules/domain/domain.service';

describe('SubjectService caching branches', () => {
  it('returns cached subjects and skips DB', async () => {
    const cached = [{ id: 's1' }];
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(cached as any);
    if (!(db as any).query.subjects) {
      (db as any).query.subjects = { findMany: vi.fn(), findFirst: vi.fn() };
    }
    const dbSpy = vi.spyOn((db as any).query.subjects, 'findMany').mockResolvedValue([]);

    const result = await SubjectService.getSubjectsByDomain('d1');
    expect(result).toEqual(cached);
    expect(dbSpy).not.toHaveBeenCalled();
  });

  it('still returns DB subjects when cache set rejects', async () => {
    const rows = [{ id: 's2' }];
    vi.spyOn(cacheService, 'get').mockRejectedValueOnce(new Error('cache miss'));
    vi.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('set fail'));
    if (!(db as any).query.subjects) {
      (db as any).query.subjects = { findMany: vi.fn(), findFirst: vi.fn() };
    }
    vi.spyOn((db as any).query.subjects, 'findMany').mockResolvedValueOnce(rows as any);

    const result = await SubjectService.getSubjectsByDomain('d2');
    expect(result).toEqual(rows);
  });
});
