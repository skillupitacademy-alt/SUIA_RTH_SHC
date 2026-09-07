/**
 * Phase 4.6: Block Learning State Repository - PostgreSQL Integration Tests
 * 
 * Tests atomic session-aware visit/revision tracking under concurrent requests.
 * 
 * REQUIRES: Real PostgreSQL database connection
 * 
 * SCOPE:
 * - Concurrent same-session requests (should NOT double-count)
 * - Concurrent session transition requests (should increment exactly once)
 * - Concurrent revision counting (completed blocks)
 * - Partial unique index conflict handling (targetWhere)
 * 
 * Phase 4.6 Guarantees:
 * - Multiple concurrent requests with same sessionId → visitCount increments by 1 (not N)
 * - Session transition under concurrency → exactly one visit increment
 * - Revision counting under concurrency → exactly one revision increment
 * - firstViewedAt initialized atomically on first visit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BlockLearningStateRepository } from '../block-learning-state.repository';
import type { BlockIdentity } from '../block-learning-state.repository';

describe('BlockLearningStateRepository - PostgreSQL Integration (Phase 4.6)', () => {
  let repository: BlockLearningStateRepository;
  
  const testIdentity: BlockIdentity = {
    userId: '550e8400-e29b-41d4-a716-446655440000', // UUID v4 format
    navigationNodeId: 'test-node-integration',
    blockId: 'test-block-integration',
    blockVersion: 'D1',
  };

  beforeEach(() => {
    repository = new BlockLearningStateRepository();
  });

  // ==========================================================================
  // CONCURRENT SAME-SESSION TESTS
  // ==========================================================================

  describe('Concurrent same-session requests', () => {
    it('handles 5 concurrent same-session visits atomically (visitCount = 1)', async () => {
      // 5 concurrent upserts, all with same new sessionId
      // Expected: visitCount should be 1 (first visit), NOT 5
      const results = await Promise.all([
        repository.upsert({ ...testIdentity, lastSessionId: 'session-concurrent-1', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-concurrent-1', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-concurrent-1', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-concurrent-1', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-concurrent-1', lastViewedAt: new Date() }),
      ]);

      // All results should reflect the same final state
      const final = await repository.findOne(testIdentity);
      
      expect(final).toBeDefined();
      expect(final!.visitCount).toBe(1); // NOT 5 - atomic session tracking
      expect(final!.lastSessionId).toBe('session-concurrent-1');
      expect(final!.revisionCount).toBe(0);
      expect(final!.firstViewedAt).toBeInstanceOf(Date); // Initialized atomically
      
      // All concurrent results should have visitCount=1 (eventual consistency)
      // Some may show intermediate states due to race, but final state is correct
      expect(results.every(r => r.visitCount >= 1)).toBe(true);
    });

    it('handles concurrent same-session after initial visit (no increment)', async () => {
      // Initial visit
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        lastViewedAt: new Date(),
      });

      const initial = await repository.findOne(testIdentity);
      expect(initial!.visitCount).toBe(1);

      // 3 concurrent same-session requests
      await Promise.all([
        repository.upsert({ ...testIdentity, lastSessionId: 'session-A', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-A', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-A', lastViewedAt: new Date() }),
      ]);

      const final = await repository.findOne(testIdentity);
      expect(final!.visitCount).toBe(1); // No increment - same session
      expect(final!.lastSessionId).toBe('session-A');
    });
  });

  // ==========================================================================
  // CONCURRENT SESSION TRANSITION TESTS
  // ==========================================================================

  describe('Concurrent session transition', () => {
    it('increments visit exactly once for session transition under concurrency', async () => {
      // Initial visit with session-A
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        lastViewedAt: new Date(),
      });

      const initial = await repository.findOne(testIdentity);
      expect(initial!.visitCount).toBe(1);
      expect(initial!.lastSessionId).toBe('session-A');

      // 4 concurrent requests with session-B (new session)
      await Promise.all([
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
      ]);

      const final = await repository.findOne(testIdentity);
      expect(final!.visitCount).toBe(2); // 1 + 1, NOT 1 + 4
      expect(final!.lastSessionId).toBe('session-B');
      expect(final!.revisionCount).toBe(0); // Not completed
    });

    it('handles multiple sequential session transitions correctly', async () => {
      // Session A
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        lastViewedAt: new Date(),
      });

      let state = await repository.findOne(testIdentity);
      expect(state!.visitCount).toBe(1);

      // Session B (sequential, not concurrent)
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-B',
        lastViewedAt: new Date(),
      });

      state = await repository.findOne(testIdentity);
      expect(state!.visitCount).toBe(2);

      // Session C
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-C',
        lastViewedAt: new Date(),
      });

      state = await repository.findOne(testIdentity);
      expect(state!.visitCount).toBe(3);
      expect(state!.lastSessionId).toBe('session-C');
    });
  });

  // ==========================================================================
  // CONCURRENT REVISION COUNTING TESTS
  // ==========================================================================

  describe('Concurrent revision counting (completed blocks)', () => {
    it('increments revision exactly once when completed block visited in new session', async () => {
      // Initial visit + mark completed
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        completedAt: new Date(),
        lastViewedAt: new Date(),
      });

      const initial = await repository.findOne(testIdentity);
      expect(initial!.visitCount).toBe(1);
      expect(initial!.completedAt).toBeInstanceOf(Date);

      // 3 concurrent requests with new session (should increment revision once)
      await Promise.all([
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
      ]);

      const final = await repository.findOne(testIdentity);
      expect(final!.visitCount).toBe(2); // Visit incremented
      expect(final!.revisionCount).toBe(1); // Revision incremented once, NOT 3
      expect(final!.lastSessionId).toBe('session-B');
    });

    it('does NOT increment revision for incomplete block in new session', async () => {
      // Initial visit (NOT completed)
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        lastViewedAt: new Date(),
      });

      const initial = await repository.findOne(testIdentity);
      expect(initial!.visitCount).toBe(1);
      expect(initial!.completedAt).toBeNull();

      // New session, still not completed
      await Promise.all([
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-B', lastViewedAt: new Date() }),
      ]);

      const final = await repository.findOne(testIdentity);
      expect(final!.visitCount).toBe(2); // Visit incremented
      expect(final!.revisionCount).toBe(0); // NOT incremented - not completed
    });

    it('handles multiple revision increments across different sessions', async () => {
      // Initial visit + complete
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        completedAt: new Date(),
        lastViewedAt: new Date(),
      });

      let state = await repository.findOne(testIdentity);
      expect(state!.visitCount).toBe(1);
      expect(state!.revisionCount).toBe(0);

      // Session B - first revision
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-B',
        lastViewedAt: new Date(),
      });

      state = await repository.findOne(testIdentity);
      expect(state!.visitCount).toBe(2);
      expect(state!.revisionCount).toBe(1);

      // Session C - second revision
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-C',
        lastViewedAt: new Date(),
      });

      state = await repository.findOne(testIdentity);
      expect(state!.visitCount).toBe(3);
      expect(state!.revisionCount).toBe(2);
      expect(state!.lastSessionId).toBe('session-C');
    });
  });

  // ==========================================================================
  // FIRST VIEWED AT TESTS
  // ==========================================================================

  describe('Atomic firstViewedAt initialization', () => {
    it('initializes firstViewedAt atomically on first visit', async () => {
      const beforeTime = new Date();

      // 3 concurrent first visits
      await Promise.all([
        repository.upsert({ ...testIdentity, lastSessionId: 'session-new', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-new', lastViewedAt: new Date() }),
        repository.upsert({ ...testIdentity, lastSessionId: 'session-new', lastViewedAt: new Date() }),
      ]);

      const afterTime = new Date();
      const final = await repository.findOne(testIdentity);

      expect(final!.firstViewedAt).toBeInstanceOf(Date);
      expect(final!.firstViewedAt!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(final!.firstViewedAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('preserves firstViewedAt on subsequent visits', async () => {
      // Initial visit
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        lastViewedAt: new Date(),
      });

      const initial = await repository.findOne(testIdentity);
      const originalFirstViewedAt = initial!.firstViewedAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // New session
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-B',
        lastViewedAt: new Date(),
      });

      const final = await repository.findOne(testIdentity);
      expect(final!.firstViewedAt).toEqual(originalFirstViewedAt); // Preserved
    });
  });

  // ==========================================================================
  // PARTIAL UNIQUE INDEX TESTS (targetWhere)
  // ==========================================================================

  describe('Partial unique index with targetWhere', () => {
    it('allows creating new record after soft-delete', async () => {
      // Create initial record
      const first = await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        lastViewedAt: new Date(),
      });

      expect(first.visitCount).toBe(1);

      // Soft delete
      await repository.softDelete(first.id);

      const afterDelete = await repository.findOne(testIdentity);
      expect(afterDelete).toBeNull(); // Soft-deleted records not returned by findOne

      // Create new record with same identity (should work due to partial index)
      const second = await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-B',
        lastViewedAt: new Date(),
      });

      expect(second.id).not.toBe(first.id); // New record
      expect(second.visitCount).toBe(1); // Fresh start
      expect(second.lastSessionId).toBe('session-B');
    });
  });

  // ==========================================================================
  // ACTIVE TIME ISOLATION TEST
  // ==========================================================================

  describe('Active time does not affect visit/session state', () => {
    it('updates activeTimeSec without modifying visitCount or lastSessionId', async () => {
      // Initial visit
      await repository.upsert({
        ...testIdentity,
        lastSessionId: 'session-A',
        lastViewedAt: new Date(),
      });

      const initial = await repository.findOne(testIdentity);
      expect(initial!.visitCount).toBe(1);
      expect(initial!.activeTimeSec).toBe(0);

      // Record active time (without lastSessionId - simulates recordBlockActiveTime call)
      await repository.upsert({
        ...testIdentity,
        activeTimeSec: 30,
        lastViewedAt: new Date(),
      });

      const afterTime = await repository.findOne(testIdentity);
      expect(afterTime!.visitCount).toBe(1); // Unchanged
      expect(afterTime!.lastSessionId).toBe('session-A'); // Unchanged
      expect(afterTime!.activeTimeSec).toBe(30); // Updated

      // Another active time update
      await repository.upsert({
        ...testIdentity,
        activeTimeSec: 45,
        lastViewedAt: new Date(),
      });

      const final = await repository.findOne(testIdentity);
      expect(final!.visitCount).toBe(1); // Still unchanged
      expect(final!.lastSessionId).toBe('session-A'); // Still unchanged
      expect(final!.activeTimeSec).toBe(75); // Accumulated (30 + 45)
    });
  });
});
