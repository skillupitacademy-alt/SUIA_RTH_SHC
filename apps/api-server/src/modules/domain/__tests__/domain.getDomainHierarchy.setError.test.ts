import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { DomainService } from '@/modules/domain/domain.service';

describe('DomainService getDomainHierarchy cache set error', () => {
  it('returns DB result even if cache set fails', async () => {
    const hierarchy = { id: 'd1', subjects: [] };

    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(null);
    if (!(db as any).query.domains) {
      (db as any).query.domains = { findFirst: vi.fn(), findMany: vi.fn() };
    }
    vi.spyOn((db as any).query.domains, 'findFirst').mockResolvedValueOnce(hierarchy as any);
    const setSpy = vi.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('set fail'));

    const result = await DomainService.getDomainHierarchy('d1');

    expect(result).toEqual(hierarchy);
    expect(setSpy).toHaveBeenCalled();
  });
});
