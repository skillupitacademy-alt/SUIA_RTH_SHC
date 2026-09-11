/**
 * Phase 4.6: Block-Level Learning Progress Service Tests
 * 
 * Tests for block-level visit tracking, time tracking, and time comparison methods.
 * 
 * SCOPE:
 * - recordBlockVisit() - atomic session-aware visit semantics (Phase 4.6)
 * - recordBlockActiveTime() - block-level time tracking with 600s limit
 * - calculateBlockTimeComparison() - pure time comparison calculation
 * 
 * Phase 4.6 Changes:
 * - Session tracking based on sessionId identity (not time-based)
 * - Visit/revision decisions made atomically in database
 * - No SELECT before upsert in service layer
 * - lastSessionId persisted for atomic session transition detection
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import { LearningProgressService, type AuthenticatedIdentity } from '../learning-progress.service';
import type { ITutorialNavigationProgressRepository } from '@quiz/types';
import type { TutorialSectionRepository } from '../../repositories/tutorial-section.repository';
import type { BlockLearningStateRepository, BlockLearningState } from '../../repositories/block-learning-state.repository';
import type { TutorialSection } from '../../schema/tutorial-sections';

// ============================================================================
// MOCKS
// ============================================================================

// Mock section repository for hierarchy validation
class MockSectionRepository {
  private sections: Map<string, TutorialSection> = new Map();

  async getTutorialByPageIdentity(
    subtopicId: string,
    navigationNodeId: string,
    brandId: string = 'shared'
  ): Promise<TutorialSection | undefined> {
    const key = `${subtopicId}:${navigationNodeId}:${brandId}`;
    return this.sections.get(key);
  }

  registerSection(
    subtopicId: string,
    navigationNodeId: string,
    sectionId: string,
    brandId: string = 'shared'
  ): void {
    const key = `${subtopicId}:${navigationNodeId}:${brandId}`;
    const mockSection: Partial<TutorialSection> = {
      id: sectionId,
      subtopicId,
      navigationNodeId,
      brandId: brandId as 'shared' | 'realtutorialhub' | 'skillup' | 'skillhubcore',
      content: { schemaVersion: 1, blocks: [] },
    };
    this.sections.set(key, mockSection as TutorialSection);
  }
}

// Mock navigation progress repository (minimal - not tested in Phase 4.3)
class MockNavigationProgressRepository implements Partial<ITutorialNavigationProgressRepository> {
  withDb(): ITutorialNavigationProgressRepository {
    return this as any;
  }

  async getProgress(): Promise<any> {
    return null;
  }

  async createProgress(): Promise<any> {
    return {};
  }
}

// Mock BlockLearningStateRepository for Phase 4.6 testing
class MockBlockLearningStateRepository {
  private states: Map<string, BlockLearningState> = new Map();
  private idCounter = 0;

  withDb(): this {
    return this;
  }

  async findOne(identity: {
    userId: string;
    navigationNodeId: string;
    blockId: string;
    blockVersion: string;
  }): Promise<BlockLearningState | null> {
    const key = `${identity.userId}:${identity.navigationNodeId}:${identity.blockId}:${identity.blockVersion}`;
    return this.states.get(key) ?? null;
  }

  async upsert(data: {
    userId: string;
    navigationNodeId: string;
    blockId: string;
    blockVersion: string;
    lastSessionId?: string;  // Phase 4.6: Session identity
    visitCount?: number;
    revisionCount?: number;
    activeTimeSec?: number;
    expectedTimeSec?: number | null;
    firstViewedAt?: Date | null;
    lastViewedAt?: Date | null;
    completedAt?: Date | null;
  }): Promise<BlockLearningState> {
    const key = `${data.userId}:${data.navigationNodeId}:${data.blockId}:${data.blockVersion}`;
    const existing = this.states.get(key);
    const now = new Date();

    if (!existing) {
      // Create new
      const newState: BlockLearningState = {
        id: `block-${++this.idCounter}`,
        userId: data.userId,
        navigationNodeId: data.navigationNodeId,
        blockId: data.blockId,
        blockVersion: data.blockVersion,
        // Phase 4.6: Atomic visit count (first visit if lastSessionId provided)
        visitCount: data.lastSessionId ? 1 : (data.visitCount ?? 0),
        revisionCount: data.revisionCount ?? 0,
        activeTimeSec: data.activeTimeSec ?? 0,
        expectedTimeSec: data.expectedTimeSec ?? null,
        // Phase 4.6: Atomic firstViewedAt (initialize if lastSessionId provided)
        firstViewedAt: data.lastSessionId ? now : (data.firstViewedAt ?? null),
        lastViewedAt: data.lastViewedAt ?? null,
        completedAt: data.completedAt ?? null,
        lastSessionId: data.lastSessionId ?? null,  // Phase 4.6
        version: 1,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
      this.states.set(key, newState);
      return newState;
    }

    // Phase 4.6: Atomic session-aware update
    // Simulate database-side session comparison using IS DISTINCT FROM
    const isSessionChange = data.lastSessionId !== undefined && 
                           existing.lastSessionId !== data.lastSessionId;
    
    const updated: BlockLearningState = {
      ...existing,
      // Phase 4.6: Atomic visit count (increment only on session change)
      visitCount: data.lastSessionId
        ? (isSessionChange ? existing.visitCount + 1 : existing.visitCount)
        : existing.visitCount + (data.visitCount ?? 0),
      // Phase 4.6: Atomic revision count (increment on session change + completed)
      revisionCount: data.lastSessionId
        ? (isSessionChange && existing.completedAt !== null ? existing.revisionCount + 1 : existing.revisionCount)
        : existing.revisionCount + (data.revisionCount ?? 0),
      // Active time: simple increment (unchanged)
      activeTimeSec: existing.activeTimeSec + (data.activeTimeSec ?? 0),
      expectedTimeSec: data.expectedTimeSec !== undefined ? data.expectedTimeSec : existing.expectedTimeSec,
      // Phase 4.6: firstViewedAt preserved (initialized on first visit when lastSessionId was NULL)
      firstViewedAt: existing.firstViewedAt ?? now,
      lastViewedAt: data.lastViewedAt ?? existing.lastViewedAt,
      completedAt: data.completedAt !== undefined ? data.completedAt : existing.completedAt,
      // Phase 4.6: Persist session identity
      lastSessionId: data.lastSessionId ?? existing.lastSessionId,
      version: existing.version + 1,
      updatedAt: now,
    };
    this.states.set(key, updated);
    return updated;
  }

  // Test helper
  setState(state: BlockLearningState): void {
    const key = `${state.userId}:${state.navigationNodeId}:${state.blockId}:${state.blockVersion}`;
    this.states.set(key, state);
  }

  clear(): void {
    this.states.clear();
    this.idCounter = 0;
  }
}

// ============================================================================
// TESTS
// ============================================================================

describe('LearningProgressService - Phase 4.6 Block-Level Atomic Session Tracking', () => {
  let service: LearningProgressService;
  let mockBlockRepo: MockBlockLearningStateRepository;
  let mockSectionRepo: MockSectionRepository;
  let mockProgressRepo: MockNavigationProgressRepository;

  const testIdentity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

  beforeEach(() => {
    mockBlockRepo = new MockBlockLearningStateRepository();
    mockSectionRepo = new MockSectionRepository();
    mockProgressRepo = new MockNavigationProgressRepository();

    // Phase D-2: Mock telemetry repository with basic idempotency
    const eventLedger = new Map<string, any>();
    
    const mockTelemetryRepo = {
      withDb: () => mockTelemetryRepo,
      claimEvent: vi.fn().mockImplementation(async (data: any) => {
        if (eventLedger.has(data.eventId)) {
          return null; // Duplicate - not claimed
        }
        eventLedger.set(data.eventId, data);
        return data; // First time - claimed
      }),
      findByEventId: vi.fn().mockImplementation(async (eventId: string) => {
        return eventLedger.get(eventId) || null;
      }),
      findByBlockIdentity: vi.fn().mockResolvedValue([]),
      countByBlockIdentity: vi.fn().mockResolvedValue(0),
    } as any;

    // Register valid hierarchy
    mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1');

    service = new LearningProgressService(
      mockProgressRepo as any,
      mockSectionRepo as unknown as TutorialSectionRepository,
      mockBlockRepo as any,
      mockTelemetryRepo // Phase D-2: 4th parameter
    );
  });

  // ==========================================================================
  // recordBlockVisit() TESTS
  // ==========================================================================

  describe('recordBlockVisit', () => {
    it('creates first visit with visitCount=1', async () => {
      const result = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      expect(result.visitCount).toBe(1);
      expect(result.revisionCount).toBe(0);
      expect(result.firstViewedAt).toBeInstanceOf(Date);
      expect(result.lastViewedAt).toBeInstanceOf(Date);
    });

    it('does not increment visit on same session (session-identity-based)', async () => {
      // First visit
      const first = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      expect(first.visitCount).toBe(1);
      expect(first.lastSessionId).toBe('session-1');

      // Second call with same sessionId - same session
      const second = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      expect(second.visitCount).toBe(1); // No increment - same session
      expect(second.lastSessionId).toBe('session-1');
    });

    it('increments visit on new session (session-identity-based)', async () => {
      // First visit
      const first = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      expect(first.visitCount).toBe(1);
      expect(first.lastSessionId).toBe('session-1');

      // Second visit with different sessionId - new session
      const second = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-2'
      );

      expect(second.visitCount).toBe(2); // Incremented - new session
      expect(second.revisionCount).toBe(0); // Not completed
      expect(second.lastSessionId).toBe('session-2');
    });

    it('increments revision on new session + completed block', async () => {
      // First visit
      const first = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      expect(first.visitCount).toBe(1);
      expect(first.lastSessionId).toBe('session-1');

      // Mark block as completed
      mockBlockRepo.setState({
        ...first,
        completedAt: new Date(),
      });

      // Second visit with different sessionId - new session + completed
      const second = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-2'
      );

      expect(second.visitCount).toBe(2); // Incremented - new session
      expect(second.revisionCount).toBe(1); // Incremented - revision (completed + new session)
      expect(second.lastSessionId).toBe('session-2');
    });

    it('validates block identity', async () => {
      await expect(
        service.recordBlockVisit(testIdentity, 'node-1', 'subtopic-1', '', 'D1', 'session-1')
      ).rejects.toThrow('Invalid blockId');

      await expect(
        service.recordBlockVisit(testIdentity, 'node-1', 'subtopic-1', 'block-1', '', 'session-1')
      ).rejects.toThrow('Invalid blockVersion');

      await expect(
        service.recordBlockVisit(testIdentity, 'node-1', 'subtopic-1', 'block-1', 'D1', '')
      ).rejects.toThrow('Invalid sessionId');
    });

    it('validates navigation hierarchy', async () => {
      await expect(
        service.recordBlockVisit(
          testIdentity,
          'invalid-node',
          'subtopic-1',
          'block-1',
          'D1',
          'session-1'
        )
      ).rejects.toThrow();
    });

    it('isolates by complete 4-part identity', async () => {
      // Same user, node, block but different version
      const v1 = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      const v2 = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D2',
        'session-1'
      );

      expect(v1.blockVersion).toBe('D1');
      expect(v2.blockVersion).toBe('D2');
      expect(v1.id).not.toBe(v2.id); // Different records
    });
  });

  // ==========================================================================
  // recordBlockActiveTime() TESTS
  // ==========================================================================

  describe('recordBlockActiveTime', () => {
    it('accumulates active time', async () => {
      // Phase D-2: Generate unique event IDs
      const eventId1 = randomUUID();
      const eventId2 = randomUUID();

      // First time update
      const first = await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        eventId1, // Phase D-2: eventId parameter
        120
      );

      expect(first.state.activeTimeSec).toBe(120); // Phase D-2: result.state.X

      // Second time update (different event)
      const second = await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        eventId2, // Phase D-2: eventId parameter
        60
      );

      expect(second.state.activeTimeSec).toBe(180); // Phase D-2: result.state.X (accumulated)
    });

    it('creates state if none exists (visitCount=0)', async () => {
      const eventId = randomUUID();
      
      const result = await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        eventId, // Phase D-2: eventId parameter
        30
      );

      expect(result.state.activeTimeSec).toBe(30); // Phase D-2: result.state.X
      expect(result.state.visitCount).toBe(0); // Phase D-2: result.state.X - No visit manufactured
    });

    it('enforces 600 second block-level time limit', async () => {
      const eventId = randomUUID();
      
      await expect(
        service.recordBlockActiveTime(
          testIdentity,
          'node-1',
          'subtopic-1',
          'block-1',
          'D1',
          eventId, // Phase D-2: eventId parameter
          601
        )
      ).rejects.toThrow('max 600 seconds');
    });

    it('rejects negative time', async () => {
      const eventId = randomUUID();
      
      await expect(
        service.recordBlockActiveTime(
          testIdentity,
          'node-1',
          'subtopic-1',
          'block-1',
          'D1',
          eventId, // Phase D-2: eventId parameter
          -10
        )
      ).rejects.toThrow('cannot be negative');
    });

    it('validates block identity', async () => {
      const eventId = randomUUID();
      
      await expect(
        service.recordBlockActiveTime(testIdentity, 'node-1', 'subtopic-1', '', 'D1', eventId, 30)
      ).rejects.toThrow('Invalid blockId');

      await expect(
        service.recordBlockActiveTime(testIdentity, 'node-1', 'subtopic-1', 'block-1', '', eventId, 30)
      ).rejects.toThrow('Invalid blockVersion');
    });

    it('validates navigation hierarchy', async () => {
      const eventId = randomUUID();
      
      await expect(
        service.recordBlockActiveTime(
          testIdentity,
          'invalid-node',
          'subtopic-1',
          'block-1',
          'D1',
          eventId, // Phase D-2: eventId parameter
          30
        )
      ).rejects.toThrow();
    });

    it('does not increment visit count', async () => {
      // Create initial state with visit
      await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      const before = await mockBlockRepo.findOne({
        userId: testIdentity.userId,
        navigationNodeId: 'node-1',
        blockId: 'block-1',
        blockVersion: 'D1',
      });

      const eventId = randomUUID();

      // Record time
      await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        eventId, // Phase D-2: eventId parameter
        30
      );

      const after = await mockBlockRepo.findOne({
        userId: testIdentity.userId,
        navigationNodeId: 'node-1',
        blockId: 'block-1',
        blockVersion: 'D1',
      });

      expect(after!.visitCount).toBe(before!.visitCount); // Unchanged
      expect(after!.activeTimeSec).toBeGreaterThan(before!.activeTimeSec);
    });
  });

  // ==========================================================================
  // calculateBlockTimeComparison() TESTS
  // ==========================================================================

  describe('calculateBlockTimeComparison', () => {
    it('calculates comparison when expectedTimeSec is set', () => {
      const blockState: BlockLearningState = {
        id: 'test-id',
        userId: 'user-1',
        navigationNodeId: 'node-1',
        blockId: 'block-1',
        blockVersion: 'D1',
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 150,
        expectedTimeSec: 100,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null,
        lastSessionId: null,  // Phase 4.6
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const result = service.calculateBlockTimeComparison(blockState);

      expect(result.actualTimeSec).toBe(150);
      expect(result.expectedTimeSec).toBe(100);
      expect(result.differenceTimeSec).toBe(50); // 150 - 100
      expect(result.ratioActualToExpected).toBe(1.5); // 150 / 100
    });

    it('returns null metrics when expectedTimeSec is null', () => {
      const blockState: BlockLearningState = {
        id: 'test-id',
        userId: 'user-1',
        navigationNodeId: 'node-1',
        blockId: 'block-1',
        blockVersion: 'D1',
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 150,
        expectedTimeSec: null,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null,
        lastSessionId: null,  // Phase 4.6
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const result = service.calculateBlockTimeComparison(blockState);

      expect(result.actualTimeSec).toBe(150);
      expect(result.expectedTimeSec).toBeNull();
      expect(result.differenceTimeSec).toBeNull();
      expect(result.ratioActualToExpected).toBeNull();
    });

    it('handles zero activeTimeSec', () => {
      const blockState: BlockLearningState = {
        id: 'test-id',
        userId: 'user-1',
        navigationNodeId: 'node-1',
        blockId: 'block-1',
        blockVersion: 'D1',
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 0,
        expectedTimeSec: 100,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null,
        lastSessionId: null,  // Phase 4.6
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const result = service.calculateBlockTimeComparison(blockState);

      expect(result.actualTimeSec).toBe(0);
      expect(result.expectedTimeSec).toBe(100);
      expect(result.differenceTimeSec).toBe(-100);
      expect(result.ratioActualToExpected).toBe(0); // 0 / 100
    });

    it('handles zero expectedTimeSec edge case', () => {
      const blockState: BlockLearningState = {
        id: 'test-id',
        userId: 'user-1',
        navigationNodeId: 'node-1',
        blockId: 'block-1',
        blockVersion: 'D1',
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 150,
        expectedTimeSec: 0,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null,
        lastSessionId: null,  // Phase 4.6
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const result = service.calculateBlockTimeComparison(blockState);

      expect(result.actualTimeSec).toBe(150);
      expect(result.expectedTimeSec).toBe(0);
      expect(result.differenceTimeSec).toBe(150);
      expect(result.ratioActualToExpected).toBe(0); // Special case: avoid division by zero
    });

    it('calculates negative difference when faster than expected', () => {
      const blockState: BlockLearningState = {
        id: 'test-id',
        userId: 'user-1',
        navigationNodeId: 'node-1',
        blockId: 'block-1',
        blockVersion: 'D1',
        visitCount: 1,
        revisionCount: 0,
        activeTimeSec: 75,
        expectedTimeSec: 100,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null,
        lastSessionId: null,  // Phase 4.6
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const result = service.calculateBlockTimeComparison(blockState);

      expect(result.actualTimeSec).toBe(75);
      expect(result.expectedTimeSec).toBe(100);
      expect(result.differenceTimeSec).toBe(-25); // 75 - 100
      expect(result.ratioActualToExpected).toBe(0.75); // 75 / 100
    });
  });
});
