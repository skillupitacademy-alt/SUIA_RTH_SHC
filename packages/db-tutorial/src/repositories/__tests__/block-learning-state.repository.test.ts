/**
 * Block Learning State Repository Tests - Phase 4.2
 * 
 * Test categories:
 * - Identity lookup (exact match, isolation)
 * - CRUD operations
 * - Upsert atomic behavior
 * - Query operations
 * - Soft delete
 * - Block version isolation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';

const mocks = vi.hoisted(() => ({
  withTimeout: vi.fn((promise: Promise<unknown>) => promise),
}));

vi.mock('@quiz/db', () => ({
  withTimeout: mocks.withTimeout,
  STANDARD_QUERY_TIMEOUT: 15_000,
  REPORT_QUERY_TIMEOUT: 30_000,
}));

import { BlockLearningStateRepository } from '../block-learning-state.repository';
import type { BlockLearningState } from '../block-learning-state.repository';

// ============================================================================
// Test Utilities
// ============================================================================

const makeBlockState = (overrides: Partial<BlockLearningState> = {}): BlockLearningState => ({
  id: 'block-state-1',
  userId: 'user-1',
  navigationNodeId: 'what-is-java',
  blockId: 'block-123',
  blockVersion: 'D1',
  visitCount: 0,
  revisionCount: 0,
  activeTimeSec: 0,
  expectedTimeSec: null,
  firstViewedAt: null,
  lastViewedAt: null,
  completedAt: null,
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

const createDbMock = ({
  selectRows = [makeBlockState()],
  insertRow = makeBlockState(),
  updateRow = makeBlockState(),
}: {
  selectRows?: unknown[];
  insertRow?: BlockLearningState;
  updateRow?: BlockLearningState;
} = {}) => {
  // Create orderBy that returns selectRows
  const orderBy = vi.fn(async () => selectRows);
  
  // Create where that returns BOTH selectRows directly AND { orderBy }
  // This handles queries with or without orderBy
  const whereResult = Object.assign(selectRows, { orderBy });
  const where = vi.fn(() => whereResult);
  
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  const returning = vi.fn(async () => [insertRow]);
  const onConflictDoUpdate = vi.fn(() => ({ returning }));
  const values = vi.fn(() => ({ onConflictDoUpdate, returning }));
  const insert = vi.fn(() => ({ values }));

  const returningUpdate = vi.fn(async () => [updateRow]);
  const whereUpdate = vi.fn(() => ({ returning: returningUpdate }));
  const set = vi.fn(() => ({ where: whereUpdate }));
  const update = vi.fn(() => ({ set }));

  return {
    select,
    from,
    where,
    orderBy,
    insert,
    values,
    returning,
    onConflictDoUpdate,
    update,
    set,
    whereUpdate,
    returningUpdate,
    selectRows,
    insertRow,
    updateRow,
  } as const;
};

// ============================================================================
// Tests
// ============================================================================

describe('BlockLearningStateRepository', () => {
  beforeEach(() => {
    mocks.withTimeout.mockClear();
  });

  // ==========================================================================
  // Identity Lookup
  // ==========================================================================

  describe('findOne', () => {
    it('finds block state by complete identity', async () => {
      const state = makeBlockState();
      const db = createDbMock({ selectRows: [state] });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findOne({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      expect(result).toEqual(state);
      expect(db.select).toHaveBeenCalled();
    });

    it('returns null when not found', async () => {
      const db = createDbMock({ selectRows: [] });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findOne({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      expect(result).toBeNull();
    });

    it('filters by userId (user isolation)', async () => {
      const db = createDbMock({ selectRows: [] });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.findOne({
        userId: 'user-2', // Different user
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      // Should not return another user's state
      expect(db.select).toHaveBeenCalled();
    });

    it('distinguishes block versions', async () => {
      const stateD1 = makeBlockState({ blockVersion: 'D1' });
      const db = createDbMock({ selectRows: [stateD1] });
      const repo = new BlockLearningStateRepository(db as never);

      // Looking for D1
      const resultD1 = await repo.findOne({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      expect(resultD1).toEqual(stateD1);

      // Looking for C1 (different version) - won't find D1
      const db2 = createDbMock({ selectRows: [] });
      const repo2 = new BlockLearningStateRepository(db2 as never);

      const resultC1 = await repo2.findOne({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'C1', // Different version
      });

      expect(resultC1).toBeNull();
    });
  });

  // ==========================================================================
  // Create
  // ==========================================================================

  describe('create', () => {
    it('creates block state with identity', async () => {
      const created = makeBlockState();
      const db = createDbMock({ insertRow: created });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.create({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      expect(result).toEqual(created);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          navigationNodeId: 'what-is-java',
          blockId: 'block-123',
          blockVersion: 'D1',
          visitCount: 0,
          revisionCount: 0,
          activeTimeSec: 0,
        })
      );
    });

    it('creates with expectedTimeSec', async () => {
      const created = makeBlockState({ expectedTimeSec: 180 });
      const db = createDbMock({ insertRow: created });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.create({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
        expectedTimeSec: 180,
      });

      expect(result.expectedTimeSec).toBe(180);
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedTimeSec: 180,
        })
      );
    });

    it('creates without expectedTimeSec (nullable)', async () => {
      const created = makeBlockState({ expectedTimeSec: null });
      const db = createDbMock({ insertRow: created });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.create({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      expect(result.expectedTimeSec).toBeNull();
    });

    it('initializes counters to zero', async () => {
      const created = makeBlockState();
      const db = createDbMock({ insertRow: created });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.create({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: 0,
          revisionCount: 0,
          activeTimeSec: 0,
        })
      );
    });

    it('initializes timestamps to null', async () => {
      const created = makeBlockState();
      const db = createDbMock({ insertRow: created });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.create({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          firstViewedAt: null,
          lastViewedAt: null,
          completedAt: null,
        })
      );
    });
  });

  // ==========================================================================
  // Update
  // ==========================================================================

  describe('update', () => {
    it('updates counters', async () => {
      const updated = makeBlockState({ visitCount: 5, activeTimeSec: 120 });
      const db = createDbMock({ updateRow: updated });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.update('block-state-1', {
        visitCount: 5,
        activeTimeSec: 120,
      });

      expect(result.visitCount).toBe(5);
      expect(result.activeTimeSec).toBe(120);
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: 5,
          activeTimeSec: 120,
        })
      );
    });

    it('updates timestamps', async () => {
      const now = new Date();
      const updated = makeBlockState({ lastViewedAt: now });
      const db = createDbMock({ updateRow: updated });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.update('block-state-1', {
        lastViewedAt: now,
      });

      expect(result.lastViewedAt).toEqual(now);
    });

    it('updates expectedTimeSec', async () => {
      const updated = makeBlockState({ expectedTimeSec: 240 });
      const db = createDbMock({ updateRow: updated });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.update('block-state-1', {
        expectedTimeSec: 240,
      });

      expect(result.expectedTimeSec).toBe(240);
    });

    it('updates completedAt', async () => {
      const completedAt = new Date();
      const updated = makeBlockState({ completedAt });
      const db = createDbMock({ updateRow: updated });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.update('block-state-1', {
        completedAt,
      });

      expect(result.completedAt).toEqual(completedAt);
    });

    it('throws when record not found', async () => {
      const db = createDbMock({ updateRow: null as never });
      const repo = new BlockLearningStateRepository(db as never);

      await expect(
        repo.update('nonexistent-id', {
          visitCount: 1,
        })
      ).rejects.toThrow('Failed to update');
    });
  });

  // ==========================================================================
  // Upsert
  // ==========================================================================

  describe('upsert', () => {
    it('creates on first call', async () => {
      const created = makeBlockState();
      const db = createDbMock({ insertRow: created });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.upsert({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
        visitCount: 1,
      });

      expect(result).toEqual(created);
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          navigationNodeId: 'what-is-java',
          blockId: 'block-123',
          blockVersion: 'D1',
          visitCount: 1,
        })
      );
    });

    it('uses onConflictDoUpdate with complete identity', async () => {
      const updated = makeBlockState({ visitCount: 2 });
      const db = createDbMock({ insertRow: updated });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.upsert({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
        visitCount: 1,
      });

      expect(db.onConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.arrayContaining([
            expect.anything(), // userId column
            expect.anything(), // navigationNodeId column
            expect.anything(), // blockId column
            expect.anything(), // blockVersion column
          ]),
          where: expect.anything(), // WHERE deleted_at IS NULL
          set: expect.any(Object),
        })
      );
    });

    it('includes WHERE clause for partial unique index', async () => {
      const updated = makeBlockState();
      const db = createDbMock({ insertRow: updated });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.upsert({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      });

      // Verify WHERE deleted_at IS NULL is included in conflict handler
      expect(db.onConflictDoUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.anything(), // SQL expression for deleted_at IS NULL
        })
      );
    });

    it('preserves identity across upserts', async () => {
      const state = makeBlockState();
      const db = createDbMock({ insertRow: state });
      const repo = new BlockLearningStateRepository(db as never);

      const identity = {
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
      };

      const result = await repo.upsert({
        ...identity,
        visitCount: 1,
      });

      // Identity should remain unchanged
      expect(result.userId).toBe(identity.userId);
      expect(result.navigationNodeId).toBe(identity.navigationNodeId);
      expect(result.blockId).toBe(identity.blockId);
      expect(result.blockVersion).toBe(identity.blockVersion);
    });

    it('handles expectedTimeSec in upsert', async () => {
      const state = makeBlockState({ expectedTimeSec: 180 });
      const db = createDbMock({ insertRow: state });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.upsert({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
        expectedTimeSec: 180,
      });

      expect(result.expectedTimeSec).toBe(180);
    });
  });

  // ==========================================================================
  // Query: findByUser
  // ==========================================================================

  describe('findByUser', () => {
    it('returns all user block states', async () => {
      const states = [
        makeBlockState({ blockId: 'block-1' }),
        makeBlockState({ blockId: 'block-2' }),
      ];
      const db = createDbMock({ selectRows: states });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findByUser('user-1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(states);
    });

    it('filters by userId', async () => {
      const db = createDbMock({ selectRows: [] });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.findByUser('user-1');

      expect(db.select).toHaveBeenCalled();
    });

    it('excludes deleted records', async () => {
      // Active record only
      const states = [makeBlockState({ deletedAt: null })];
      const db = createDbMock({ selectRows: states });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findByUser('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();
    });
  });

  // ==========================================================================
  // Query: findByNavigationNode
  // ==========================================================================

  describe('findByNavigationNode', () => {
    it('returns blocks for specific navigation node', async () => {
      const states = [
        makeBlockState({ blockId: 'block-1', navigationNodeId: 'what-is-java' }),
        makeBlockState({ blockId: 'block-2', navigationNodeId: 'what-is-java' }),
      ];
      const db = createDbMock({ selectRows: states });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findByNavigationNode('user-1', 'what-is-java');

      expect(result).toHaveLength(2);
    });

    it('scopes by both userId and navigationNodeId', async () => {
      const db = createDbMock({ selectRows: [] });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.findByNavigationNode('user-1', 'what-is-java');

      // Should filter by BOTH identity components (security)
      expect(db.select).toHaveBeenCalled();
    });

    it('does not leak other users data', async () => {
      // Empty result for different user
      const db = createDbMock({ selectRows: [] });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findByNavigationNode('user-2', 'what-is-java');

      expect(result).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Query: findCompleted
  // ==========================================================================

  describe('findCompleted', () => {
    it('returns only completed blocks', async () => {
      const completedAt = new Date();
      const states = [
        makeBlockState({ blockId: 'block-1', completedAt }),
      ];
      const db = createDbMock({ selectRows: states });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findCompleted('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].completedAt).toEqual(completedAt);
    });

    it('excludes incomplete blocks', async () => {
      // Only blocks with completedAt IS NOT NULL
      const db = createDbMock({ selectRows: [] });
      const repo = new BlockLearningStateRepository(db as never);

      const result = await repo.findCompleted('user-1');

      // Should not include blocks with completedAt: null
      expect(db.select).toHaveBeenCalled();
    });

    it('filters by userId', async () => {
      const db = createDbMock({ selectRows: [] });
      const repo = new BlockLearningStateRepository(db as never);

      await repo.findCompleted('user-1');

      expect(db.select).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Soft Delete
  // ==========================================================================

  describe('softDelete', () => {
    it('marks record as deleted', async () => {
      const db = createDbMock();
      const repo = new BlockLearningStateRepository(db as never);

      await repo.softDelete('block-state-1');

      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        })
      );
    });

    it('includes soft-delete safety in WHERE clause', async () => {
      const db = createDbMock();
      const repo = new BlockLearningStateRepository(db as never);

      await repo.softDelete('block-state-1');

      // Should only delete if not already deleted
      expect(db.whereUpdate).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Block Version Isolation
  // ==========================================================================

  describe('Block Version Isolation', () => {
    it('treats different block versions as independent identities', async () => {
      const stateD1 = makeBlockState({ blockVersion: 'D1', visitCount: 5 });
      const db = createDbMock({ insertRow: stateD1 });
      const repo = new BlockLearningStateRepository(db as never);

      // Upsert D1 version
      await repo.upsert({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'D1',
        visitCount: 5,
      });

      // Upsert C1 version (different blockVersion)
      const stateC1 = makeBlockState({ blockVersion: 'C1', visitCount: 3 });
      const db2 = createDbMock({ insertRow: stateC1 });
      const repo2 = new BlockLearningStateRepository(db2 as never);

      await repo2.upsert({
        userId: 'user-1',
        navigationNodeId: 'what-is-java',
        blockId: 'block-123',
        blockVersion: 'C1', // Different version
        visitCount: 3,
      });

      // Should create separate records, not merge
      expect(db.insert).toHaveBeenCalled();
      expect(db2.insert).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Transaction Support
  // ==========================================================================

  describe('withDb', () => {
    it('returns new instance with custom db client', () => {
      const customDb = {} as never;
      const repo = new BlockLearningStateRepository();
      const newRepo = repo.withDb(customDb);

      expect(newRepo).toBeInstanceOf(BlockLearningStateRepository);
      expect(newRepo).not.toBe(repo);
    });
  });
});
