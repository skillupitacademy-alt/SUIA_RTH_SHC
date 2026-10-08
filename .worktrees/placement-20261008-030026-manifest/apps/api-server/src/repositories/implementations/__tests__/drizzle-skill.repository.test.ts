import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DrizzleSkillRepository } from '../drizzle-skill.repository';

const {
  findManyMock,
  selectMock,
  fromMock,
  whereMock,
  insertMock,
  updateMock,
  deleteMock,
  valuesMock,
  setMock,
  returningMock,
  executeMock,
  transactionMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  selectMock: vi.fn(),
  fromMock: vi.fn(),
  whereMock: vi.fn(),
  insertMock: vi.fn(),
  updateMock: vi.fn(),
  deleteMock: vi.fn(),
  valuesMock: vi.fn(),
  setMock: vi.fn(),
  returningMock: vi.fn(),
  executeMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock('@quiz/db', () => ({
  db: {
    query: {
      skills: { findMany: findManyMock },
      topicSkills: { findMany: vi.fn() },
    },
    select: selectMock,
    insert: insertMock,
    update: updateMock,
    delete: deleteMock,
    execute: executeMock,
    transaction: transactionMock,
  },
  skills: {
    id: 'skills.id',
    name: 'skills.name',
    createdAt: {
        toISOString: () => '2024-01-01T00:00:00.000Z'
    },
    $inferSelect: {},
    $inferInsert: {},
  },
  topicSkills: {
    topicId: 'topicSkills.topicId',
    skillId: 'topicSkills.skillId',
  },
}));

vi.mock('@/lib/pagination', () => ({
  buildPaginatedResponse: vi.fn((data, limit) => ({
    data: data.slice(0, limit),
    total: data.length,
    nextCursor: data.length > limit ? 'next' : null,
  })),
  decodePageCursor: vi.fn((cursor) => {
    if (cursor === 'invalid') throw new Error('invalid');
    return { lastSortValue: '2024-01-01', lastId: 'id-1' };
  }),
}));

describe('DrizzleSkillRepository', () => {
  let repo: DrizzleSkillRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new DrizzleSkillRepository();
    
    // Default chain for select().from().where()
    selectMock.mockReturnValue({ 
        from: vi.fn().mockReturnValue({ 
            where: vi.fn().mockResolvedValue([{ count: 10 }]) 
        }) 
    });
    
    // Chain for insert().values().returning()
    insertMock.mockReturnValue({ 
        values: vi.fn().mockReturnValue({ 
            returning: returningMock 
        }) 
    });
    
    // Chain for update().set().where().returning()
    updateMock.mockReturnValue({ 
        set: vi.fn().mockReturnValue({ 
            where: vi.fn().mockReturnValue({ 
                returning: returningMock 
            }) 
        }) 
    });
    
    // Chain for delete().where().returning()
    deleteMock.mockReturnValue({ 
        where: vi.fn().mockReturnValue({ 
            returning: returningMock 
        }) 
    });

    executeMock.mockResolvedValue({ rows: [] });
  });

  describe('findAll', () => {
    it('returns paginated skills using findMany path', async () => {
      findManyMock.mockResolvedValue([
        { id: '1', name: 'Skill 1', createdAt: new Date() },
        { id: '2', name: 'Skill 2', createdAt: new Date() },
      ]);

      const res = await repo.findAll(null, 10);
      expect(res.data.length).toBe(2);
      expect(findManyMock).toHaveBeenCalled();
    });

    it('falls back to legacy SQL when findMany fails', async () => {
      findManyMock.mockRejectedValue(new Error('Column missing'));
      executeMock.mockResolvedValueOnce({
        rows: [{ id: 'legacy-1', name: 'Legacy Skill', weight: 1 }]
      }); // rows query
      executeMock.mockResolvedValueOnce({
        rows: [{ count: 1 }]
      }); // count query

      const res = await repo.findAll('legacy-cursor', 10);
      expect(res.data[0].id).toBe('legacy-1');
      expect(executeMock).toHaveBeenCalledTimes(2);
    });

    it('handles search filter in legacy fallback', async () => {
       findManyMock.mockRejectedValue(new Error('fail'));
       executeMock.mockResolvedValue({ rows: [] });
       await repo.findAll(null, 10, { search: 'test' });
       expect(executeMock).toHaveBeenCalled();
    });
  });

  describe('CRUD operations', () => {
    it('creates a skill', async () => {
      returningMock.mockResolvedValue([{ id: 'new-1' }]);
      const res = await repo.create({ name: 'New' } as any);
      expect(res.id).toBe('new-1');
      expect(insertMock).toHaveBeenCalled();
    });

    it('updates a skill', async () => {
      returningMock.mockResolvedValue([{ id: '1', name: 'Updated' }]);
      const res = await repo.update('1', { name: 'Updated' });
      expect(res.name).toBe('Updated');
      expect(updateMock).toHaveBeenCalled();
    });

    it('deletes a skill', async () => {
      returningMock.mockResolvedValue([{ id: '1' }]);
      const res = await repo.delete('1');
      expect(res.id).toBe('1');
      expect(deleteMock).toHaveBeenCalled();
    });

    it('deletes batch of skills', async () => {
      returningMock.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      const res = await repo.deleteBatch(['1', '2']);
      expect(res.length).toBe(2);
    });
  });

  describe('mapTopicToSkills', () => {
    it('performs transaction to sync topic skills', async () => {
      const txMock = {
        delete: vi.fn().mockReturnValue({ where: vi.fn() }),
        insert: vi.fn().mockReturnValue({ values: vi.fn() }),
      };
      transactionMock.mockImplementation(async (cb) => await cb(txMock));

      await repo.mapTopicToSkills('topic-1', ['skill-1', 'skill-2']);
      expect(txMock.delete).toHaveBeenCalled();
      expect(txMock.insert).toHaveBeenCalled();
    });
  });
});
