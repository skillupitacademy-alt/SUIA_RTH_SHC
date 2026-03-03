import { describe, it, expect, vi } from 'vitest';

import { db } from '@quiz/db';
import { subtopics } from '@quiz/db';

import { TopicService } from '@/modules/domain/domain.service';

describe('TopicService subtopic CRUD coverage', () => {
  it('getSubtopicsByTopic returns DB rows', async () => {
    if (!(db as any).query.subtopics) {
      (db as any).query.subtopics = { findMany: vi.fn() };
    }
    vi.spyOn((db as any).query.subtopics, 'findMany').mockResolvedValueOnce([{ id: 'st1' }] as any);
    const rows = await TopicService.getSubtopicsByTopic('t1');
    expect(rows[0].id).toBe('st1');
  });

  it('create/update/delete/deleteBatch subtopics execute', async () => {
    const returning = vi.fn().mockResolvedValue([{ id: 'st2' }]);
    (db.insert as any) = vi.fn().mockReturnValue({ values: vi.fn().mockReturnValue({ returning }) });
    (db.update as any) = vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning }) }) });
    (db.delete as any) = vi.fn().mockReturnValue({ where: vi.fn().mockReturnValue({ returning }) });

    await TopicService.createSubtopic({ id: 'st2', topicId: 't1', name: 'Loops', status: 'active' } as any);
    await TopicService.updateSubtopic('st2', { name: 'Loops+' });
    await TopicService.deleteSubtopic('st2');
    await TopicService.deleteSubtopicsBatch(['st2', 'st3']);

    expect(returning).toHaveBeenCalled();
  });
});
