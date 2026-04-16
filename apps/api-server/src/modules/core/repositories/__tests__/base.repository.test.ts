import { describe, expect, it, vi } from 'vitest';

import { BaseRepository } from '../base.repository';

class TestRepository extends BaseRepository<any, any> {
  protected table = { id: 'table.id' } as any;
}

describe('BaseRepository', () => {
  it('findById throws error to prevent usage and delete returns first row', async () => {
    const dbMock = {
      select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn() })) })),
      delete: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: '1' }]) })) })),
    } as any;
    const repo = new TestRepository(dbMock);

    // findById should throw error to prevent usage
    await expect(repo.findById('1')).rejects.toThrow('❌ DO NOT USE BASE REPOSITORY findById');
    
    // delete should still work
    await expect(repo.delete('1')).resolves.toEqual({ id: '1' });
  });

  it('findById always throws error regardless of DB configuration', async () => {
    const repoWithQuery = new TestRepository({
      query: { exams: { findFirst: vi.fn().mockResolvedValue({ id: '2' }) } },
    } as any);
    
    // Should throw error even with query API available
    await expect(repoWithQuery.findById('2')).rejects.toThrow('❌ DO NOT USE BASE REPOSITORY findById');

    const repoWithoutAdapters = new TestRepository({} as any);
    
    // Should throw error even without adapters
    await expect(repoWithoutAdapters.findById('3')).rejects.toThrow('❌ DO NOT USE BASE REPOSITORY findById');
  });
});
