import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { DomainService } from '@/modules/domain/domain.service';

describe('DomainService deleteDomainsBatch invalidates per-domain caches', () => {
  it('calls del for domains list and hierarchy per id', async () => {
    const delSpy = vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as never);
    const where = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 'd1' }, { id: 'd2' }]) });
    (db.delete as any) = vi.fn().mockReturnValue({ where });

    await DomainService.deleteDomainsBatch(['d1', 'd2']);

    expect(delSpy).toHaveBeenCalledWith('metadata:domains:all');
    expect(delSpy).toHaveBeenCalledWith('metadata:domain-hierarchy:d1');
    expect(delSpy).toHaveBeenCalledWith('metadata:domain-hierarchy:d2');
  });
});
