/**
 * Phase 4.3: Block-Level Learning Progress Service Tests
 * 
 * Tests for block-level visit tracking, time tracking, and time comparison methods.
 * 
 * SCOPE:
 * - recordBlockVisit() - session-aware visit semantics
 * - recordBlockActiveTime() - block-level time tracking with 600s limit
 * - calculateBlockTimeComparison() - pure time comparison calculation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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

// Mock BlockLearningStateRepository for Phase 4.3 testing
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

    if (!existing) {
      // Create new
      const newState: BlockLearningState = {
        id: `block-${++this.idCounter}`,
        userId: data.userId,
        navigationNodeId: data.navigationNodeId,
        blockId: data.blockId,
        blockVersion: data.blockVersion,
        visitCount: data.visitCount ?? 0,
        revisionCount: data.revisionCount ?? 0,
        activeTimeSec: data.activeTimeSec ?? 0,
        expectedTimeSec: data.expectedTimeSec ?? null,
        firstViewedAt: data.firstViewedAt ?? null,
        lastViewedAt: data.lastViewedAt ?? null,
        completedAt: data.completedAt ?? null,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
      this.states.set(key, newState);
      return newState;
    }

    // Update existing (atomic counter increments)
    const updated: BlockLearningState = {
      ...existing,
      visitCount: existing.visitCount + (data.visitCount ?? 0),
      revisionCount: existing.revisionCount + (data.revisionCount ?? 0),
      activeTimeSec: existing.activeTimeSec + (data.activeTimeSec ?? 0),
      expectedTimeSec: data.expectedTimeSec !== undefined ? data.expectedTimeSec : existing.expectedTimeSec,
      firstViewedAt: data.firstViewedAt !== undefined ? data.firstViewedAt : existing.firstViewedAt,
      lastViewedAt: data.lastViewedAt ?? existing.lastViewedAt,
      completedAt: data.completedAt !== undefined ? data.completedAt : existing.completedAt,
      version: existing.version + 1,
      updatedAt: new Date(),
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

describe('LearningProgressService - Phase 4.3 Block-Level Tracking', () => {
  let service: LearningProgressService;
  let mockBlockRepo: MockBlockLearningStateRepository;
  let mockSectionRepo: MockSectionRepository;
  let mockProgressRepo: MockNavigationProgressRepository;

  const testIdentity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

  beforeEach(() => {
    mockBlockRepo = new MockBlockLearningStateRepository();
    mockSectionRepo = new MockSectionRepository();
    mockProgressRepo = new MockNavigationProgressRepository();

    // Register valid hierarchy
    mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1');

    service = new LearningProgressService(
      mockProgressRepo as any,
      mockSectionRepo as unknown as TutorialSectionRepository,
      mockBlockRepo as any
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

    it('does not increment visit on same session (time-based)', async () => {
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

      // Immediate second call (within 30 min) - same session
      const second = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      expect(second.visitCount).toBe(1); // No increment
    });

    it('increments visit on new session (time-based)', async () => {
      // First visit
      const first = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-1'
      );

      // Simulate old lastViewedAt (> 30 minutes ago)
      mockBlockRepo.setState({
        ...first,
        lastViewedAt: new Date(Date.now() - 31 * 60 * 1000), // 31 minutes ago
      });

      // Second visit - should be new session
      const second = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-2'
      );

      expect(second.visitCount).toBe(2); // Incremented
      expect(second.revisionCount).toBe(0); // Not completed
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

      // Simulate completed block with old lastViewedAt
      mockBlockRepo.setState({
        ...first,
        completedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        lastViewedAt: new Date(Date.now() - 31 * 60 * 1000), // 31 minutes ago
      });

      // Second visit - new session + completed
      const second = await service.recordBlockVisit(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        'session-2'
      );

      expect(second.visitCount).toBe(2); // Incremented
      expect(second.revisionCount).toBe(1); // Incremented (revision)
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
      // First time update
      const first = await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        120
      );

      expect(first.activeTimeSec).toBe(120);

      // Second time update
      const second = await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        60
      );

      expect(second.activeTimeSec).toBe(180); // Accumulated
    });

    it('creates state if none exists (visitCount=0)', async () => {
      const result = await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
        30
      );

      expect(result.activeTimeSec).toBe(30);
      expect(result.visitCount).toBe(0); // No visit manufactured
    });

    it('enforces 600 second block-level time limit', async () => {
      await expect(
        service.recordBlockActiveTime(
          testIdentity,
          'node-1',
          'subtopic-1',
          'block-1',
          'D1',
          601
        )
      ).rejects.toThrow('max 600 seconds');
    });

    it('rejects negative time', async () => {
      await expect(
        service.recordBlockActiveTime(
          testIdentity,
          'node-1',
          'subtopic-1',
          'block-1',
          'D1',
          -10
        )
      ).rejects.toThrow('cannot be negative');
    });

    it('validates block identity', async () => {
      await expect(
        service.recordBlockActiveTime(testIdentity, 'node-1', 'subtopic-1', '', 'D1', 30)
      ).rejects.toThrow('Invalid blockId');

      await expect(
        service.recordBlockActiveTime(testIdentity, 'node-1', 'subtopic-1', 'block-1', '', 30)
      ).rejects.toThrow('Invalid blockVersion');
    });

    it('validates navigation hierarchy', async () => {
      await expect(
        service.recordBlockActiveTime(
          testIdentity,
          'invalid-node',
          'subtopic-1',
          'block-1',
          'D1',
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

      // Record time
      await service.recordBlockActiveTime(
        testIdentity,
        'node-1',
        'subtopic-1',
        'block-1',
        'D1',
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
