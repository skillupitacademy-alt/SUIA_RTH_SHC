import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DatabaseSafetyService } from '../database-safety.service';
import { eq, getTableName, sql } from 'drizzle-orm';

const { mockDb } = vi.hoisted(() => {
  const m = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn(),
  } as any;
  return { mockDb: m };
});

vi.mock('@quiz/db', () => ({
  db: mockDb,
}));

// Mocking drizzle-orm
vi.mock('drizzle-orm', async () => {
  const actual = await vi.importActual('drizzle-orm');
  return {
    ...actual as any,
    getTableName: vi.fn(),
  };
});

describe('DatabaseSafetyService', () => {
  let service: DatabaseSafetyService;

  beforeEach(() => {
    service = new DatabaseSafetyService();
    vi.clearAllMocks();
  });

  describe('checkChildCounts', () => {
    it('should return child counts for multiple tables', async () => {
      const mockTable1 = { _: { name: 'table1' } } as any;
      const mockTable2 = { _: { name: 'table2' } } as any;
      const mockColumn1 = { table: mockTable1 } as any;
      const mockColumn2 = { table: mockTable2 } as any;

      vi.mocked(getTableName).mockImplementation((table: any) => table._.name);

      // Setup sequence of returns for db.where()
      vi.mocked(mockDb.where)
        .mockResolvedValueOnce([{ count: 50 }])
        .mockResolvedValueOnce([{ count: 75 }]);

      const config = [
        { table: mockTable1, column: mockColumn1 },
        { table: mockTable2, column: mockColumn2 },
      ];

      const results = await service.checkChildCounts('parent-123', config);

      expect(results).toEqual({
        table1: 50,
        table2: 75,
      });

      expect(mockDb.from).toHaveBeenCalledWith(mockTable1);
      expect(mockDb.from).toHaveBeenCalledWith(mockTable2);
    });
  });

  describe('enforceSafetyLimits', () => {
    it('should throw Error if total count exceeds threshold', async () => {
      const mockTable = { _: { name: 'table1' } } as any;
      const mockColumn = { table: mockTable } as any;
      vi.mocked(getTableName).mockReturnValue('table1');

      vi.mocked(mockDb.where).mockResolvedValue([{ count: 150 }]);

      const config = [{ table: mockTable, column: mockColumn }];

      await expect(service.enforceSafetyLimits('parent-123', config, 100))
        .rejects
        .toThrow(/CASCADE_SAFETY_LIMIT: This operation would delete 150 child records/);
    });

    it('should not throw Error if total count is within threshold', async () => {
      const mockTable = { _: { name: 'table1' } } as any;
      const mockColumn = { table: mockTable } as any;
      vi.mocked(getTableName).mockReturnValue('table1');

      vi.mocked(mockDb.where).mockResolvedValue([{ count: 50 }]);

      const config = [{ table: mockTable, column: mockColumn }];

      await expect(service.enforceSafetyLimits('parent-123', config, 100))
        .resolves
        .not.toThrow();
    });
  });
});
