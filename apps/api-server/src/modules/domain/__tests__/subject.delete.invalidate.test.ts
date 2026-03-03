import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { SubjectService } from '@/modules/domain/domain.service';

describe('SubjectService deletion invalidates domain cache', () => {
  it('deleteSubject clears metadata:domains:all', async () => {
    const delSpy = vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as never);
    const where = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 's1' }]) });
    (db.delete as any) = vi.fn().mockReturnValue({ where });

    await SubjectService.deleteSubject('s1');

    expect(delSpy).toHaveBeenCalledWith('metadata:domains:all');
  });

  it('deleteSubjectsBatch clears metadata:domains:all once', async () => {
    const delSpy = vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as never);
    const where = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: 's1' }]) });
    (db.delete as any) = vi.fn().mockReturnValue({ where });

    await SubjectService.deleteSubjectsBatch(['s1', 's2']);

    expect(delSpy).toHaveBeenCalledWith('metadata:domains:all');
  });
});
