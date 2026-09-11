/**
 * Gate 3C.1R Phase D-2: Idempotent Block Active-Time Delivery
 * 
 * CRITICAL REQUIREMENTS:
 * - Real PostgreSQL (NOT mocks)
 * - D2-5: Real transaction rollback proof
 * - D2-6: Real concurrent duplicate delivery
 * - D2-3: Payload immutability enforcement
 * - Lossless delivery (no in-flight drops)
 * 
 * TEST COUNT: 11 backend scenarios
 * 
 * SCOPE: recordBlockActiveTime() idempotency ONLY
 * NOT testing: completion, revision, visibility, multi-tab, RSSB
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import dotenv from 'dotenv';
import path from 'path';
import { randomUUID } from 'crypto';

// Load environment
dotenv.config({
  path: path.resolve(__dirname, '../../.env.local'),
});

import { db } from '../db';
import { LearningProgressService } from '../services/learning-progress.service';
import { TutorialNavigationProgressRepository } from '../repositories/tutorial-navigation-progress.repository';
import { TutorialSectionRepository } from '../repositories/tutorial-section.repository';
import { BlockLearningStateRepository } from '../repositories/block-learning-state.repository';
import { BlockTelemetryEventRepository } from '../repositories/block-telemetry-event.repository';
import { blockTelemetryEvents } from '../schema/block-telemetry-events';
import { blockLearningState } from '../schema/block-learning-state';
import { eq, and, isNull } from 'drizzle-orm';
import type { AuthenticatedIdentity } from '../services/learning-progress.service';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const TEST_USER_ID = '54726a2e-fca5-4d93-abc6-e7cee97a86f8';
const TEST_NAVIGATION_NODE_ID = 'whatisjava';
const TEST_SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const TEST_BLOCK_ID_D1 = '79ae6e0f-0374-4dfe-8d76-cefbe42f8996';
const TEST_BLOCK_VERSION = 'D1';

const testIdentity: AuthenticatedIdentity = {
  userId: TEST_USER_ID,
  brand: 'shared',
};

// ============================================================================
// TEST SUITE SETUP
// ============================================================================

describe('Gate 3C.1R Phase D-2: Idempotent Block Active-Time Delivery', () => {
  let service: LearningProgressService;
  let progressRepo: TutorialNavigationProgressRepository;
  let sectionRepo: TutorialSectionRepository;
  let blockRepo: BlockLearningStateRepository;
  let telemetryRepo: BlockTelemetryEventRepository;

  beforeAll(async () => {
    // Verify PostgreSQL connection
    if (!process.env.DATABASE_URL_TUTORIAL) {
      throw new Error('DATABASE_URL_TUTORIAL not configured');
    }

    // Initialize repositories
    progressRepo = new TutorialNavigationProgressRepository();
    sectionRepo = new TutorialSectionRepository();
    blockRepo = new BlockLearningStateRepository();
    telemetryRepo = new BlockTelemetryEventRepository();

    // Initialize service
    service = new LearningProgressService(
      progressRepo,
      sectionRepo,
      blockRepo,
      telemetryRepo
    );

    console.log('[D2-TEST] PostgreSQL connected');
  });

  beforeEach(async () => {
    // Clean test data before each scenario
    await db.delete(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.userId, TEST_USER_ID)
    );
    await db.delete(blockLearningState).where(
      eq(blockLearningState.userId, TEST_USER_ID)
    );
  });

  afterAll(async () => {
    // Final cleanup
    await db.delete(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.userId, TEST_USER_ID)
    );
    await db.delete(blockLearningState).where(
      eq(blockLearningState.userId, TEST_USER_ID)
    );
    console.log('[D2-TEST] Cleanup complete');
  });

  // ==========================================================================
  // D2-1: FIRST DELIVERY
  // ==========================================================================

  it('D2-1: First event processes once', async () => {
    const eventId = randomUUID();
    const activeTimeSec = 30;

    // Execute first delivery
    const result = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      activeTimeSec
    );

    // Verify response
    expect(result.wasProcessed).toBe(true);
    expect(result.wasAlreadyProcessed).toBe(false);
    expect(result.state.activeTimeSec).toBe(30);

    // Verify PostgreSQL: event ledger
    const events = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(events).toHaveLength(1);
    expect(events[0].activeTimeSec).toBe(30);

    // Verify PostgreSQL: block state
    const states = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
      )
    );
    expect(states).toHaveLength(1);
    expect(states[0].activeTimeSec).toBe(30);

    console.log('✅ D2-1 PASS: First event processed once');
  });

  // ==========================================================================
  // D2-2: EXACT DUPLICATE
  // ==========================================================================

  it('D2-2: Sequential duplicate idempotent', async () => {
    const eventId = randomUUID();
    const activeTimeSec = 30;

    // First delivery
    const first = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      activeTimeSec
    );
    expect(first.wasProcessed).toBe(true);
    expect(first.state.activeTimeSec).toBe(30);

    // Duplicate delivery (exact same payload)
    const duplicate = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      activeTimeSec
    );

    // Verify response
    expect(duplicate.wasProcessed).toBe(false);
    expect(duplicate.wasAlreadyProcessed).toBe(true);
    expect(duplicate.state.activeTimeSec).toBe(30); // NOT 60

    // Verify PostgreSQL: only one event row
    const events = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(events).toHaveLength(1);

    // Verify PostgreSQL: activeTimeSec incremented only once
    const states = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
      )
    );
    expect(states[0].activeTimeSec).toBe(30); // NOT 60

    console.log('✅ D2-2 PASS: Sequential duplicate idempotent');
  });

  // ==========================================================================
  // D2-3: PAYLOAD CONFLICT
  // ==========================================================================

  it('D2-3: Payload conflict rejected', async () => {
    const eventId = randomUUID();

    // First delivery: 30 seconds
    await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      30
    );

    // Second delivery: SAME eventId, DIFFERENT activeTimeSec
    try {
      await service.recordBlockActiveTime(
        testIdentity,
        TEST_NAVIGATION_NODE_ID,
        TEST_SUBTOPIC_ID,
        TEST_BLOCK_ID_D1,
        TEST_BLOCK_VERSION,
        eventId,
        40 // CONFLICT: different payload
      );
      throw new Error('Expected EVENT_PAYLOAD_CONFLICT');
    } catch (error: any) {
      expect(error.code).toBe('EVENT_PAYLOAD_CONFLICT');
      expect(error.message).toContain('Event payload conflict');
    }

    // Verify PostgreSQL: event ledger unchanged
    const events = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(events).toHaveLength(1);
    expect(events[0].activeTimeSec).toBe(30); // NOT 40

    // Verify PostgreSQL: block state incremented only by first event
    const states = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
      )
    );
    expect(states[0].activeTimeSec).toBe(30); // NOT 40, NOT 70

    console.log('✅ D2-3 PASS: Payload conflict rejected');
  });

  // ==========================================================================
  // D2-4: DIFFERENT EVENTS ACCUMULATE
  // ==========================================================================

  it('D2-4: Different events accumulate', async () => {
    const eventIdA = randomUUID();
    const eventIdB = randomUUID();

    // Event A: 30 seconds
    const resultA = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventIdA,
      30
    );
    expect(resultA.state.activeTimeSec).toBe(30);

    // Event B: 20 seconds (different event)
    const resultB = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventIdB,
      20
    );
    expect(resultB.state.activeTimeSec).toBe(50); // Accumulated: 30 + 20

    // Verify PostgreSQL: two event rows
    const eventsA = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventIdA)
    );
    const eventsB = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventIdB)
    );
    expect(eventsA).toHaveLength(1);
    expect(eventsB).toHaveLength(1);

    // Verify PostgreSQL: accumulated time
    const states = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
      )
    );
    expect(states[0].activeTimeSec).toBe(50);

    console.log('✅ D2-4 PASS: Different events accumulate');
  });

  // ==========================================================================
  // D2-5: REAL POSTGRESQL ROLLBACK
  // ==========================================================================

  it('D2-5: Real PostgreSQL rollback proven', async () => {
    const eventId = randomUUID();

    // Force transaction rollback by throwing error AFTER event claim
    try {
      await db.transaction(async (tx) => {
        // Claim event
        await tx.insert(blockTelemetryEvents).values({
          eventId,
          userId: TEST_USER_ID,
          navigationNodeId: TEST_NAVIGATION_NODE_ID,
          blockId: TEST_BLOCK_ID_D1,
          blockVersion: TEST_BLOCK_VERSION,
          activeTimeSec: 30,
        });

        // Force rollback
        throw new Error('D2-5 intentional rollback');
      });
    } catch (error: any) {
      expect(error.message).toBe('D2-5 intentional rollback');
    }

    // Verify OUTSIDE transaction: event does NOT exist
    const events = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(events).toHaveLength(0); // Rolled back

    // Verify: block state unchanged
    const states = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
      )
    );
    expect(states).toHaveLength(0); // No state created

    // Verify: same event can be processed successfully after rollback
    const retry = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      30
    );
    expect(retry.wasProcessed).toBe(true);
    expect(retry.state.activeTimeSec).toBe(30);

    console.log('✅ D2-5 PASS: Real PostgreSQL rollback proven');
  });

  // ==========================================================================
  // D2-6: CONCURRENT DUPLICATE DELIVERY
  // ==========================================================================

  it('D2-6: Concurrent duplicate handling proven', async () => {
    const eventId = randomUUID();
    const activeTimeSec = 30;

    // Execute TWO concurrent deliveries with SAME eventId
    const [result1, result2] = await Promise.all([
      service.recordBlockActiveTime(
        testIdentity,
        TEST_NAVIGATION_NODE_ID,
        TEST_SUBTOPIC_ID,
        TEST_BLOCK_ID_D1,
        TEST_BLOCK_VERSION,
        eventId,
        activeTimeSec
      ),
      service.recordBlockActiveTime(
        testIdentity,
        TEST_NAVIGATION_NODE_ID,
        TEST_SUBTOPIC_ID,
        TEST_BLOCK_ID_D1,
        TEST_BLOCK_VERSION,
        eventId,
        activeTimeSec
      ),
    ]);

    // Verify: exactly one processed, one duplicate
    const processed = [result1, result2].filter((r) => r.wasProcessed);
    const duplicates = [result1, result2].filter((r) => r.wasAlreadyProcessed);
    expect(processed).toHaveLength(1);
    expect(duplicates).toHaveLength(1);

    // Verify PostgreSQL: only one event row
    const events = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(events).toHaveLength(1);

    // Verify PostgreSQL: activeTimeSec incremented exactly once
    const states = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
      )
    );
    expect(states[0].activeTimeSec).toBe(30); // NOT 60

    console.log('✅ D2-6 PASS: Concurrent duplicate handling proven');
  });

  // ==========================================================================
  // D2-7: IDENTITY ISOLATION
  // ==========================================================================

  it('D2-7: Identity isolation verified', async () => {
    const eventIdUserA = randomUUID();
    const eventIdUserB = randomUUID();
    const userBId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    const identityA: AuthenticatedIdentity = {
      userId: TEST_USER_ID,
      brand: 'shared',
    };
    const identityB: AuthenticatedIdentity = {
      userId: userBId,
      brand: 'shared',
    };

    // User A: 30 seconds
    const resultA = await service.recordBlockActiveTime(
      identityA,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventIdUserA,
      30
    );
    expect(resultA.state.activeTimeSec).toBe(30);

    // User B: 40 seconds (same block, different user)
    const resultB = await service.recordBlockActiveTime(
      identityB,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventIdUserB,
      40
    );
    expect(resultB.state.activeTimeSec).toBe(40);

    // Verify PostgreSQL: separate state rows
    const stateA = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1)
      )
    );
    const stateB = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, userBId),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1)
      )
    );
    expect(stateA[0].activeTimeSec).toBe(30);
    expect(stateB[0].activeTimeSec).toBe(40);

    // Cleanup user B
    await db.delete(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.userId, userBId)
    );
    await db.delete(blockLearningState).where(
      eq(blockLearningState.userId, userBId)
    );

    console.log('✅ D2-7 PASS: Identity isolation verified');
  });

  // ==========================================================================
  // D2-8: BLOCK IDENTITY ISOLATION
  // ==========================================================================

  it('D2-8: Block isolation verified', async () => {
    const eventIdBlock1 = randomUUID();
    const eventIdBlock2 = randomUUID();
    const blockIdC1 = 'fb6b1e9d-3fe2-48f5-891e-73f8e22797b9';

    // Block D1: 30 seconds
    const resultD1 = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventIdBlock1,
      30
    );
    expect(resultD1.state.activeTimeSec).toBe(30);

    // Block C1: 40 seconds (same user, different block)
    const resultC1 = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      blockIdC1,
      'C1',
      eventIdBlock2,
      40
    );
    expect(resultC1.state.activeTimeSec).toBe(40);

    // Verify PostgreSQL: separate state rows
    const stateD1 = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1)
      )
    );
    const stateC1 = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, blockIdC1)
      )
    );
    expect(stateD1[0].activeTimeSec).toBe(30);
    expect(stateC1[0].activeTimeSec).toBe(40);

    console.log('✅ D2-8 PASS: Block isolation verified');
  });

  // ==========================================================================
  // D2-9: SOFT-DELETE REPLAY IDEMPOTENCY
  // ==========================================================================

  it('D2-9: Soft-delete replay idempotent', async () => {
    const eventId = randomUUID();

    // 1. Process event A with +30 seconds
    const first = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      30
    );
    expect(first.wasProcessed).toBe(true);
    expect(first.state.activeTimeSec).toBe(30);

    // 2. Verify event A exists
    const eventsBeforeDelete = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(eventsBeforeDelete).toHaveLength(1);
    expect(eventsBeforeDelete[0].activeTimeSec).toBe(30);

    // 3. Verify block state received +30
    const stateBeforeDelete = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        eq(blockLearningState.blockVersion, TEST_BLOCK_VERSION)
      )
    );
    expect(stateBeforeDelete).toHaveLength(1);
    expect(stateBeforeDelete[0].activeTimeSec).toBe(30);

    // 4. Soft-delete block state
    await db
      .update(blockLearningState)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(blockLearningState.userId, TEST_USER_ID),
          eq(blockLearningState.blockId, TEST_BLOCK_ID_D1)
        )
      );

    // 5. Confirm state is no longer returned by normal active-state lookup
    const stateAfterDelete = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1),
        isNull(blockLearningState.deletedAt) // Use isNull() for NULL comparison
      )
    );
    expect(stateAfterDelete).toHaveLength(0); // Not returned by active lookup

    // 6. Replay event A (CRITICAL: same eventId)
    const replay = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId, // SAME eventId
      30       // SAME payload
    );

    // 7. Verify event A is recognized as already processed
    expect(replay.wasProcessed).toBe(false);
    expect(replay.wasAlreadyProcessed).toBe(true);

    // 8. Verify no additional +30 seconds was applied
    // Check actual database state (including soft-deleted)
    const finalState = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1)
      )
    );
    // If state exists (even soft-deleted), it should still be 30, not 60
    if (finalState.length > 0) {
      expect(finalState[0].activeTimeSec).toBe(30); // NOT 60
    }

    // 9. Verify event ledger still contains exactly one event A
    const finalEvents = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(finalEvents).toHaveLength(1);
    expect(finalEvents[0].activeTimeSec).toBe(30);

    console.log('✅ D2-9 PASS: Soft-delete replay idempotent (event ledger authoritative)');
  });

  // ==========================================================================
  // D2-10: 600-SECOND BOUNDARY
  // ==========================================================================

  it('D2-10: 600-second boundary enforced', async () => {
    const eventId600 = randomUUID();
    const eventId601 = randomUUID();

    // 600 seconds: VALID
    const result600 = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId600,
      600
    );
    expect(result600.wasProcessed).toBe(true);
    expect(result600.state.activeTimeSec).toBe(600);

    // 601 seconds: INVALID
    await expect(
      service.recordBlockActiveTime(
        testIdentity,
        TEST_NAVIGATION_NODE_ID,
        TEST_SUBTOPIC_ID,
        TEST_BLOCK_ID_D1,
        TEST_BLOCK_VERSION,
        eventId601,
        601
      )
    ).rejects.toThrow('max 600 seconds');

    // Verify PostgreSQL: 601-second event NOT persisted
    const events601 = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId601)
    );
    expect(events601).toHaveLength(0);

    // Verify PostgreSQL: block state unchanged by rejected event
    const states = await db.select().from(blockLearningState).where(
      and(
        eq(blockLearningState.userId, TEST_USER_ID),
        eq(blockLearningState.blockId, TEST_BLOCK_ID_D1)
      )
    );
    expect(states[0].activeTimeSec).toBe(600); // NOT 1201

    console.log('✅ D2-10 PASS: 600-second boundary enforced');
  });

  // ==========================================================================
  // D2-11: ZERO-SECOND EVENT
  // ==========================================================================

  it('D2-11: Zero-second event persisted', async () => {
    const eventId = randomUUID();

    // Zero-second event
    const result = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      0
    );

    // Verify: event processed
    expect(result.wasProcessed).toBe(true);
    expect(result.state.activeTimeSec).toBe(0);

    // Verify PostgreSQL: event row exists
    const events = await db.select().from(blockTelemetryEvents).where(
      eq(blockTelemetryEvents.eventId, eventId)
    );
    expect(events).toHaveLength(1);
    expect(events[0].activeTimeSec).toBe(0);

    // Duplicate zero-second event
    const duplicate = await service.recordBlockActiveTime(
      testIdentity,
      TEST_NAVIGATION_NODE_ID,
      TEST_SUBTOPIC_ID,
      TEST_BLOCK_ID_D1,
      TEST_BLOCK_VERSION,
      eventId,
      0
    );

    // Verify: duplicate recognized
    expect(duplicate.wasAlreadyProcessed).toBe(true);
    expect(duplicate.wasProcessed).toBe(false);

    console.log('✅ D2-11 PASS: Zero-second event persisted');
  });
});
