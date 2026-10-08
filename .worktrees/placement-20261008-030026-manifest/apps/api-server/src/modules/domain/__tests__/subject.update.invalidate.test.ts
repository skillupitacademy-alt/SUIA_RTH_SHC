import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { SubjectService } from '@/modules/domain/domain.service';

describe('SubjectService updateSubject invalidation', () => {
  it('clears domains cache on update', async () => {
    const delSpy = vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as never);
    const returning = vi.fn().mockResolvedValue([{ id: 's1' }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    (db.update as any) = vi.fn().mockReturnValue({ set });

    await SubjectService.updateSubject('s1', { name: 'New' });

    expect(delSpy).toHaveBeenCalledWith('metadata:domains:all');
  });
});
