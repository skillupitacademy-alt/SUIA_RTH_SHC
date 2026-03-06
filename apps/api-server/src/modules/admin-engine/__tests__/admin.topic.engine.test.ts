import { describe, expect, it, vi } from 'vitest';

import { AdminTopicEngine } from '../admin.topic.engine';

describe('AdminTopicEngine', () => {
  const repository = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteBatch: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const engine = new AdminTopicEngine(repository as any, audit as any);

  it('handles list/crud/batch operations and validateTopic placeholder', async () => {
    repository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    repository.create.mockResolvedValue({ id: 't1' });
    repository.update.mockResolvedValue({ id: 't1', name: 'Updated' });
    repository.delete.mockResolvedValue({ id: 't1' });
    repository.deleteBatch.mockResolvedValue([{ id: 't1' }]);

    await expect(engine.getTopics(1, 10, { subjectId: 's1', search: 'intro' })).resolves.toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    await expect(engine.createTopic({ name: 'Intro', subjectId: 's1' } as any, 'admin-1')).resolves.toEqual({ id: 't1' });
    await expect(engine.updateTopic('t1', { name: 'Updated' } as any, 'admin-1')).resolves.toEqual({ id: 't1', name: 'Updated' });
    await expect(engine.deleteTopic('t1', 'admin-1')).resolves.toEqual({ id: 't1' });
    await expect(engine.deleteTopicsBatch(['t1'], 'admin-1')).resolves.toEqual([{ id: 't1' }]);
    await expect(engine.validateTopic('t1')).resolves.toEqual({ valid: true, issues: [] });

    expect(audit.log).toHaveBeenCalledTimes(4);
  });
});
