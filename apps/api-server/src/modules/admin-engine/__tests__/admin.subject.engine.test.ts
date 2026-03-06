import { describe, expect, it, vi } from 'vitest';

import { AdminSubjectEngine } from '../admin.subject.engine';

describe('AdminSubjectEngine', () => {
  const repository = {
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteBatch: vi.fn(),
  };
  const audit = { log: vi.fn() };
  const engine = new AdminSubjectEngine(repository as any, audit as any);

  it('delegates repository calls and logs audited mutations', async () => {
    repository.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    repository.create.mockResolvedValue({ id: 'sub1' });
    repository.update.mockResolvedValue({ id: 'sub1', name: 'Updated' });
    repository.delete.mockResolvedValue({ id: 'sub1' });
    repository.deleteBatch.mockResolvedValue([{ id: 'sub1' }]);

    await expect(engine.getSubjects(1, 10, { domainId: 'd1', search: 'math' })).resolves.toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    await expect(engine.createSubject({ name: 'Math', domainId: 'd1' } as any, 'admin-1')).resolves.toEqual({ id: 'sub1' });
    await expect(engine.updateSubject('sub1', { name: 'Updated' } as any, 'admin-1')).resolves.toEqual({ id: 'sub1', name: 'Updated' });
    await expect(engine.deleteSubject('sub1', 'admin-1')).resolves.toEqual({ id: 'sub1' });
    await expect(engine.deleteSubjectsBatch(['sub1'], 'admin-1')).resolves.toEqual([{ id: 'sub1' }]);

    expect(audit.log).toHaveBeenCalledTimes(4);
  });
});
