/**
 * C1-018 Composer → Storage → Delivery Integration Test
 * 
 * ARCHITECTURE UNDER TEST:
 * TutorialComposerService.createTutorial()
 *   ↓
 * tutorial_sections (JSONB blocks[])
 *   ↓
 * TutorialComposerService.appendBlockToTutorial()
 *   ↓
 * TutorialComposerService.updateTutorialContent()
 *   ↓
 * TutorialComposerService.publishTutorial()
 *   ↓
 * TutorialDeliveryService.getTutorialById()
 *   ↓
 * blocks[] preserved
 * 
 * CRITICAL BOUNDARIES TESTED:
 * ✅ CREATE with D1 block
 * ✅ APPEND C1 block #1
 * ✅ APPEND C1 block #2 (same type/version)
 * ✅ Ordering preserved [D1, C1, C1]
 * ✅ UPDATE D1 without changing block IDs
 * ✅ Single tutorial_sections row maintained
 * ✅ PUBLISH sets correct status
 * ✅ DELIVERY preserves blocks[] structure
 * ✅ DELIVERY preserves block ordering
 * ✅ DELIVERY preserves block IDs
 * ✅ CLEANUP removes only test data
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { db } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { eq, inArray, and, isNull } from 'drizzle-orm';
import type { TutorialDocument, TutorialBlock } from '@quiz/types';
import {
  tutorialComposerService,
  tutorialDeliveryService,
  type TutorialComposerServiceContext,
} from '../../index';
import {
  createC1018Fixture,
  createUpdatedDefinitionBlock,
  C1_018_MARKER,
} from './c1-018-fixture';

describe('C1-018 Composer → Storage → Delivery Integration', () => {
  let testSubtopicId: string;
  let createdTutorialIds: string[] = [];
  
  const fixture = createC1018Fixture();

  const mockContext: TutorialComposerServiceContext = {
    userId: 'c1-018-test-user',
  };

  // Use different brands for test isolation
  const TEST_BRANDS = ['realtutorialhub', 'skillup'] as const;
  const TEST_NAV_NODE_ID = 'test-page';
  let brandIndex = 0;

  function getNextBrand() {
    const brand = TEST_BRANDS[brandIndex % TEST_BRANDS.length];
    brandIndex++;
    return brand;
  }

  beforeAll(async () => {
    // Find a real subtopic for testing
    const result = await db
      .select({ id: tutorialSubtopics.id })
      .from(tutorialSubtopics)
      .limit(1);

    if (result.length === 0) {
      throw new Error(
        'No subtopics found in test database. Run seed script first.'
      );
    }

    testSubtopicId = result[0].id;
    console.log(`[C1-018] Using test subtopic: ${testSubtopicId}`);
  });

  afterEach(async () => {
    // Cleanup: Delete only tutorials created by this test
    if (createdTutorialIds.length > 0) {
      console.log(
        `[C1-018] Cleaning up ${createdTutorialIds.length} test tutorial(s)`
      );
      await db
        .delete(tutorialSections)
        .where(inArray(tutorialSections.id, createdTutorialIds));

      // Verify cleanup
      const remaining = await db
        .select({ id: tutorialSections.id })
        .from(tutorialSections)
        .where(inArray(tutorialSections.id, createdTutorialIds));

      expect(remaining.length).toBe(0);

      createdTutorialIds = [];
    }
  });

  describe('01. CREATE with D1 block', () => {
    it('should create tutorial with single Definition D1 block via TutorialComposerService', async () => {
      const brand = getNextBrand();

      // CREATE via service
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );

      // Track for cleanup
      createdTutorialIds.push(tutorial.id);

      // Verify tutorial created
      expect(tutorial.id).toBeTruthy();
      expect(tutorial.subtopicId).toBe(testSubtopicId);
      expect(tutorial.brandId).toBe(brand);
      expect(tutorial.status).toBe('draft');

      // Verify content structure
      const content = tutorial.content as TutorialDocument;
      expect(content.schemaVersion).toBe(1);
      expect(Array.isArray(content.blocks)).toBe(true);
      expect(content.blocks.length).toBe(1);

      // Verify D1 block
      const block = content.blocks[0];
      expect(block.type).toBe('definition');
      if (block.type === 'definition') {
        expect(block.version).toBe('D1');
      }
      expect(block.id).toBe(fixture.definitionId);
      expect(block.id).toBeTruthy();
    });
  });

  describe('02. APPEND first C1 block', () => {
    it('should append Code C1 block #1 via appendBlockToTutorial()', async () => {
      const brand = getNextBrand();

      // CREATE initial tutorial
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      // APPEND C1 block
      const updated = await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      // Verify two blocks exist
      const content = updated.content as TutorialDocument;
      expect(content.blocks.length).toBe(2);

      // Verify first block is still D1
      const firstBlock = content.blocks[0];
      expect(firstBlock.type).toBe('definition');
      if (firstBlock.type === 'definition') {
        expect(firstBlock.version).toBe('D1');
      }
      expect(firstBlock.id).toBe(fixture.definitionId);

      // Verify second block is C1
      const c1Block = content.blocks[1];
      expect(c1Block.type).toBe('code');
      if (c1Block.type === 'code' && 'version' in c1Block) {
        expect(c1Block.version).toBe('C1');
      }
      expect(c1Block.id).toBe(fixture.codeId1);
      expect(c1Block.id).toBeTruthy();

      // Verify IDs are unique
      expect(c1Block.id).not.toBe(content.blocks[0].id);
    });
  });

  describe('03. APPEND second C1 block', () => {
    it('should append Code C1 block #2 (same type/version) via appendBlockToTutorial()', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND first C1
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      // APPEND second C1 block
      const updated = await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      // Verify three blocks exist
      const content = updated.content as TutorialDocument;
      expect(content.blocks.length).toBe(3);

      // Verify third block is C1
      const c1Block2 = content.blocks[2];
      expect(c1Block2.type).toBe('code');
      if (c1Block2.type === 'code' && 'version' in c1Block2) {
        expect(c1Block2.version).toBe('C1');
      }
      expect(c1Block2.id).toBe(fixture.codeId2);

      // Verify all IDs are unique
      const allIds = content.blocks.map((b) => b.id);
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('04. Block ordering preserved [D1, C1, C1]', () => {
    it('should preserve exact insertion order', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND + APPEND
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      const updated = await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      // Verify ordering
      const content = updated.content as TutorialDocument;
      expect(content.blocks.length).toBe(3);

      const block0 = content.blocks[0];
      expect(block0.type).toBe('definition');
      if (block0.type === 'definition') {
        expect(block0.version).toBe('D1');
      }

      const block1 = content.blocks[1];
      expect(block1.type).toBe('code');
      if (block1.type === 'code' && 'version' in block1) {
        expect(block1.version).toBe('C1');
      }

      const block2 = content.blocks[2];
      expect(block2.type).toBe('code');
      if (block2.type === 'code' && 'version' in block2) {
        expect(block2.version).toBe('C1');
      }

      // Verify this is not [C1, D1, C1] or any other order
      const types = content.blocks.map((b) => b.type);
      expect(types).toEqual(['definition', 'code', 'code']);
    });
  });

  describe('05. UPDATE D1 without changing block IDs', () => {
    it('should update D1 content via updateTutorialContent() preserving all IDs', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND + APPEND
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      // Get current tutorial
      const current = await tutorialComposerService.getTutorial(tutorial.id);
      const currentContent = current.content as TutorialDocument;

      // Capture original IDs
      const originalDefinitionId = currentContent.blocks[0].id;
      const originalCodeId1 = currentContent.blocks[1].id;
      const originalCodeId2 = currentContent.blocks[2].id;

      // UPDATE D1 content
      const updatedDefinitionBlock = createUpdatedDefinitionBlock(
        originalDefinitionId
      );
      const updatedDocument: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          updatedDefinitionBlock,
          currentContent.blocks[1],
          currentContent.blocks[2],
        ],
      };

      const updated = await tutorialComposerService.updateTutorialContent(
        tutorial.id,
        { content: updatedDocument },
        mockContext
      );

      // Verify IDs unchanged
      const content = updated.content as TutorialDocument;
      expect(content.blocks[0].id).toBe(originalDefinitionId);
      expect(content.blocks[1].id).toBe(originalCodeId1);
      expect(content.blocks[2].id).toBe(originalCodeId2);

      // Verify D1 content changed
      const updatedBlock = content.blocks[0];
      if (updatedBlock.type === 'definition') {
        expect(updatedBlock.content.page.title).toContain('Updated');
      }
    });
  });

  describe('06. Single tutorial_sections row maintained', () => {
    it('should maintain exactly one row per (subtopicId, brandId)', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND + APPEND
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      // Verify single row via SQL
      const rows = await db
        .select({ id: tutorialSections.id })
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.subtopicId, testSubtopicId),
            eq(tutorialSections.brandId, brand),
            isNull(tutorialSections.deletedAt)
          )
        );

      expect(rows.length).toBe(1);
      expect(rows[0].id).toBe(tutorial.id);
    });
  });

  describe('07. PUBLISH sets correct status', () => {
    it('should publish tutorial via publishTutorial()', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND + APPEND
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      // PUBLISH
      const published = await tutorialComposerService.publishTutorial(
        tutorial.id,
        mockContext
      );

      // Verify status
      expect(published.status).toBe('deployed');
      expect(published.publishedAt).toBeTruthy();

      // Verify content unchanged
      const content = published.content as TutorialDocument;
      expect(content.blocks.length).toBe(3);
    });
  });

  describe('08. DELIVERY preserves blocks[] structure', () => {
    it('should deliver blocks[] via TutorialDeliveryService.getTutorialById()', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND + APPEND + PUBLISH
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // DELIVERY
      const delivery = await tutorialDeliveryService.getTutorialById(
        testSubtopicId,
        {
          brandId: brand,
          includeUnpublished: false,
        }
      );

      // Verify tutorial delivered
      expect(delivery.tutorial).toBeTruthy();
      expect(delivery.tutorial).not.toBeNull();

      // Verify blocks structure
      const content = delivery.tutorial!.content as TutorialDocument;
      expect(content.blocks).toBeTruthy();
      expect(Array.isArray(content.blocks)).toBe(true);
      expect(content.blocks.length).toBe(3);
    });
  });

  describe('09. DELIVERY preserves block ordering', () => {
    it('should preserve [D1, C1, C1] ordering in delivery', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND + APPEND + PUBLISH
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // DELIVERY
      const delivery = await tutorialDeliveryService.getTutorialById(
        testSubtopicId,
        {
          brandId: brand,
          includeUnpublished: false,
        }
      );

      // Verify ordering
      const content = delivery.tutorial!.content as TutorialDocument;
      const blocks = content.blocks;

      const block0 = blocks[0];
      expect(block0.type).toBe('definition');
      if (block0.type === 'definition') {
        expect(block0.version).toBe('D1');
      }

      const block1 = blocks[1];
      expect(block1.type).toBe('code');
      if (block1.type === 'code' && 'version' in block1) {
        expect(block1.version).toBe('C1');
      }

      const block2 = blocks[2];
      expect(block2.type).toBe('code');
      if (block2.type === 'code' && 'version' in block2) {
        expect(block2.version).toBe('C1');
      }
    });
  });

  describe('10. DELIVERY preserves block IDs', () => {
    it('should preserve exact block IDs in delivery', async () => {
      const brand = getNextBrand();

      // CREATE + APPEND + APPEND + PUBLISH
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock1,
        mockContext
      );

      await tutorialComposerService.appendBlockToTutorial(
        tutorial.id,
        fixture.codeBlock2,
        mockContext
      );

      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // DELIVERY
      const delivery = await tutorialDeliveryService.getTutorialById(
        testSubtopicId,
        {
          brandId: brand,
          includeUnpublished: false,
        }
      );

      // Verify IDs match fixture
      const content = delivery.tutorial!.content as TutorialDocument;
      expect(content.blocks[0].id).toBe(fixture.definitionId);
      expect(content.blocks[1].id).toBe(fixture.codeId1);
      expect(content.blocks[2].id).toBe(fixture.codeId2);
    });
  });

  describe('11. CLEANUP verification', () => {
    it('should remove test data and verify zero remaining rows', async () => {
      const brand = getNextBrand();

      // CREATE tutorial
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: brand,
          content: fixture.initialDocument,
        },
        mockContext
      );

      const testId = tutorial.id;

      // Manual cleanup for this specific test
      await db
        .delete(tutorialSections)
        .where(eq(tutorialSections.id, testId));

      // Verify cleanup
      const remaining = await db
        .select({ id: tutorialSections.id })
        .from(tutorialSections)
        .where(eq(tutorialSections.id, testId));

      expect(remaining.length).toBe(0);
    });
  });
});
