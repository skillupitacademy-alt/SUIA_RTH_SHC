/**
 * Phase 1 Integration Test
 * 
 * CRITICAL ACCEPTANCE TEST:
 * Proves that multiple independent content pages can coexist under a single subtopic
 * using the new (subtopicId, navigationNodeId, brandId) identity model.
 * 
 * Uses REAL sidebar node IDs from the actual persisted sidebar structure:
 * - what-is-java
 * - java-syntax
 * - primitive-data-types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialSectionRepository } from '../tutorial-section.repository';
import type { CreateTutorialInput } from '../tutorial-section.repository';
import type { TutorialDocument } from '@quiz/types';
import { tutorialSections } from '../../schema/tutorial-sections';
import { eq } from 'drizzle-orm';

describe('Phase 1: Page-Aware Tutorial Architecture', () => {
  const repository = new TutorialSectionRepository();

  // Use actual subtopic from database
  // This is the "What is Java?" subtopic ID from inspection
  const TEST_SUBTOPIC_ID = 'd2793da0-ea2e-49e2-a24f-f31bc27e90f3';
  const TEST_BRAND = 'shared';

  // Real sidebar node IDs from the Java sidebar tree
  const PAGE_NODE_1 = 'what-is-java';
  const PAGE_NODE_2 = 'java-syntax';
  const PAGE_NODE_3 = 'primitive-data-types';

  // Clean up before each test to ensure isolation
  beforeEach(async () => {
    // Hard delete all test records for this subtopic to ensure clean state
    await repository['dbInstance']
      .delete(tutorialSections)
      .where(eq(tutorialSections.subtopicId, TEST_SUBTOPIC_ID));
    
    // Also clean up the other subtopic used in cross-subtopic test
    await repository['dbInstance']
      .delete(tutorialSections)
      .where(eq(tutorialSections.subtopicId, 'ba9125f3-12b1-4698-9262-2da3116073a7'));
  });

  const createTestContent = (title: string): TutorialDocument => ({
    schemaVersion: 1,
    metadata: {
      estimatedReadTime: 10,
      audience: 'beginner' as const,
      tags: ['test', 'phase1'],
    },
    blocks: [
      {
        id: 'block-1',
        type: 'heading',
        content: { level: 1, text: title },
      },
      {
        id: 'block-2',
        type: 'paragraph',
        content: { text: `This is test content for ${title}` },
      },
    ],
  });

  describe('ACCEPTANCE TEST: Three Pages Under One Subtopic', () => {
    it('should create three independent tutorials for same subtopic with different navigationNodeIds', async () => {
      // Create first page
      const tutorial1Input: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1,
        brandId: TEST_BRAND,
        content: createTestContent('What Is Java?'),
        orderIndex: 1,
      };

      const tutorial1 = await repository.createTutorial(tutorial1Input);
      expect(tutorial1).toBeDefined();
      expect(tutorial1.navigationNodeId).toBe(PAGE_NODE_1);
      expect(tutorial1.subtopicId).toBe(TEST_SUBTOPIC_ID);

      // Create second page (SAME SUBTOPIC, different navigationNodeId)
      const tutorial2Input: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_2,
        brandId: TEST_BRAND,
        content: createTestContent('Java Syntax'),
        orderIndex: 2,
      };

      const tutorial2 = await repository.createTutorial(tutorial2Input);
      expect(tutorial2).toBeDefined();
      expect(tutorial2.navigationNodeId).toBe(PAGE_NODE_2);
      expect(tutorial2.subtopicId).toBe(TEST_SUBTOPIC_ID);

      // Create third page (SAME SUBTOPIC, different navigationNodeId)
      const tutorial3Input: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_3,
        brandId: TEST_BRAND,
        content: createTestContent('Primitive Data Types'),
        orderIndex: 3,
      };

      const tutorial3 = await repository.createTutorial(tutorial3Input);
      expect(tutorial3).toBeDefined();
      expect(tutorial3.navigationNodeId).toBe(PAGE_NODE_3);
      expect(tutorial3.subtopicId).toBe(TEST_SUBTOPIC_ID);

      // Verify all three have different IDs
      expect(tutorial1.id).not.toBe(tutorial2.id);
      expect(tutorial1.id).not.toBe(tutorial3.id);
      expect(tutorial2.id).not.toBe(tutorial3.id);

      // Verify we can retrieve each one independently
      const retrieved1 = await repository.getTutorialByPageIdentity(
        TEST_SUBTOPIC_ID,
        PAGE_NODE_1,
        TEST_BRAND
      );
      expect(retrieved1).toBeDefined();
      expect(retrieved1?.id).toBe(tutorial1.id);
      expect(retrieved1?.navigationNodeId).toBe(PAGE_NODE_1);

      const retrieved2 = await repository.getTutorialByPageIdentity(
        TEST_SUBTOPIC_ID,
        PAGE_NODE_2,
        TEST_BRAND
      );
      expect(retrieved2).toBeDefined();
      expect(retrieved2?.id).toBe(tutorial2.id);
      expect(retrieved2?.navigationNodeId).toBe(PAGE_NODE_2);

      const retrieved3 = await repository.getTutorialByPageIdentity(
        TEST_SUBTOPIC_ID,
        PAGE_NODE_3,
        TEST_BRAND
      );
      expect(retrieved3).toBeDefined();
      expect(retrieved3?.id).toBe(tutorial3.id);
      expect(retrieved3?.navigationNodeId).toBe(PAGE_NODE_3);

      // CRITICAL: Verify no cross-page leakage
      expect(retrieved1?.content).not.toEqual(retrieved2?.content);
      expect(retrieved1?.content).not.toEqual(retrieved3?.content);
      expect(retrieved2?.content).not.toEqual(retrieved3?.content);

      console.log('✅ Phase 1 Success: Created 3 independent pages under 1 subtopic');
    });

    it('should reject duplicate (subtopicId, navigationNodeId, brandId) combination', async () => {
      // Create first tutorial
      const input: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1,
        brandId: TEST_BRAND,
        content: createTestContent('Original Content'),
        orderIndex: 1,
      };

      await repository.createTutorial(input);

      // Attempt to create duplicate with SAME identity
      const duplicateInput: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1, // SAME navigationNodeId
        brandId: TEST_BRAND, // SAME brand
        content: createTestContent('Duplicate Content'),
        orderIndex: 2,
      };

      // Should fail due to unique constraint
      await expect(
        repository.createTutorial(duplicateInput)
      ).rejects.toThrow();

      console.log('✅ Duplicate identity rejected as expected');
    });

    it('should allow same navigationNodeId with different subtopics', async () => {
      // Assuming we have two different subtopics
      const SUBTOPIC_1 = TEST_SUBTOPIC_ID;
      const SUBTOPIC_2 = 'ba9125f3-12b1-4698-9262-2da3116073a7'; // Another "What is Java?" subtopic

      const input1: CreateTutorialInput = {
        subtopicId: SUBTOPIC_1,
        navigationNodeId: PAGE_NODE_1,
        brandId: TEST_BRAND,
        content: createTestContent('Content for Subtopic 1'),
        orderIndex: 1,
      };

      const input2: CreateTutorialInput = {
        subtopicId: SUBTOPIC_2,
        navigationNodeId: PAGE_NODE_1, // SAME navigationNodeId
        brandId: TEST_BRAND,
        content: createTestContent('Content for Subtopic 2'),
        orderIndex: 1,
      };

      const tutorial1 = await repository.createTutorial(input1);
      const tutorial2 = await repository.createTutorial(input2);

      expect(tutorial1.id).not.toBe(tutorial2.id);
      expect(tutorial1.navigationNodeId).toBe(tutorial2.navigationNodeId);
      expect(tutorial1.subtopicId).not.toBe(tutorial2.subtopicId);

      console.log('✅ Same navigationNodeId allowed for different subtopics');
    });

    it('should allow same (subtopicId, navigationNodeId) with different brands', async () => {
      const input1: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1,
        brandId: 'shared',
        content: createTestContent('Shared Brand Content'),
        orderIndex: 1,
      };

      const input2: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1, // SAME navigationNodeId
        brandId: 'realtutorialhub', // DIFFERENT brand
        content: createTestContent('RealTutorialHub Brand Content'),
        orderIndex: 1,
      };

      const tutorial1 = await repository.createTutorial(input1);
      const tutorial2 = await repository.createTutorial(input2);

      expect(tutorial1.id).not.toBe(tutorial2.id);
      expect(tutorial1.navigationNodeId).toBe(tutorial2.navigationNodeId);
      expect(tutorial1.subtopicId).toBe(tutorial2.subtopicId);
      expect(tutorial1.brandId).not.toBe(tutorial2.brandId);

      console.log('✅ Same (subtopic, navigationNode) allowed for different brands');
    });
  });

  describe('Page Identity Retrieval', () => {
    it('should retrieve tutorial by page identity', async () => {
      const input: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1,
        brandId: TEST_BRAND,
        content: createTestContent('Test Content'),
        orderIndex: 1,
      };

      const created = await repository.createTutorial(input);

      const retrieved = await repository.getTutorialByPageIdentity(
        TEST_SUBTOPIC_ID,
        PAGE_NODE_1,
        TEST_BRAND
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.navigationNodeId).toBe(PAGE_NODE_1);
    });

    it('should return null for non-existent page identity', async () => {
      const retrieved = await repository.getTutorialByPageIdentity(
        TEST_SUBTOPIC_ID,
        'non-existent-page',
        TEST_BRAND
      );

      expect(retrieved).toBeUndefined();
    });

    it('should retrieve all pages for a subtopic', async () => {
      // Create multiple pages
      await repository.createTutorial({
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1,
        brandId: TEST_BRAND,
        content: createTestContent('Page 1'),
        orderIndex: 1,
      });

      await repository.createTutorial({
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_2,
        brandId: TEST_BRAND,
        content: createTestContent('Page 2'),
        orderIndex: 2,
      });

      const pages = await repository.getPagesBySubtopic(
        TEST_SUBTOPIC_ID,
        TEST_BRAND
      );

      expect(pages.length).toBeGreaterThanOrEqual(2);
      
      const nodeIds = pages.map(p => p.navigationNodeId);
      expect(nodeIds).toContain(PAGE_NODE_1);
      expect(nodeIds).toContain(PAGE_NODE_2);
    });
  });

  describe('Soft Delete Behavior', () => {
    it('should allow recreating same identity after soft delete', async () => {
      const input: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1,
        brandId: TEST_BRAND,
        content: createTestContent('Original Content'),
        orderIndex: 1,
      };

      const original = await repository.createTutorial(input);

      // Soft delete
      await repository.deleteTutorial(original.id);

      // Should now be able to create with same identity
      const newInput: CreateTutorialInput = {
        subtopicId: TEST_SUBTOPIC_ID,
        navigationNodeId: PAGE_NODE_1, // SAME identity
        brandId: TEST_BRAND,
        content: createTestContent('New Content'),
        orderIndex: 1,
      };

      const recreated = await repository.createTutorial(newInput);
      expect(recreated.id).not.toBe(original.id);
      expect(recreated.navigationNodeId).toBe(PAGE_NODE_1);

      console.log('✅ Same identity allowed after soft delete');
    });
  });
});
