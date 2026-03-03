import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { DomainService } from '@/modules/domain/domain.service';

describe('DomainService getAllDomains set error branch', () => {
  it('returns DB result even when cache set fails', async () => {
    const fakeDomains = [{ id: 'd1', status: 'active', subjects: [] }];

    vi.spyOn(cacheService, 'get').mockRejectedValueOnce(new Error('cache down'));
    // Ensure query.domains exists for spy
    if (!(db as any).query.domains) {
      (db as any).query.domains = { findMany: vi.fn(), findFirst: vi.fn() };
    }
    vi.spyOn((db as any).query.domains, 'findMany').mockResolvedValueOnce(fakeDomains as any);
    const setSpy = vi.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('set fail'));

    const result = await DomainService.getAllDomains();

    expect(result).toEqual(fakeDomains);
    expect(setSpy).toHaveBeenCalledTimes(1);
  });
});
