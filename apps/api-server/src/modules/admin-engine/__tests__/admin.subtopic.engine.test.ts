import { describe, expect, it, vi } from 'vitest';

import { AdminSubtopicEngine } from '../admin.subtopic.engine';

describe('AdminSubtopicEngine', () => {
  const repository = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteBatch: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const engine = new AdminSubtopicEngine(repository as any, audit as any);

  it('delegates all methods and emits audit records', async () => {
    repository.findAll.mockResolvedValue({ data: [], total: 0, nextCursor: null, limit: 10 });
    repository.create.mockResolvedValue({ id: 'st1' });
    repository.update.mockResolvedValue({ id: 'st1', name: 'Updated' });
    repository.delete.mockResolvedValue({ id: 'st1' });
    repository.deleteBatch.mockResolvedValue([{ id: 'st1' }]);

    await expect(engine.getSubtopics(null, 10, { topicId: 't1', search: 'loops' })).resolves.toEqual({ subtopics: [], total: 0, nextCursor: null, limit: 10 });
    await expect(engine.createSubtopic({ name: 'Loops', topicId: 't1' } as any, 'admin-1')).resolves.toEqual({ id: 'st1' });
    await expect(engine.updateSubtopic('st1', { name: 'Updated' } as any, 'admin-1')).resolves.toEqual({ id: 'st1', name: 'Updated' });
    await expect(engine.deleteSubtopic('st1', 'admin-1')).resolves.toEqual({ id: 'st1' });
    await expect(engine.deleteSubtopicsBatch(['st1'], 'admin-1')).resolves.toEqual([{ id: 'st1' }]);

    expect(audit.log).toHaveBeenCalledTimes(4);
  });
});
