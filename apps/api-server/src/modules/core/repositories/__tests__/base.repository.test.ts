import { describe, expect, it, vi } from 'vitest';

import { BaseRepository } from '../base.repository';

class TestRepository extends BaseRepository<any, any> {
  protected table = { id: 'table.id' } as any;
}

describe('BaseRepository', () => {
  it('findById uses select path when available and delete returns first row', async () => {
    const whereMock = vi.fn().mockResolvedValue([{ id: '1' }]);
    const dbMock = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: whereMock })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: '1' }]) })) })),
    } as any;
    const repo = new TestRepository(dbMock);

    await expect(repo.findById('1')).resolves.toEqual({ id: '1' });
    await expect(repo.delete('1')).resolves.toEqual({ id: '1' });
  });

  it('findById falls back to query.exams.findFirst and handles missing adapters', async () => {
    const repoWithQuery = new TestRepository({
      query: { exams: { findFirst: vi.fn().mockResolvedValue({ id: '2' }) } },
    } as any);
    await expect(repoWithQuery.findById('2')).resolves.toEqual({ id: '2' });

    const repoWithoutAdapters = new TestRepository({} as any);
    await expect(repoWithoutAdapters.findById('3')).resolves.toBeUndefined();
  });
});
