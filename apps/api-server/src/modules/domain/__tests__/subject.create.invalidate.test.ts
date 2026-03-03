import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { SubjectService } from '@/modules/domain/domain.service';

describe('SubjectService createSubject invalidation', () => {
  it('clears subject cache for domain and domains list when domainId is provided', async () => {
    const delSpy = vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as never);
    const returning = vi.fn().mockResolvedValue([{ id: 's-new' }]);
    const values = vi.fn().mockReturnValue({ returning });
    (db.insert as any) = vi.fn().mockReturnValue({ values });

    await SubjectService.createSubject({ id: 's-new', domainId: 'd1', status: 'active' } as any);

    expect(delSpy).toHaveBeenCalledWith('metadata:subjects:domain:d1');
    expect(delSpy).toHaveBeenCalledWith('metadata:domains:all');
  });
});
