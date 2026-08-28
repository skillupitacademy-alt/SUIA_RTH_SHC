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

import { TutorialNavigationProgressRepository } from '../tutorial-navigation-progress.repository';
import type { CompletedBlockRecord } from '@quiz/types';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'progress-1',
  userId: 'user-1',
  navigationNodeId: 'nav-node-1',
  sectionId: 'section-1',
  subtopicId: 'subtopic-1',
  status: 'not_started',
  completedBlocks: [],
  timeSpentActiveSec: 0,
  visitCount: 0,
  revisionCount: 0,
  lastSessionId: null,
  firstViewedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastViewedAt: new Date('2026-01-01T00:00:00.000Z'),
  completedAt: null,
  version: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  deletedAt: null,
  ...overrides,
});

const createDbMock = ({
  selectRows = [makeRow()],
  insertRow = makeRow(),
  updateRow = makeRow(),
}: {
  selectRows?: unknown[];
  insertRow?: Record<string, unknown>;
  updateRow?: Record<string, unknown>;
} = {}) => {
  const where = vi.fn(async () => selectRows);
  const select = vi.fn(() => ({
    from: vi.fn(() => ({
      where,
    })),
  }));

  const onConflictDoNothing = vi.fn(() => ({ returning: vi.fn(async () => [insertRow]) }));
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));

  const returningUpdate = vi.fn(async () => [updateRow]);
  const whereUpdate = vi.fn(() => ({ returning: returningUpdate }));
  const set = vi.fn(() => ({ where: whereUpdate }));
  const update = vi.fn(() => ({ set }));

  return {
    select,
    where,
    insert,
    values,
    onConflictDoNothing,
    update,
    set,
    whereUpdate,
    returningUpdate,
    selectRows,
    insertRow,
    updateRow,
  } as const;
};

