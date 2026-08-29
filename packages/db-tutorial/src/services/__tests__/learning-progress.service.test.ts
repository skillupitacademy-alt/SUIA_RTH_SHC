/**
 * Phase 2.6-A3: Learning Progress Service Tests
 * 
 * Tests business logic layer without direct database access.
 * Mocks repository at service boundary.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LearningProgressService, type AuthenticatedIdentity } from '../learning-progress.service';
import type {
  ITutorialNavigationProgressRepository,
  TutorialNavigationProgressRecord,
  CompletedBlockRecord,
  TutorialNavigationProgressCreateInput,
  TutorialBlockCompletionEvent,
  TutorialTimeUpdateEvent,
  TutorialVisitEvent,
} from '@quiz/types';
import type { TutorialSectionRepository } from '../../repositories/tutorial-section.repository';
import type { TutorialSection } from '../../schema/tutorial-sections';

// Mock section repository for hierarchy validation
class MockSectionRepository {
  private sections: Map<string, TutorialSection> = new Map();

  // Mock method to match TutorialSectionRepository interface
  async getTutorialByPageIdentity(
    subtopicId: string,
    navigationNodeId: string,
    brandId: string = 'shared'
  ): Promise<TutorialSection | undefined> {
    const key = `${subtopicId}:${navigationNodeId}:${brandId}`;
    return this.sections.get(key);
  }

  // Test helper to register valid hierarchies
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

  clear(): void {
    this.sections.clear();
  }
}

// Mock repository
class MockNavigationProgressRepository implements ITutorialNavigationProgressRepository {
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

  async getProgressForSubtopic(
    userId: string,
    subtopicId: string
  ): Promise<TutorialNavigationProgressRecord[]> {
    return Array.from(this.records.values()).filter(
      (r) => r.userId === userId && r.subtopicId === subtopicId
    );
  }

  async createProgress(data: TutorialNavigationProgressCreateInput): Promise<TutorialNavigationProgressRecord> {
    const key = `${data.userId}:${data.navigationNodeId}`;
    const existing = this.records.get(key);
    if (existing) return existing;

    const record: TutorialNavigationProgressRecord = {
      id: `id-${Date.now()}`,
      userId: data.userId,
      navigationNodeId: data.navigationNodeId,
      sectionId: data.sectionId ?? null,
      subtopicId: data.subtopicId,
      status: 'not_started',
      completedBlocks: [],
      timeSpentActiveSec: 0,
      visitCount: 0,
      revisionCount: 0,
      lastSessionId: null,
      firstViewedAt: null,
      lastViewedAt: null,
      completedAt: null,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    this.records.set(key, record);
    return record;
  }

  async markBlockCompleted(event: TutorialBlockCompletionEvent): Promise<TutorialNavigationProgressRecord> {
    const key = `${event.userId}:${event.navigationNodeId}`;
    let record = this.records.get(key);

    if (!record) {
      record = await this.createProgress({
        userId: event.userId,
        navigationNodeId: event.navigationNodeId,
        sectionId: event.sectionId,
        subtopicId: event.subtopicId,
      });
    }

    // Check if already completed
    const alreadyCompleted = record.completedBlocks.some(
      (b) => b.blockId === event.blockId && b.blockVersion === event.blockVersion
    );

    if (!alreadyCompleted) {
      record.completedBlocks = [
        ...record.completedBlocks,
        {
          blockId: event.blockId,
          blockVersion: event.blockVersion,
          completedAt: new Date().toISOString(),
        },
      ];

      if (record.status === 'not_started') {
        record.status = 'in_progress';
      }
    }

    record.lastViewedAt = new Date();
    this.records.set(key, record);
    return record;
  }

  async isBlockCompleted(
    userId: string,
    navigationNodeId: string,
    blockId: string,
    blockVersion?: string
  ): Promise<boolean> {
    const record = await this.getProgress(userId, navigationNodeId);
    if (!record) return false;

    if (blockVersion) {
      return record.completedBlocks.some(
        (b) => b.blockId === blockId && b.blockVersion === blockVersion
      );
    }

    return record.completedBlocks.some((b) => b.blockId === blockId);
  }

  async recordTime(event: TutorialTimeUpdateEvent): Promise<TutorialNavigationProgressRecord> {
    const key = `${event.userId}:${event.navigationNodeId}`;
    let record = this.records.get(key);

    if (!record) {
      record = await this.createProgress({
        userId: event.userId,
        navigationNodeId: event.navigationNodeId,
        subtopicId: event.subtopicId,
      });
      record.timeSpentActiveSec = event.timeSpentActiveSec;
      record.firstViewedAt = new Date(); // Set timestamp when first tracked
      record.lastViewedAt = new Date();
      this.records.set(key, record);
      return record;
    }

    record.timeSpentActiveSec += event.timeSpentActiveSec;
    record.lastViewedAt = new Date();
    this.records.set(key, record);
    return record;
  }

  async recordVisit(event: TutorialVisitEvent): Promise<TutorialNavigationProgressRecord> {
    const key = `${event.userId}:${event.navigationNodeId}`;
    let record = this.records.get(key);

    if (!record) {
      record = await this.createProgress({
        userId: event.userId,
        navigationNodeId: event.navigationNodeId,
        subtopicId: event.subtopicId,
      });
      record.visitCount = 1;
      record.lastSessionId = event.sessionId;
      record.firstViewedAt = new Date();
      record.lastViewedAt = new Date();
      this.records.set(key, record);
      return record;
    }

    // Session transition logic (matches repository atomic logic)
    // Only increment when sessionId CHANGES
    const isSessionChange = record.lastSessionId !== event.sessionId;

    if (isSessionChange) {
      record.visitCount += 1;

      // Revision = new session + already completed
      if (record.status === 'completed') {
        record.revisionCount += 1;
      }

      if (!record.firstViewedAt) {
        record.firstViewedAt = new Date();
      }
    }

    record.lastSessionId = event.sessionId;
    record.lastViewedAt = new Date();
    this.records.set(key, record);
    return record;
  }

  async incrementRevision(
    userId: string,
    navigationNodeId: string
  ): Promise<TutorialNavigationProgressRecord> {
    const key = `${userId}:${navigationNodeId}`;
    const record = this.records.get(key);
    if (!record) throw new Error('Progress not found');

    record.revisionCount += 1;
    record.visitCount += 1;
    this.records.set(key, record);
    return record;
  }

  async completeNode(
    userId: string,
    navigationNodeId: string
  ): Promise<TutorialNavigationProgressRecord> {
    const key = `${userId}:${navigationNodeId}`;
    const record = this.records.get(key);
    if (!record) throw new Error('Progress not found');

    if (record.status !== 'completed') {
      record.status = 'completed';
      record.completedAt = new Date();
    }

    this.records.set(key, record);
    return record;
  }

  async getCompletedNodes(userId: string, subtopicId: string): Promise<string[]> {
    return Array.from(this.records.values())
      .filter(
        (r) =>
          r.userId === userId &&
          r.subtopicId === subtopicId &&
          r.status === 'completed'
      )
      .map((r) => r.navigationNodeId);
  }

  async isNodeComplete(userId: string, navigationNodeId: string): Promise<boolean> {
    const record = await this.getProgress(userId, navigationNodeId);
    return record?.status === 'completed';
  }

  // Test helpers
  clear(): void {
    this.records.clear();
  }

  setRecord(record: TutorialNavigationProgressRecord): void {
    const key = `${record.userId}:${record.navigationNodeId}`;
    this.records.set(key, record);
  }
}

describe('LearningProgressService', () => {
  let service: LearningProgressService;
  let mockRepo: MockNavigationProgressRepository;
  let mockSectionRepo: MockSectionRepository;

  beforeEach(() => {
    mockRepo = new MockNavigationProgressRepository();
    mockSectionRepo = new MockSectionRepository();
    
    // Register default valid hierarchy for tests
    mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1');
    mockSectionRepo.registerSection('subtopic-1', 'node-2', 'section-2');
    mockSectionRepo.registerSection('subtopic-2', 'node-3', 'section-3');
    
    service = new LearningProgressService(mockRepo, mockSectionRepo as unknown as TutorialSectionRepository);
  });

  // ============================================================
  // IDENTITY VALIDATION
  // ============================================================

  describe('Identity Validation', () => {
    const testIdentity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
    
    it('rejects invalid userId', async () => {
      const invalidIdentity: AuthenticatedIdentity = { userId: '', brand: 'shared' };
      await expect(
        service.getNavigationProgress(invalidIdentity, 'node-1', 'subtopic-1')
      ).rejects.toThrow('Invalid userId');
    });

    it('rejects invalid navigationNodeId', async () => {
      await expect(
        service.getNavigationProgress(testIdentity, '', 'subtopic-1')
      ).rejects.toThrow('Invalid navigationNodeId');
    });

    it('rejects invalid sessionId on visit', async () => {
      await expect(
        service.recordVisit(testIdentity, 'node-1', 'subtopic-1', '')
      ).rejects.toThrow('Invalid sessionId');
    });

    it('accepts valid identity', async () => {
      const result = await service.getNavigationProgress(
        testIdentity,
        'node-1',
        'subtopic-1'
      );

      expect(result.navigationNodeId).toBe('node-1');
    });
  });

  // ============================================================
  // VISIT SEMANTICS
  // ============================================================

  describe('Visit Semantics', () => {
    it('first visit creates progress with visitCount=1', async () => {
      const result = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A'
      );

      expect(result.visitCount).toBe(1);
      expect(result.firstViewedAt).toBeTruthy();
      expect(result.lastViewedAt).toBeTruthy();
    });

    it('same session does not increment visitCount', async () => {
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A');
      const result = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A'
      );

      expect(result.visitCount).toBe(1);
    });

    it('new session increments visitCount', async () => {
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A');
      const result = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-B'
      );

      expect(result.visitCount).toBe(2);
    });

    it('preserves firstViewedAt across sessions', async () => {
      const first = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A'
      );
      const second = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-B'
      );

      expect(first.firstViewedAt).toEqual(second.firstViewedAt);
    });
  });

  // ============================================================
  // REVISION SEMANTICS
  // ============================================================

  describe('Revision Semantics', () => {
    it('incomplete node revisit does not increment revision', async () => {
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A');
      const result = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-B'
      );

      expect(result.revisionCount).toBe(0);
    });

    it('completed node revisit in new session increments revision', async () => {
      // Create progress and visit once
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A');

      // NOW mark as completed (after first visit established)
      const progress = await mockRepo.getProgress('user-1', 'node-1');
      progress!.status = 'completed';
      mockRepo.setRecord(progress!);

      // SECOND visit in new session should increment revision
      // because: (1) status is completed AND (2) sessionId changed
      const result = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-B'
      );

      // After two visits: visit count should be 2, revision count should be 1
      expect(result.visitCount).toBe(2);
      expect(result.revisionCount).toBe(1);
    });

    it('repeated visit in same session does not increment revision', async () => {
      // Visit once
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A');

      // Mark as completed
      const progress = await mockRepo.getProgress('user-1', 'node-1');
      progress!.status = 'completed';
      mockRepo.setRecord(progress!);

      // Second visit in SAME session - should NOT increment revision
      const result = await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A'
      );

      // Visit count should remain 1 (same session), revision count should remain 0
      expect(result.visitCount).toBe(1);
      expect(result.revisionCount).toBe(0);
    });
  });

  // ============================================================
  // BLOCK COMPLETION
  // ============================================================

  describe('Block Completion', () => {
    it('valid block completion accepted', async () => {
      const result = await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'section-1', 'block-D1', 'definition', 'D1'
      );

      expect(result.completedBlocks).toHaveLength(1);
      expect(result.completedBlocks[0].blockId).toBe('block-D1');
      expect(result.completedBlocks[0].blockVersion).toBe('D1');
    });

    it('rejects invalid blockId', async () => {
      const testIdentity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      await expect(
        service.recordBlockCompletion(
          testIdentity,
          'node-1',
          'subtopic-1',
          'section-1',
          '', // Invalid
          'definition',
          'D1'
        )
      ).rejects.toThrow('Invalid blockId');
    });

    it('rejects invalid blockVersion', async () => {
      const testIdentity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      await expect(
        service.recordBlockCompletion(
          testIdentity,
          'node-1',
          'subtopic-1',
          'section-1',
          'block-D1',
          'definition',
          '' // Invalid
        )
      ).rejects.toThrow('Invalid blockVersion');
    });

    it('duplicate block completion remains idempotent', async () => {
      await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'section-1', 'block-D1', 'definition', 'D1'
      );

      const result = await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'section-1', 'block-D1', 'definition', 'D1'
      );

      expect(result.completedBlocks).toHaveLength(1);
    });

    it('different blockVersion creates new completion', async () => {
      await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'section-1', 'block-D1', 'definition', 'D1'
      );

      const result = await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'section-1', 'block-D1', 'definition', 'D2' // Different version
      );

      expect(result.completedBlocks).toHaveLength(2);
    });
  });

  // ============================================================
  // PROGRESS CALCULATION
  // ============================================================

  describe('Progress Calculation', () => {
    it('calculates 0% with no completed blocks', () => {
      const percentage = service.calculateProgressPercentage(
        [],
        [
          { blockId: 'block-D1', blockVersion: 'D1' },
          { blockId: 'block-C1', blockVersion: 'C1' },
        ]
      );

      expect(percentage).toBe(0);
    });

    it('calculates partial progress', () => {
      const completed: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2024-01-01' },
      ];

      const percentage = service.calculateProgressPercentage(completed, [
        { blockId: 'block-D1', blockVersion: 'D1' },
        { blockId: 'block-C1', blockVersion: 'C1' },
      ]);

      expect(percentage).toBe(50);
    });

    it('calculates 100% with all blocks completed', () => {
      const completed: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2024-01-01' },
        { blockId: 'block-C1', blockVersion: 'C1', completedAt: '2024-01-01' },
      ];

      const percentage = service.calculateProgressPercentage(completed, [
        { blockId: 'block-D1', blockVersion: 'D1' },
        { blockId: 'block-C1', blockVersion: 'C1' },
      ]);

      expect(percentage).toBe(100);
    });

    it('handles zero required blocks safely', () => {
      const percentage = service.calculateProgressPercentage([], []);

      expect(percentage).toBe(100); // Vacuously complete
    });
  });

  // ============================================================
  // NODE COMPLETION
  // ============================================================

  describe('Node Completion', () => {
    it('prevents completion with incomplete required blocks', async () => {
      // Setup canonical content with 2 required blocks
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
            { id: 'block-C1', version: 'C1' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      await expect(
        service.completeNavigationNode({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1')
      ).rejects.toThrow('Cannot complete node');
    });

    it('allows completion with all required blocks', async () => {
      // Setup canonical content with 2 required blocks
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
            { id: 'block-C1', version: 'C1' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // Complete required blocks
      await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', null, 'block-D1', 'definition', 'D1'
      );
      await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', null, 'block-C1', 'code', 'C1'
      );

      const result = await service.completeNavigationNode({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeTruthy();
    });

    it('completed node remains completed on repeat request', async () => {
      // Setup canonical content with 1 required block
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      await service.recordBlockCompletion({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', null, 'block-D1', 'definition', 'D1'
      );

      await service.completeNavigationNode({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1');

      const result = await service.completeNavigationNode({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1');

      expect(result.status).toBe('completed');
    });
  });

  // ============================================================
  // SECURITY: A3 COMPLETION AUTHORITY BOUNDARY
  // ============================================================

  describe('Security: Completion Authority Boundary', () => {
    it('TEST A: prevents client from defining completion requirements', async () => {
      // SECURITY: Client cannot supply requiredBlocks parameter
      // Server resolves canonical requirements from tutorial_sections
      
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      
      // Canonical content requires D1, C1, S1
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
            { id: 'block-C1', version: 'C1' } as any,
            { id: 'block-S1', version: 'S1' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // User only completed D1 (not all requirements)
      await service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', null, 'block-D1', 'definition', 'D1');

      // Completion should fail - server resolves [D1, C1, S1], user only has [D1]
      await expect(
        service.completeNavigationNode(identity, 'node-1', 'subtopic-1')
      ).rejects.toThrow('Cannot complete node');
    });

    it('TEST B: prevents subset requirement bypass', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      
      // Canonical requires 3 blocks
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
            { id: 'block-C1', version: 'C1' } as any,
            { id: 'block-S1', version: 'S1' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // User completed only 1 block
      await service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', null, 'block-D1', 'definition', 'D1');

      // Server resolves full requirements, rejects incomplete
      await expect(
        service.completeNavigationNode(identity, 'node-1', 'subtopic-1')
      ).rejects.toThrow('Cannot complete node');
    });

    it('TEST C: canonical requirements determine completion', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      
      // Canonical content defines exactly 1 required block
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // User completed the canonically-required block
      await service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', null, 'block-D1', 'definition', 'D1');

      // Completion succeeds - canonical requirement satisfied
      const result = await service.completeNavigationNode(identity, 'node-1', 'subtopic-1');
      expect(result.status).toBe('completed');
    });

    it('TEST D: enforces blockId + blockVersion identity', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      
      // Canonical requires specific block-def with D1
      mockSectionRepo.clear();
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-def', version: 'D1', type: 'definition' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // User completed DIFFERENT blockId (block-other) even though same version (D1)
      await service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', null, 'block-other', 'definition', 'D1');

      // Completion should fail - blockId mismatch (block-other != block-def)
      // Verifies matching on blockId + blockVersion, not just version
      await expect(
        service.completeNavigationNode(identity, 'node-1', 'subtopic-1')
      ).rejects.toThrow('Cannot complete node');
    });

    it('TEST E: allows server-resolved empty requirements', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      
      // Canonical content has NO D1/C1/S1 blocks (informational page)
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [], // Server resolves []
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // Completion succeeds - server-resolved [] is valid (vacuously complete)
      const result = await service.completeNavigationNode(identity, 'node-1', 'subtopic-1');
      expect(result.status).toBe('completed');
      expect(result.progressPercentage).toBe(100);
    });

    it('TEST F: enforces brand isolation in canonical resolution', async () => {
      // Brand A content
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'brand-a');
      const sectionA = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'brand-a');
      if (sectionA) {
        sectionA.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
            { id: 'block-C1', version: 'C1' } as any,
            { id: 'block-S1', version: 'S1' } as any,
          ],
        };
      }

      // Brand B content (fewer requirements)
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'brand-b');
      const sectionB = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'brand-b');
      if (sectionB) {
        sectionB.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
          ],
        };
      }

      const identityA: AuthenticatedIdentity = { userId: 'user-1', brand: 'brand-a' };

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // User completed only D1
      await service.recordBlockCompletion(identityA, 'node-1', 'subtopic-1', null, 'block-D1', 'definition', 'D1');

      // Brand A requirements apply (D1, C1, S1) - not Brand B's (D1 only)
      await expect(
        service.completeNavigationNode(identityA, 'node-1', 'subtopic-1')
      ).rejects.toThrow('Cannot complete node');
    });

    it('TEST G: rejects mismatched hierarchy (navigationNodeId/subtopicId)', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      
      // Register only: subtopic-1 + node-1
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // Attempt with UNRELATED subtopic (subtopic-2 + node-1 not registered)
      await expect(
        service.completeNavigationNode(identity, 'node-1', 'subtopic-2')
      ).rejects.toThrow('does not belong to subtopic');
    });

    it('TEST H: DTO contains server-resolved canonical requirements', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      
      // Canonical defines D1, C1
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [
            { id: 'block-D1', version: 'D1' } as any,
            { id: 'block-C1', version: 'C1' } as any,
          ],
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      // Complete all canonical requirements
      await service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', null, 'block-D1', 'definition', 'D1');
      await service.recordBlockCompletion(identity, 'node-1', 'subtopic-1', null, 'block-C1', 'code', 'C1');

      const result = await service.completeNavigationNode(identity, 'node-1', 'subtopic-1');

      // DTO requiredBlocks must match canonical content
      expect(result.requiredBlocks).toHaveLength(2);
      expect(result.requiredBlocks).toContainEqual({ blockId: 'block-D1', blockVersion: 'D1' });
      expect(result.requiredBlocks).toContainEqual({ blockId: 'block-C1', blockVersion: 'C1' });
    });
  });

  // ============================================================
  // TIME TRACKING
  // ============================================================

  describe('Time Tracking', () => {
    it('valid time update accepted', async () => {
      const result = await service.recordActiveTime({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 60
      );

      expect(result.timeSpentActiveSec).toBe(60);
    });

    it('rejects negative time', async () => {
      const testIdentity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      await expect(
        service.recordActiveTime(testIdentity, 'node-1', 'subtopic-1', -10)
      ).rejects.toThrow('Time spent cannot be negative');
    });

    it('rejects unrealistic time increment', async () => {
      await expect(
        service.recordActiveTime({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 5000)
      ).rejects.toThrow('Time increment too large');
    });

    it('accumulates time across updates', async () => {
      await service.recordActiveTime({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 60);
      const result = await service.recordActiveTime({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 30
      );

      expect(result.timeSpentActiveSec).toBe(90);
    });
  });

  // ============================================================
  // LEARNING STATE
  // ============================================================

  describe('Learning State', () => {
    it('returns not_started for new progress', () => {
      const state = service.determineLearningState('not_started');
      expect(state).toBe('not_started');
    });

    it('returns in_progress for active learning', () => {
      const state = service.determineLearningState('in_progress');
      expect(state).toBe('in_progress');
    });

    it('returns completed for finished nodes', () => {
      const state = service.determineLearningState('completed');
      expect(state).toBe('completed');
    });
  });

  // ============================================================
  // PARENT ROLL-UP
  // ============================================================

  describe('Parent Roll-up', () => {
    it('all children not-started → not-started', () => {
      const state = service.aggregateParentState([
        'not_started',
        'not_started',
        'not_started',
      ]);
      expect(state).toBe('not_started');
    });

    it('any child in-progress → in-progress', () => {
      const state = service.aggregateParentState([
        'not_started',
        'in_progress',
        'completed',
      ]);
      expect(state).toBe('in_progress');
    });

    it('all available children completed → completed', () => {
      const state = service.aggregateParentState(['completed', 'completed']);
      expect(state).toBe('completed');
    });

    it('all children unavailable → unavailable', () => {
      const state = service.aggregateParentState([
        'not_available',
        'not_available',
      ]);
      expect(state).toBe('not_available');
    });

    it('mixed completed + not-started → in-progress', () => {
      const state = service.aggregateParentState([
        'completed',
        'not_started',
        'completed',
      ]);
      expect(state).toBe('in_progress');
    });

    it('empty children → not-available', () => {
      const state = service.aggregateParentState([]);
      expect(state).toBe('not_available');
    });
  });

  // ============================================================
  // SUBTOPIC PROGRESS
  // ============================================================

  describe('Subtopic Progress', () => {
    it('returns all navigation nodes for subtopic', async () => {
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-1', 'subtopic-1', 'session-A');
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-2', 'subtopic-1', 'session-A');
      await service.recordVisit({ userId: 'user-1', brand: 'shared' }, 'node-3', 'subtopic-2', 'session-A');

      const result = await service.getSubtopicProgress({ userId: 'user-1', brand: 'shared' }, 'subtopic-1');

      expect(result).toHaveLength(2);
      expect(result.map((p) => p.navigationNodeId)).toContain('node-1');
      expect(result.map((p) => p.navigationNodeId)).toContain('node-2');
    });

    it('returns empty array for subtopic with no progress', async () => {
      const result = await service.getSubtopicProgress({ userId: 'user-1', brand: 'shared' }, 'subtopic-999');

      expect(result).toHaveLength(0);
    });
  });

  // ============================================================
  // PHASE 2.6-A3 CORRECTIVE AUDIT - NEW TESTS
  // ============================================================

  describe('Authorization Boundary', () => {
    it('isolates progress by authenticated identity', async () => {
      const userA: AuthenticatedIdentity = { userId: 'user-A', brand: 'shared' };
      const userB: AuthenticatedIdentity = { userId: 'user-B', brand: 'shared' };

      // User A creates progress
      await service.recordVisit(userA, 'node-1', 'subtopic-1', 'session-A');

      // User B should get their own progress (not user A's)
      const progressB = await service.getNavigationProgress(userB, 'node-1', 'subtopic-1');
      
      expect(progressB.visitCount).toBe(0); // User B has no visits yet
      
      // Verify user A's progress is separate
      const progressA = await service.getNavigationProgress(userA, 'node-1', 'subtopic-1');
      expect(progressA.visitCount).toBe(1);
    });

    it('validates authenticated identity on all operations', async () => {
      const validIdentity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };
      const emptyIdentity: AuthenticatedIdentity = { userId: '', brand: 'shared' };

      await expect(
        service.getNavigationProgress(emptyIdentity, 'node-1', 'subtopic-1')
      ).rejects.toThrow('Invalid userId');

      await expect(
        service.recordVisit(emptyIdentity, 'node-1', 'subtopic-1', 'session-1')
      ).rejects.toThrow('Invalid userId');

      await expect(
        service.recordBlockCompletion(
          emptyIdentity,
          'node-1',
          'subtopic-1',
          null,
          'block-1',
          'definition',
          'D1'
        )
      ).rejects.toThrow('Invalid userId');

      await expect(
        service.recordActiveTime(emptyIdentity, 'node-1', 'subtopic-1', 60)
      ).rejects.toThrow('Invalid userId');
    });
  });

  describe('Hierarchy Validation', () => {
    it('rejects navigationNode not belonging to subtopic', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      // node-1 belongs to subtopic-1, not subtopic-2
      await expect(
        service.getNavigationProgress(identity, 'node-1', 'subtopic-2')
      ).rejects.toThrow('does not belong to subtopic');
    });

    it('rejects mismatched sectionId', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      // node-1 maps to section-1, not section-2
      await expect(
        service.getNavigationProgress(identity, 'node-1', 'subtopic-1', 'section-2')
      ).rejects.toThrow('Section ID mismatch');
    });

    it('rejects non-existent navigationNode', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      await expect(
        service.getNavigationProgress(identity, 'non-existent-node', 'subtopic-1')
      ).rejects.toThrow('does not belong to subtopic');
    });

    it('validates hierarchy on visit', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      await expect(
        service.recordVisit(identity, 'node-1', 'subtopic-2', 'session-1')
      ).rejects.toThrow('does not belong to subtopic');
    });

    it('validates hierarchy on block completion', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      await expect(
        service.recordBlockCompletion(
          identity,
          'node-1',
          'subtopic-2',
          null,
          'block-1',
          'definition',
          'D1'
        )
      ).rejects.toThrow('does not belong to subtopic');
    });
  });

  describe('Progress Percentage Calculation', () => {
    it('calculates 0% with no completed blocks', () => {
      const percentage = service.calculateProgressPercentage(
        [],
        [
          { blockId: 'block-D1', blockVersion: 'D1' },
          { blockId: 'block-C1', blockVersion: 'C1' },
        ]
      );

      expect(percentage).toBe(0);
    });

    it('calculates 50% with half completed', () => {
      const completed: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2024-01-01' },
      ];

      const percentage = service.calculateProgressPercentage(completed, [
        { blockId: 'block-D1', blockVersion: 'D1' },
        { blockId: 'block-C1', blockVersion: 'C1' },
      ]);

      expect(percentage).toBe(50);
    });

    it('calculates 100% with all completed', () => {
      const completed: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2024-01-01' },
        { blockId: 'block-C1', blockVersion: 'C1', completedAt: '2024-01-01' },
      ];

      const percentage = service.calculateProgressPercentage(completed, [
        { blockId: 'block-D1', blockVersion: 'D1' },
        { blockId: 'block-C1', blockVersion: 'C1' },
      ]);

      expect(percentage).toBe(100);
    });

    it('calculates 33% with 1 of 3 completed', () => {
      const completed: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2024-01-01' },
      ];

      const percentage = service.calculateProgressPercentage(completed, [
        { blockId: 'block-D1', blockVersion: 'D1' },
        { blockId: 'block-C1', blockVersion: 'C1' },
        { blockId: 'block-S1', blockVersion: 'S1' },
      ]);

      expect(percentage).toBe(33);
    });

    it('calculates 67% with 2 of 3 completed', () => {
      const completed: CompletedBlockRecord[] = [
        { blockId: 'block-D1', blockVersion: 'D1', completedAt: '2024-01-01' },
        { blockId: 'block-C1', blockVersion: 'C1', completedAt: '2024-01-01' },
      ];

      const percentage = service.calculateProgressPercentage(completed, [
        { blockId: 'block-D1', blockVersion: 'D1' },
        { blockId: 'block-C1', blockVersion: 'C1' },
        { blockId: 'block-S1', blockVersion: 'S1' },
      ]);

      expect(percentage).toBe(67);
    });
  });

  describe('Zero-Required-Blocks Semantic', () => {
    it('returns 100% progress for zero required blocks', () => {
      const percentage = service.calculateProgressPercentage([], []);
      expect(percentage).toBe(100);
    });

    it('allows completion with zero required blocks (vacuously complete)', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      // Setup canonical content with NO required blocks (D1/C1/S1)
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [], // No D1/C1/S1 blocks = informational content
        };
      }

      await mockRepo.createProgress({
        userId: 'user-1',
        navigationNodeId: 'node-1',
        subtopicId: 'subtopic-1',
      });

      const result = await service.completeNavigationNode(
        identity,
        'node-1',
        'subtopic-1' // Server resolves []
      );

      expect(result.status).toBe('completed');
      expect(result.progressPercentage).toBe(100);
    });

    it('marks informational content as complete without blocks', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      // Setup canonical content with NO required blocks (D1/C1/S1)
      mockSectionRepo.registerSection('subtopic-1', 'node-1', 'section-1', 'shared');
      const section = await mockSectionRepo.getTutorialByPageIdentity('subtopic-1', 'node-1', 'shared');
      if (section) {
        section.content = {
          schemaVersion: 1,
          blocks: [], // Informational page - no interactive blocks
        };
      }

      // Create progress for informational content (no interactive blocks)
      await service.getNavigationProgress(identity, 'node-1', 'subtopic-1');

      // Should be able to complete immediately (server resolves [])
      const result = await service.completeNavigationNode(identity, 'node-1', 'subtopic-1');

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeTruthy();
      expect(result.progressPercentage).toBe(100);
    });
  });

  describe('Time Event Semantics', () => {
    it('creates progress record with visitCount=0 when recording time without visit', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      // Record time before any visit
      const result = await service.recordActiveTime(
        identity,
        'node-1',
        'subtopic-1',
        60
      );

      expect(result.timeSpentActiveSec).toBe(60);
      expect(result.visitCount).toBe(0); // No visit yet
      expect(result.status).toBe('not_started');
    });

    it('time tracking does not manufacture visit', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      // Multiple time updates
      await service.recordActiveTime(identity, 'node-1', 'subtopic-1', 30);
      await service.recordActiveTime(identity, 'node-1', 'subtopic-1', 40);
      const result = await service.recordActiveTime(identity, 'node-1', 'subtopic-1', 50);

      expect(result.timeSpentActiveSec).toBe(120);
      expect(result.visitCount).toBe(0); // Still no visit
      expect(result.firstViewedAt).toBeTruthy(); // Timestamp set
    });

    it('visit establishes proper visit semantics after time tracking', async () => {
      const identity: AuthenticatedIdentity = { userId: 'user-1', brand: 'shared' };

      // Time first
      await service.recordActiveTime(identity, 'node-1', 'subtopic-1', 60);

      // Then visit
      const result = await service.recordVisit(
        identity,
        'node-1',
        'subtopic-1',
        'session-A'
      );

      expect(result.visitCount).toBe(1); // First visit
      expect(result.timeSpentActiveSec).toBe(60); // Time preserved
    });
  });
});
