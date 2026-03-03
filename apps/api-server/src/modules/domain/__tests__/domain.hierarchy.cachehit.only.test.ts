import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { DomainService } from '@/modules/domain/domain.service';

describe('DomainService getDomainHierarchy cache hit short-circuits DB', () => {
  it('returns cached hierarchy and skips DB', async () => {
    const cachedValue = { id: 'd1', subjects: [] };
    vi.spyOn(cacheService, 'get').mockResolvedValueOnce(cachedValue as any);
    if (!(db as any).query.domains) {
      (db as any).query.domains = { findFirst: vi.fn(), findMany: vi.fn() };
    }
    const dbSpy = vi.spyOn((db as any).query.domains, 'findFirst').mockResolvedValueOnce(null as any);

    const result = await DomainService.getDomainHierarchy('d1');

    expect(result).toEqual(cachedValue);
    expect(dbSpy).not.toHaveBeenCalled();
  });
});
