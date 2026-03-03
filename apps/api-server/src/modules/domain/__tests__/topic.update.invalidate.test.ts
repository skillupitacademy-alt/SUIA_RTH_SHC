import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { TopicService } from '@/modules/domain/domain.service';

describe('TopicService updateTopic invalidation', () => {
  it('clears topics cache for subject when subjectId provided', async () => {
    const delSpy = vi.spyOn(cacheService, 'del').mockResolvedValue(undefined as never);
    const returning = vi.fn().mockResolvedValue([{ id: 't1' }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    (db.update as any) = vi.fn().mockReturnValue({ set });

    await TopicService.updateTopic('t1', { subjectId: 's1', name: 'New T' });

    expect(delSpy).toHaveBeenCalledWith('metadata:topics:subject:s1');
  });
});