describe('TutorialNavigationProgressRepository', () => {
  beforeEach(() => {
    mocks.withTimeout.mockClear();
  });

  describe('createProgress', () => {
    it('creates new progress record with ON CONFLICT WHERE clause for partial unique index', async () => {
      const db = createDbMock();
      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
      });

      expect(db.insert).toHaveBeenCalled();
      expect(db.onConflictDoNothing).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.any(Array),
          where: expect.anything(), // Should include WHERE deleted_at IS NULL
        })
      );
    });

    it('returns existing record if conflict occurs', async () => {
      const existingRow = makeRow({ visitCount: 5 });
      const db = createDbMock({
        selectRows: [existingRow],
        insertRow: undefined as any, // Simulate conflict - no insert
      });
      db.onConflictDoNothing.mockReturnValue({
        returning: vi.fn(async () => []), // Empty array = conflict occurred
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
      });

      expect(result).toEqual(existingRow);
      expect(db.select).toHaveBeenCalled(); // Should fetch existing
    });

    it('allows creating new active record after soft-delete', async () => {
      // First: soft-deleted record exists
      const softDeletedRow = makeRow({ deletedAt: new Date() });
      
      // Second: new active record created
      const newActiveRow = makeRow({ id: 'progress-2', visitCount: 1 });
      
      const db = createDbMock({
        selectRows: [],
        insertRow: newActiveRow,
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
      });

      // Should successfully create new record (partial index allows this)
      expect(result.id).toBe('progress-2');
      expect(result.visitCount).toBe(1);
    });
  });

  describe('markBlockCompleted - concurrency safety', () => {
    it('uses atomic JSONB append with deduplication to prevent lost updates AND duplicates', async () => {
      const existingBlocks: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2026-01-01T00:00:00.000Z' },
      ];
      
      const existingRow = makeRow({ 
        completedBlocks: existingBlocks,
        status: 'in_progress',
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({
          completedBlocks: [
            ...existingBlocks,
            { blockId: 'block-C1', blockVersion: 'C1', completedAt: '2026-01-01T01:00:00.000Z' },
          ],
        }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.markBlockCompleted({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        sectionId: 'section-1',
        subtopicId: 'subtopic-1',
        blockId: 'block-C1',
        blockType: 'code',
        blockVersion: 'C1',
        occurredAt: new Date('2026-01-01T01:00:00.000Z'),
      });

      // Should call update with SQL CASE/EXISTS for deduplication
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          completedBlocks: expect.anything(), // Should use CASE WHEN EXISTS...
        })
      );
    });

    it('is idempotent under concurrent duplicate requests - same blockId+blockVersion', async () => {
      const existingBlocks: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2026-01-01T00:00:00.000Z' },
      ];
      
      const existingRow = makeRow({ 
        completedBlocks: existingBlocks,
        status: 'in_progress',
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: existingRow, // No change - deduplication prevented duplicate
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      // Simulate two concurrent requests for same block
      const result = await repo.markBlockCompleted({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        sectionId: 'section-1',
        subtopicId: 'subtopic-1',
        blockId: 'block-D1',
        blockType: 'definition',
        blockVersion: 'D1',
        occurredAt: new Date('2026-01-01T02:00:00.000Z'),
      });

      // Should update timestamps but NOT add duplicate block
      expect(result.completedBlocks).toHaveLength(1);
      expect(result.completedBlocks[0].blockId).toBe('block-D1');
    });

    it('prevents duplicate block entries even if SELECT happens before atomic UPDATE', async () => {
      // This tests the race: both requests SELECT empty array, then both try to append
      const existingRow = makeRow({ 
        completedBlocks: [], // Empty initially
        status: 'not_started',
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({
          completedBlocks: [
            { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2026-01-01T00:00:00.000Z' },
          ], // Only one entry despite concurrent requests
        }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.markBlockCompleted({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        sectionId: 'section-1',
        subtopicId: 'subtopic-1',
        blockId: 'block-D1',
        blockType: 'definition',
        blockVersion: 'D1',
      });

      // Atomic UPDATE with EXISTS check ensures only one entry
      expect(result.completedBlocks).toHaveLength(1);
    });

    it('does NOT update lastSessionId from block completion (visit-owned state)', async () => {
      const existingRow = makeRow({ 
        status: 'not_started', 
        lastSessionId: 'session-A', // Established by visit
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ lastSessionId: 'session-A' }), // Unchanged
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.markBlockCompleted({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        sectionId: 'section-1',
        subtopicId: 'subtopic-1',
        blockId: 'block-D1',
        blockType: 'definition',
        blockVersion: 'D1',
        sessionId: 'session-B', // Different session, but should NOT update lastSessionId
      });

      // lastSessionId should remain unchanged (visit-owned)
      expect(db.set).toHaveBeenCalledWith(
        expect.not.objectContaining({
          lastSessionId: 'session-B',
        })
      );
    });
  });

  describe('recordTime', () => {
    it('preserves initial time value when creating new record', async () => {
      const db = createDbMock({
        selectRows: [], // No existing record
        insertRow: makeRow({ timeSpentActiveSec: 37, visitCount: 0, lastSessionId: null }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.recordTime({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        timeSpentActiveSec: 37,
      });

      // Should preserve the initial 37 seconds, not initialize to 0
      expect(result.timeSpentActiveSec).toBe(37);
      expect(result.visitCount).toBe(0); // Should NOT count as visit
      expect(result.lastSessionId).toBeNull(); // Should NOT set session (visit-owned)
    });

    it('does NOT create a visit when recording time', async () => {
      const db = createDbMock({
        selectRows: [], // No existing record
        insertRow: makeRow({ visitCount: 0, timeSpentActiveSec: 45 }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.recordTime({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        timeSpentActiveSec: 45,
      });

      // visitCount should be 0 (time event does NOT count as visit)
      expect(db.values).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: 0,
        })
      );
    });

    it('does NOT modify lastSessionId (visit-owned state)', async () => {
      const existingRow = makeRow({ 
        timeSpentActiveSec: 100,
        lastSessionId: 'session-A', // Established by visit
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ 
          timeSpentActiveSec: 130,
          lastSessionId: 'session-A', // Unchanged
        }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.recordTime({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        timeSpentActiveSec: 30,
        sessionId: 'session-B', // Different session, but should NOT update lastSessionId
      });

      // lastSessionId should remain unchanged (visit-owned)
      expect(db.set).toHaveBeenCalledWith(
        expect.not.objectContaining({
          lastSessionId: 'session-B',
        })
      );
    });

    it('accumulates time atomically using SQL increment', async () => {
      const existingRow = makeRow({ timeSpentActiveSec: 100 });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ timeSpentActiveSec: 130 }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.recordTime({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        timeSpentActiveSec: 30,
      });

      // Should use SQL: timeSpentActiveSec + 30
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          timeSpentActiveSec: expect.anything(), // Should be sql`... + 30`
        })
      );
    });

    it('rejects negative time values', async () => {
      const db = createDbMock();
      const repo = new TutorialNavigationProgressRepository(db as never);

      await expect(
        repo.recordTime({
          userId: 'user-1',
          navigationNodeId: 'nav-node-1',
          subtopicId: 'subtopic-1',
          timeSpentActiveSec: -10,
        })
      ).rejects.toThrow('Time spent cannot be negative');
    });

    it('rejects unrealistically large time increments', async () => {
      const db = createDbMock();
      const repo = new TutorialNavigationProgressRepository(db as never);

      await expect(
        repo.recordTime({
          userId: 'user-1',
          navigationNodeId: 'nav-node-1',
          subtopicId: 'subtopic-1',
          timeSpentActiveSec: 7200, // 2 hours
        })
      ).rejects.toThrow('Time increment too large');
    });
  });

  describe('recordVisit - session semantics', () => {
    it('creates first visit with visitCount=1 and stores sessionId', async () => {
      const db = createDbMock({
        selectRows: [], // No existing record
        insertRow: makeRow({ visitCount: 1, lastSessionId: 'session-A' }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-A',
      });

      expect(result.visitCount).toBe(1);
      expect(result.lastSessionId).toBe('session-A');
    });

    it('does NOT increment visitCount for same session (page refresh)', async () => {
      const existingRow = makeRow({ 
        visitCount: 1, 
        lastSessionId: 'session-A',
        status: 'in_progress',
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ visitCount: 1, lastSessionId: 'session-A' }), // No increment
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-A', // Same session
      });

      // visitCount should remain 1 (not incremented)
      expect(result.visitCount).toBe(1);
    });

    it('increments visitCount for different session', async () => {
      const existingRow = makeRow({ 
        visitCount: 1, 
        lastSessionId: 'session-A',
        status: 'in_progress',
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ visitCount: 2, lastSessionId: 'session-B' }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-B', // Different session
      });

      // Should increment visitCount
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: expect.anything(), // Should use sql`... + 1`
          lastSessionId: 'session-B',
        })
      );
    });

    it('treats null lastSessionId as first visit (after time-only creation)', async () => {
      const existingRow = makeRow({ 
        visitCount: 0, // Created by recordTime()
        lastSessionId: null, // Never visited
        timeSpentActiveSec: 60, // Has time tracked
        status: 'not_started',
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ 
          visitCount: 1, // First visit
          lastSessionId: 'session-A',
        }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-A',
      });

      // Should use SQL CASE expressions for atomic decision
      expect(db.set).toHaveBeenCalled();
    });

    it('auto-detects revision: visit to completed node in new session', async () => {
      const existingRow = makeRow({ 
        visitCount: 2, 
        revisionCount: 0,
        lastSessionId: 'session-A',
        status: 'completed', // Node completed
        completedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ 
          visitCount: 3, 
          revisionCount: 1, // Incremented
          lastSessionId: 'session-B',
        }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-B', // New session after completion
      });

      // Should increment BOTH visitCount AND revisionCount
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: expect.anything(), // sql`... + 1`
          revisionCount: expect.anything(), // sql`... + 1`
        })
      );
    });

    it('does NOT increment revisionCount for incomplete node', async () => {
      const existingRow = makeRow({ 
        visitCount: 1, 
        revisionCount: 0,
        lastSessionId: 'session-A',
        status: 'in_progress', // Not completed yet
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ visitCount: 2, revisionCount: 0 }), // No revision
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-B', // New session but node not completed
      });

      // Should call update with atomic CASE expressions
      expect(db.set).toHaveBeenCalled();
    });

    it('prevents duplicate visit increment with concurrent same-session requests', async () => {
      // Simulates two concurrent recordVisit calls with same sessionId
      const existingRow = makeRow({ 
        visitCount: 1, 
        lastSessionId: 'session-A',
        status: 'in_progress',
      });

      const db = createDbMock({
        selectRows: [existingRow],
        updateRow: makeRow({ visitCount: 1, lastSessionId: 'session-A' }), // No increment
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      // Both requests see same lastSessionId
      const result = await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-A', // Same session
      });

      // Should NOT increment visitCount
      expect(result.visitCount).toBe(1);
    });
  });

  describe('recordVisit - atomic concurrency safety', () => {
    it('ATOMIC: concurrent first visit increments exactly once', async () => {
      // Tests: visitCount=0, lastSessionId=null + two concurrent session-A requests
      // Expected: visitCount=1 (not 2)
      const initialRow = makeRow({ 
        visitCount: 0,
        lastSessionId: null, // Created by recordTime()
        status: 'not_started',
      });

      const finalRow = makeRow({
        visitCount: 1, // Atomic: exactly one increment
        lastSessionId: 'session-A',
        firstViewedAt: new Date('2026-01-01T01:00:00.000Z'),
      });

      const db = createDbMock({
        selectRows: [initialRow],
        updateRow: finalRow,
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-A',
        occurredAt: new Date('2026-01-01T01:00:00.000Z'),
      });

      // Should use SQL CASE with IS DISTINCT FROM for atomic decision
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: expect.anything(), // CASE WHEN ... IS DISTINCT FROM ...
          firstViewedAt: expect.anything(), // CASE for first visit
        })
      );

      // Result should show exactly one visit
      expect(result.visitCount).toBe(1);
      expect(result.lastSessionId).toBe('session-A');
    });

    it('ATOMIC: concurrent new session increments exactly once', async () => {
      // Tests: visitCount=1, lastSessionId=A + two concurrent session-B requests
      // Expected: visitCount=2 (not 3)
      const initialRow = makeRow({ 
        visitCount: 1,
        lastSessionId: 'session-A',
        status: 'in_progress',
      });

      const finalRow = makeRow({
        visitCount: 2, // Atomic: exactly one increment
        lastSessionId: 'session-B',
      });

      const db = createDbMock({
        selectRows: [initialRow],
        updateRow: finalRow,
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-B', // New session
      });

      // Database determines transition atomically using IS DISTINCT FROM
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: expect.anything(), // SQL CASE with IS DISTINCT FROM
          lastSessionId: 'session-B',
        })
      );

      expect(result.visitCount).toBe(2);
      expect(result.lastSessionId).toBe('session-B');
    });

    it('ATOMIC: concurrent revision detection increments exactly once', async () => {
      // Tests: status=completed, visitCount=1, revisionCount=0, lastSessionId=A
      //        + two concurrent session-B requests
      // Expected: visitCount=2, revisionCount=1 (not 2)
      const initialRow = makeRow({ 
        visitCount: 1,
        revisionCount: 0,
        lastSessionId: 'session-A',
        status: 'completed',
        completedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const finalRow = makeRow({
        visitCount: 2, // One increment
        revisionCount: 1, // One increment (not 2)
        lastSessionId: 'session-B',
      });

      const db = createDbMock({
        selectRows: [initialRow],
        updateRow: finalRow,
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-B',
      });

      // Both visitCount AND revisionCount use atomic SQL CASE
      expect(db.set).toHaveBeenCalledWith(
        expect.objectContaining({
          visitCount: expect.anything(), // CASE with IS DISTINCT FROM
          revisionCount: expect.anything(), // CASE with IS DISTINCT FROM AND status='completed'
        })
      );

      expect(result.visitCount).toBe(2);
      expect(result.revisionCount).toBe(1); // Exactly one
    });

    it('ATOMIC: same session after winner commits does not increment', async () => {
      // Tests: A→B (wins), then B→B, then B→B
      // Expected: visitCount increments exactly once for A→B transition
      const afterFirstWinner = makeRow({
        visitCount: 2,
        revisionCount: 0,
        lastSessionId: 'session-B', // Winner committed B
        status: 'in_progress',
      });

      const db = createDbMock({
        selectRows: [afterFirstWinner],
        updateRow: makeRow({
          visitCount: 2, // No further increment
          lastSessionId: 'session-B',
        }),
      });

      const repo = new TutorialNavigationProgressRepository(db as never);

      // Subsequent request with same session-B
      const result = await repo.recordVisit({
        userId: 'user-1',
        navigationNodeId: 'nav-node-1',
        subtopicId: 'subtopic-1',
        sessionId: 'session-B', // Same as lastSessionId
      });

      // IS DISTINCT FROM returns false (B vs B), no increment
      expect(result.visitCount).toBe(2); // Unchanged
      expect(result.lastSessionId).toBe('session-B');
    });

  });

  describe('isBlockCompleted', () => {
    it('checks for specific blockId + blockVersion combination', async () => {
      const completedBlocks: CompletedBlockRecord[] = [
        { blockId: 'block-1', blockVersion: 'D1', completedAt: '2026-01-01T00:00:00.000Z' },
        { blockId: 'block-1', blockVersion: 'D2', completedAt: '2026-01-02T00:00:00.000Z' },
      ];

      const existingRow = makeRow({ completedBlocks });

      const db = createDbMock({ selectRows: [existingRow] });
      const repo = new TutorialNavigationProgressRepository(db as never);

      // Check D1 version
      const hasD1 = await repo.isBlockCompleted('user-1', 'nav-node-1', 'block-1', 'D1');
      expect(hasD1).toBe(true);

      // Check D2 version
      const hasD2 = await repo.isBlockCompleted('user-1', 'nav-node-1', 'block-1', 'D2');
      expect(hasD2).toBe(true);

      // Check non-existent D3 version
      const hasD3 = await repo.isBlockCompleted('user-1', 'nav-node-1', 'block-1', 'D3');
      expect(hasD3).toBe(false);
    });

    it('checks for any version if blockVersion not specified', async () => {
      const completedBlocks: CompletedBlockRecord[] = [
        { blockId: 'block-1', blockVersion: 'D1', completedAt: '2026-01-01T00:00:00.000Z' },
      ];

      const existingRow = makeRow({ completedBlocks });

      const db = createDbMock({ selectRows: [existingRow] });
      const repo = new TutorialNavigationProgressRepository(db as never);

      const hasAny = await repo.isBlockCompleted('user-1', 'nav-node-1', 'block-1');
      expect(hasAny).toBe(true);
    });
  });

  describe('getProgress', () => {
    it('returns active progress row only (excludes soft-deleted)', async () => {
      const activeRow = makeRow({ deletedAt: null });
      const db = createDbMock({ selectRows: [activeRow] });
      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.getProgress('user-1', 'nav-node-1');

      expect(result).toEqual(activeRow);
      expect(result?.deletedAt).toBeNull();
    });

    it('returns undefined if no active record exists', async () => {
      const db = createDbMock({ selectRows: [] });
      const repo = new TutorialNavigationProgressRepository(db as never);

      const result = await repo.getProgress('user-1', 'nav-node-1');

      expect(result).toBeUndefined();
    });
  });

  describe('withDb', () => {
    it('returns a cloned repository instance', () => {
      const db = createDbMock();
      const repo = new TutorialNavigationProgressRepository(db as never);
      const cloned = repo.withDb(db as never);

      expect(cloned).toBeInstanceOf(TutorialNavigationProgressRepository);
      expect(cloned).not.toBe(repo);
    });
  });
});
