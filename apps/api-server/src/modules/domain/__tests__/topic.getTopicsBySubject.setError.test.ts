import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';

import { cacheService } from '@/modules/core/cache.service';
import { TopicService } from '@/modules/domain/domain.service';

describe('TopicService getTopicsBySubject cache set error path', () => {
  it('still returns mapped topics when cache set rejects', async () => {
    const topics = [{
      id: 't1',
      subjectId: 's1',
      status: 'active',
      complexityLevel: 1,
      topicSkills: [{ skill: { name: 'Loops' } }],
    }];

    vi.spyOn(cacheService, 'get').mockRejectedValueOnce(new Error('cache miss'));
    vi.spyOn(cacheService, 'set').mockRejectedValueOnce(new Error('set fail'));
    if (!(db as any).query.topics) {
      (db as any).query.topics = { findMany: vi.fn() };
    }
    vi.spyOn((db as any).query.topics, 'findMany').mockResolvedValueOnce(topics as any);

    const result = await TopicService.getTopicsBySubject('s1');

    expect(result[0].skillName).toBe('Loops');
  });
});
