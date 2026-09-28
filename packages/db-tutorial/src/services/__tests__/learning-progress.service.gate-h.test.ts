/**
 * Gate H: Canonical Block Completion Mapping Tests
 * 
 * Purpose: Verify that LearningProgressService.toDTO() correctly derives
 * block completion timestamps from the authoritative source:
 * tutorial_navigation_progress.completed_blocks
 * 
 * Root Cause Addressed:
 * - Automatic completion updates completed_blocks but NOT block_learning_state.completed_at
 * - ILSProvider saw NULL → triggered duplicate completion POST after reload
 * 
 * Fix:
 * - toDTO() now uses completed_blocks as canonical completion source
 * - Falls back to block_learning_state.completed_at for legacy compatibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LearningProgressService, type AuthenticatedIdentity } from '../learning-progress.service';
import type {
  ITutorialNavigationProgressRepository,
  TutorialNavigationProgressRecord,
  CompletedBlockRecord,
} from '@quiz/types';
import type { BlockLearningState } from '../../repositories/block-learning-state.repository';
import type { TutorialSectionRepository } from '../../repositories/tutorial-section.repository';
import type { TutorialSection } from '../../schema/tutorial-sections';

// Mock repositories
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
    requiredBlocks: Array<{ blockId: string; blockVersion: string }>,
    brandId: string = 'shared'
  ): void {
    const key = `${subtopicId}:${navigationNodeId}:${brandId}`;
    const mockSection: Partial<TutorialSection> = {
      id: sectionId,
      subtopicId,
      navigationNodeId,
      brandId: brandId as 'shared' | 'realtutorialhub' | 'skillup' | 'skillhubcore',
      content: {
        schemaVersion: 1,
        blocks: requiredBlocks.map((block) => ({
          id: block.blockId,
          type: 'definition',
          version: block.blockVersion,
          content: {} as any,
        })),
      },
    };
    this.sections.set(key, mockSection as TutorialSection);
  }
}

class MockProgressRepository implements ITutorialNavigationProgressRepository {
  private records: Map<string, TutorialNavigationProgressRecord> = new Map();

  withDb(): this {
    return this;
  }

  async findById(id: string): Promise<TutorialNavigationProgressRecord | undefined> {
    return Array.from(this.records.values()).find((r) => r.id === id);
  }

  async getProgress(
    userId: string,
    navigationNodeId: string
  ): Promise<TutorialNavigationProgressRecord | undefined> {
    const key = `${userId}:${navigationNodeId}`;
    return this.records.get(key);
  }

  async getProgressForSubtopic(): Promise<TutorialNavigationProgressRecord[]> {
    return [];
  }

  async createProgress(): Promise<TutorialNavigationProgressRecord> {
    throw new Error('Not implemented');
  }

  async upsertProgress(): Promise<TutorialNavigationProgressRecord> {
    throw new Error('Not implemented');
  }

  async recordVisit(): Promise<TutorialNavigationProgressRecord> {
    throw new Error('Not implemented');
  }

  async markBlockCompleted(): Promise<TutorialNavigationProgressRecord> {
    throw new Error('Not implemented');
  }

  async markCompleted(): Promise<TutorialNavigationProgressRecord> {
    throw new Error('Not implemented');
  }

  async updateActiveTime(): Promise<TutorialNavigationProgressRecord> {
    throw new Error('Not implemented');
  }

  async getOrCreateProgress(): Promise<TutorialNavigationProgressRecord> {
    throw new Error('Not implemented');
  }

  setMockRecord(userId: string, navigationNodeId: string, record: TutorialNavigationProgressRecord): void {
    const key = `${userId}:${navigationNodeId}`;
    this.records.set(key, record);
  }
}

class MockBlockLearningStateRepository {
  private states: BlockLearningState[] = [];

  async findByNavigationNode(): Promise<BlockLearningState[]> {
    return this.states;
  }

  setMockStates(states: BlockLearningState[]): void {
    this.states = states;
  }
}

describe('Gate H: Canonical Block Completion Mapping', () => {
  let service: LearningProgressService;
  let mockProgressRepo: MockProgressRepository;
  let mockSectionRepo: MockSectionRepository;
  let mockBlockRepo: MockBlockLearningStateRepository;

  const BLOCK_ID_D1 = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749';
  const BLOCK_ID_C1 = 'c1-block-id';
  const BLOCK_ID_I1 = 'i1-block-id';
  const NAVIGATION_NODE_ID = 'whatisjava';
  const SUBTOPIC_ID = 'java';
  const SECTION_ID = 'section-001';
  const USER_ID = 'test-user-id';

  const identity: AuthenticatedIdentity = {
    userId: USER_ID,
    brandId: 'shared',
    roles: ['student'],
  };

  beforeEach(() => {
    mockProgressRepo = new MockProgressRepository();
    mockSectionRepo = new MockSectionRepository();
    mockBlockRepo = new MockBlockLearningStateRepository();

    service = new LearningProgressService(
      mockProgressRepo,
      mockSectionRepo as unknown as TutorialSectionRepository,
      mockBlockRepo as any
    );

    // Register section with required blocks
    mockSectionRepo.registerSection(
      SUBTOPIC_ID,
      NAVIGATION_NODE_ID,
      SECTION_ID,
      [
        { blockId: BLOCK_ID_I1, blockVersion: 'I1' },
        { blockId: BLOCK_ID_D1, blockVersion: 'D1' },
        { blockId: BLOCK_ID_C1, blockVersion: 'C1' },
      ]
    );
  });

  it('uses completed_blocks when block_learning_state.completedAt is NULL', async () => {
    // GATE H CORE SCENARIO:
    // Automatic completion updated completed_blocks but NOT block_learning_state.completed_at

    const completionTimestamp = '2026-09-28T19:35:55.983Z';

    const progressRecord: TutorialNavigationProgressRecord = {
      id: 'progress-001',
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      sectionId: SECTION_ID,
      subtopicId: SUBTOPIC_ID,
      status: 'in_progress',
      completedBlocks: [
        {
          blockId: BLOCK_ID_D1,
          blockVersion: 'D1',
          completedAt: completionTimestamp,
        },
      ],
      timeSpentActiveSec: 0,
      visitCount: 1,
      revisionCount: 0,
      lastSessionId: null,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const blockState: BlockLearningState = {
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      blockId: BLOCK_ID_D1,
      blockVersion: 'D1',
      activeTimeSec: 192,
      expectedTimeSec: 210,
      visitCount: 1,
      revisionCount: 0,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null, // ❌ NULL (bug scenario)
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProgressRepo.setMockRecord(USER_ID, NAVIGATION_NODE_ID, progressRecord);
    mockBlockRepo.setMockStates([blockState]);

    const result = await service.getNavigationProgress(identity, NAVIGATION_NODE_ID, SUBTOPIC_ID);

    const d1Block = result.blocks?.find(
      (b) => b.blockId === BLOCK_ID_D1 && b.blockVersion === 'D1'
    );

    expect(d1Block).toBeDefined();
    expect(d1Block!.completedAt).toEqual(new Date(completionTimestamp)); // ✅ Should use canonical
    expect(d1Block!.activeTimeSec).toBe(192); // Telemetry preserved
  });

  it('does not use a completion record for a different block version', async () => {
    // Version mismatch scenario
    const progressRecord: TutorialNavigationProgressRecord = {
      id: 'progress-002',
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      sectionId: SECTION_ID,
      subtopicId: SUBTOPIC_ID,
      status: 'in_progress',
      completedBlocks: [
        {
          blockId: BLOCK_ID_D1,
          blockVersion: 'D2', // Different version!
          completedAt: '2026-09-28T19:35:55.983Z',
        },
      ],
      timeSpentActiveSec: 0,
      visitCount: 1,
      revisionCount: 0,
      lastSessionId: null,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const blockState: BlockLearningState = {
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      blockId: BLOCK_ID_D1,
      blockVersion: 'D1', // D1, not D2
      activeTimeSec: 192,
      expectedTimeSec: 210,
      visitCount: 1,
      revisionCount: 0,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProgressRepo.setMockRecord(USER_ID, NAVIGATION_NODE_ID, progressRecord);
    mockBlockRepo.setMockStates([blockState]);

    const result = await service.getNavigationProgress(identity, NAVIGATION_NODE_ID, SUBTOPIC_ID);

    const d1Block = result.blocks?.find(
      (b) => b.blockId === BLOCK_ID_D1 && b.blockVersion === 'D1'
    );

    expect(d1Block).toBeDefined();
    expect(d1Block!.completedAt).toBeNull(); // ✅ Should NOT use D2 completion for D1 block
  });

  it('does not use completion for a different block ID', async () => {
    const progressRecord: TutorialNavigationProgressRecord = {
      id: 'progress-003',
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      sectionId: SECTION_ID,
      subtopicId: SUBTOPIC_ID,
      status: 'in_progress',
      completedBlocks: [
        {
          blockId: BLOCK_ID_C1, // Different block!
          blockVersion: 'D1',
          completedAt: '2026-09-28T19:35:55.983Z',
        },
      ],
      timeSpentActiveSec: 0,
      visitCount: 1,
      revisionCount: 0,
      lastSessionId: null,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const blockState: BlockLearningState = {
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      blockId: BLOCK_ID_D1,
      blockVersion: 'D1',
      activeTimeSec: 192,
      expectedTimeSec: 210,
      visitCount: 1,
      revisionCount: 0,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProgressRepo.setMockRecord(USER_ID, NAVIGATION_NODE_ID, progressRecord);
    mockBlockRepo.setMockStates([blockState]);

    const result = await service.getNavigationProgress(identity, NAVIGATION_NODE_ID, SUBTOPIC_ID);

    const d1Block = result.blocks?.find(
      (b) => b.blockId === BLOCK_ID_D1 && b.blockVersion === 'D1'
    );

    expect(d1Block).toBeDefined();
    expect(d1Block!.completedAt).toBeNull(); // ✅ Should NOT use C1 completion for D1 block
  });

  it('falls back to block_learning_state.completedAt when canonical completion is absent', async () => {
    // Legacy/explicit completion scenario
    const legacyTimestamp = new Date('2026-09-28T18:00:00.000Z');

    const progressRecord: TutorialNavigationProgressRecord = {
      id: 'progress-004',
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      sectionId: SECTION_ID,
      subtopicId: SUBTOPIC_ID,
      status: 'in_progress',
      completedBlocks: [], // No canonical completion
      timeSpentActiveSec: 0,
      visitCount: 1,
      revisionCount: 0,
      lastSessionId: null,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const blockState: BlockLearningState = {
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      blockId: BLOCK_ID_D1,
      blockVersion: 'D1',
      activeTimeSec: 192,
      expectedTimeSec: 210,
      visitCount: 1,
      revisionCount: 0,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: legacyTimestamp, // Legacy completion
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProgressRepo.setMockRecord(USER_ID, NAVIGATION_NODE_ID, progressRecord);
    mockBlockRepo.setMockStates([blockState]);

    const result = await service.getNavigationProgress(identity, NAVIGATION_NODE_ID, SUBTOPIC_ID);

    const d1Block = result.blocks?.find(
      (b) => b.blockId === BLOCK_ID_D1 && b.blockVersion === 'D1'
    );

    expect(d1Block).toBeDefined();
    expect(d1Block!.completedAt).toEqual(legacyTimestamp); // ✅ Should use legacy fallback
  });

  it('prefers canonical completed_blocks over legacy block_learning_state.completedAt', async () => {
    // Authority hierarchy test
    const canonicalTimestamp = new Date('2026-09-28T19:35:55.983Z');
    const legacyTimestamp = new Date('2026-09-28T18:00:00.000Z');

    const progressRecord: TutorialNavigationProgressRecord = {
      id: 'progress-005',
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      sectionId: SECTION_ID,
      subtopicId: SUBTOPIC_ID,
      status: 'in_progress',
      completedBlocks: [
        {
          blockId: BLOCK_ID_D1,
          blockVersion: 'D1',
          completedAt: canonicalTimestamp.toISOString(),
        },
      ],
      timeSpentActiveSec: 0,
      visitCount: 1,
      revisionCount: 0,
      lastSessionId: null,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const blockState: BlockLearningState = {
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      blockId: BLOCK_ID_D1,
      blockVersion: 'D1',
      activeTimeSec: 192,
      expectedTimeSec: 210,
      visitCount: 1,
      revisionCount: 0,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: legacyTimestamp, // Conflicting legacy timestamp
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockProgressRepo.setMockRecord(USER_ID, NAVIGATION_NODE_ID, progressRecord);
    mockBlockRepo.setMockStates([blockState]);

    const result = await service.getNavigationProgress(identity, NAVIGATION_NODE_ID, SUBTOPIC_ID);

    const d1Block = result.blocks?.find(
      (b) => b.blockId === BLOCK_ID_D1 && b.blockVersion === 'D1'
    );

    expect(d1Block).toBeDefined();
    expect(d1Block!.completedAt).toEqual(canonicalTimestamp); // ✅ Canonical wins
    expect(d1Block!.completedAt).not.toEqual(legacyTimestamp);
  });

  it('maps completion independently for multiple blocks', async () => {
    const progressRecord: TutorialNavigationProgressRecord = {
      id: 'progress-006',
      userId: USER_ID,
      navigationNodeId: NAVIGATION_NODE_ID,
      sectionId: SECTION_ID,
      subtopicId: SUBTOPIC_ID,
      status: 'in_progress',
      completedBlocks: [
        {
          blockId: BLOCK_ID_D1,
          blockVersion: 'D1',
          completedAt: '2026-09-28T19:35:55.983Z',
        },
      ],
      timeSpentActiveSec: 0,
      visitCount: 1,
      revisionCount: 0,
      lastSessionId: null,
      firstViewedAt: new Date(),
      lastViewedAt: new Date(),
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    const blockStates: BlockLearningState[] = [
      {
        userId: USER_ID,
        navigationNodeId: NAVIGATION_NODE_ID,
        blockId: BLOCK_ID_I1,
        blockVersion: 'I1',
        activeTimeSec: 50,
        expectedTimeSec: 60,
        visitCount: 1,
        revisionCount: 0,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: USER_ID,
        navigationNodeId: NAVIGATION_NODE_ID,
        blockId: BLOCK_ID_D1,
        blockVersion: 'D1',
        activeTimeSec: 192,
        expectedTimeSec: 210,
        visitCount: 1,
        revisionCount: 0,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null, // NULL but has canonical completion
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: USER_ID,
        navigationNodeId: NAVIGATION_NODE_ID,
        blockId: BLOCK_ID_C1,
        blockVersion: 'C1',
        activeTimeSec: 30,
        expectedTimeSec: 90,
        visitCount: 1,
        revisionCount: 0,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    mockProgressRepo.setMockRecord(USER_ID, NAVIGATION_NODE_ID, progressRecord);
    mockBlockRepo.setMockStates(blockStates);

    const result = await service.getNavigationProgress(identity, NAVIGATION_NODE_ID, SUBTOPIC_ID);

    expect(result.blocks).toBeDefined();
    expect(result.blocks!.length).toBe(3);

    const i1Block = result.blocks!.find((b) => b.blockId === BLOCK_ID_I1);
    const d1Block = result.blocks!.find((b) => b.blockId === BLOCK_ID_D1);
    const c1Block = result.blocks!.find((b) => b.blockId === BLOCK_ID_C1);

    expect(i1Block!.completedAt).toBeNull(); // No completion
    expect(d1Block!.completedAt).toEqual(new Date('2026-09-28T19:35:55.983Z')); // Canonical
    expect(c1Block!.completedAt).toBeNull(); // No completion
  });
});
