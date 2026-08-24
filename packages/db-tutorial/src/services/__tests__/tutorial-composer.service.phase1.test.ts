/**
 * Composer Integration Test - Phase 1 Page Identity
 * 
 * OBJECTIVE: Certify TutorialComposerService correctly implements Phase 1 identity
 * 
 * Phase 1 Identity: (subtopicId, navigationNodeId, brandId)
 * 
 * Tests the complete flow:
 * Composer → Validator → Repository → tutorial_sections
 * 
 * CRITICAL: Uses REAL sidebar relationships, not fake test pages
 * 
 * Test Fixture:
 * - Subtopic: "What is Java?"
 * - Valid Pages: what-is-java, java-syntax, primitive-data-types
 * - Invalid Pages: introduction-to-python (belongs to Python topic)
 * - Brand: shared
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTutorialDb } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';
import { TutorialComposerService } from '../tutorial-composer.service';
import type { TutorialDocument } from '@quiz/types';
import { SectionAlreadyExistsError } from '@quiz/types';

const db = getTutorialDb();
const composerService = new TutorialComposerService();

describe('Composer Integration - Phase 1 Page Identity', () => {
  let javaSubtopicId: string; // Internal tutorial_subtopics.id
  let javaSubtopicExternalId: string; // External ID (from main DB)
  let pythonSubtopicId: string | null = null;
  let pythonSubtopicExternalId: string | null = null;
  
  const brandId = 'shared';
  
  // Real Java sidebar pages
  const page1 = 'what-is-java';
  const page2 = 'java-syntax';
  const page3 = 'primitive-data-types';
  
  // Real Python sidebar page (for cross-topic test)
  const pythonPage = 'introduction-to-python';
  
  // Tutorial IDs (will be set after creation)
  let tutorial1Id: string | null = null;
  let tutorial2Id: string | null = null;
  let tutorial3Id: string | null = null;
  let originalTutorial1Id: string | null = null; // For soft delete test
  let recreatedTutorial1Id: string | null = null;

  const mockContext = {
    userId: 'phase1-composer-test-user',
  };

  // Test content generator
  const createContent = (title: string): TutorialDocument => ({
    schemaVersion: 1,
    blocks: [
      {
        id: 'block-1',
        type: 'heading',
        content: { text: title, level: 1 },
      },
      {
        id: 'block-2',
        type: 'paragraph',
        content: { text: `Content for ${title}` },
      },
    ],
  });

  beforeAll(async () => {
    // Get canonical Java subtopic
    const javaSubtopic = await db.query.tutorialSubtopics.findFirst({
      where: (subtopics, { eq, and, isNull }) => 
        and(
          eq(subtopics.name, 'What is Java?'),
          eq(subtopics.slug, 'whatisjava'),
          isNull(subtopics.deletedAt)
        ),
    });

    if (!javaSubtopic) {
      throw new Error('Java subtopic not found. Run database setup first.');
    }

    javaSubtopicId = javaSubtopic.id; // Internal ID
    javaSubtopicExternalId = javaSubtopic.externalId; // External ID for Composer API

    // Get Python subtopic if exists (for cross-topic test)
    const pythonSubtopic = await db.query.tutorialSubtopics.findFirst({
      where: (subtopics, { eq, and, isNull }) =>
        and(
          eq(subtopics.name, 'Complete Python'),
          isNull(subtopics.deletedAt)
        ),
    });

    if (pythonSubtopic) {
      pythonSubtopicId = pythonSubtopic.id;
      pythonSubtopicExternalId = pythonSubtopic.externalId;
    }

    // Clean up any existing test tutorials
    await db
      .delete(tutorialSections)
      .where(
        and(
          eq(tutorialSections.subtopicId, javaSubtopicId),
          isNull(tutorialSections.deletedAt)
        )
      );
  });

  afterAll(async () => {
    // Clean up all created tutorials
    const idsToClean = [
      tutorial1Id,
      tutorial2Id,
      tutorial3Id,
      originalTutorial1Id,
      recreatedTutorial1Id,
    ].filter((id): id is string => id !== null);

    if (idsToClean.length > 0) {
      for (const id of idsToClean) {
        await db.delete(tutorialSections).where(eq(tutorialSections.id, id));
      }
    }
  });

  describe('Test 1: CREATE Page A/B/C', () => {
    it('should CREATE page 1: what-is-java', async () => {
      const tutorial = await composerService.createTutorial(
        {
          subtopicId: javaSubtopicExternalId, // Composer uses external ID
          navigationNodeId: page1,
          brandId: brandId,
          content: createContent('What is Java?'),
        },
        mockContext
      );

      tutorial1Id = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.subtopicId).toBe(javaSubtopicId); // Returns internal ID
      expect(tutorial.navigationNodeId).toBe(page1);
      expect(tutorial.brandId).toBe(brandId);
    });

    it('should CREATE page 2: java-syntax', async () => {
      const tutorial = await composerService.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: page2,
          brandId: brandId,
          content: createContent('Java Syntax'),
        },
        mockContext
      );

      tutorial2Id = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.id).not.toBe(tutorial1Id); // Different from Page A
      expect(tutorial.subtopicId).toBe(javaSubtopicId);
      expect(tutorial.navigationNodeId).toBe(page2);
    });

    it('should CREATE page 3: primitive-data-types', async () => {
      const tutorial = await composerService.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: page3,
          brandId: brandId,
          content: createContent('Primitive Data Types'),
        },
        mockContext
      );

      tutorial3Id = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.id).not.toBe(tutorial1Id);
      expect(tutorial.id).not.toBe(tutorial2Id);
      expect(tutorial.subtopicId).toBe(javaSubtopicId);
      expect(tutorial.navigationNodeId).toBe(page3);
    });

    it('should VERIFY all three pages have unique IDs', () => {
      expect(tutorial1Id).toBeTruthy();
      expect(tutorial2Id).toBeTruthy();
      expect(tutorial3Id).toBeTruthy();

      expect(tutorial1Id).not.toBe(tutorial2Id);
      expect(tutorial1Id).not.toBe(tutorial3Id);
      expect(tutorial2Id).not.toBe(tutorial3Id);
    });
  });

  describe('Test 4: READ Isolation - getTutorialByPageIdentity', () => {
    it('should retrieve Page A independently', async () => {
      const tutorialA = await composerService.getTutorialByPageIdentity(
        javaSubtopicId, // Uses internal ID
        page1,
        brandId
      );

      expect(tutorialA).toBeDefined();
      expect(tutorialA!.id).toBe(tutorial1Id);
      expect(tutorialA!.navigationNodeId).toBe(page1);
      
      const content = tutorialA!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('What is Java?');
      }
    });

    it('should retrieve Page B independently', async () => {
      const tutorialB = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        page2,
        brandId
      );

      expect(tutorialB).toBeDefined();
      expect(tutorialB!.id).toBe(tutorial2Id);
      expect(tutorialB!.navigationNodeId).toBe(page2);
    });

    it('should retrieve Page C independently', async () => {
      const tutorialC = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        page3,
        brandId
      );

      expect(tutorialC).toBeDefined();
      expect(tutorialC!.id).toBe(tutorial3Id);
      expect(tutorialC!.navigationNodeId).toBe(page3);
    });

    it('should prove Page A ≠ Page B', async () => {
      const tutorialA = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        page1,
        brandId
      );

      const tutorialB = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        page2,
        brandId
      );

      expect(tutorialA!.id).not.toBe(tutorialB!.id);
      expect(tutorialA!.navigationNodeId).not.toBe(tutorialB!.navigationNodeId);
    });
  });

  describe('Test 5: UPDATE Isolation', () => {
    it('should update Page A only', async () => {
      if (!tutorial1Id) {
        throw new Error('tutorial1Id not set');
      }

      const updatedContent: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'block-1',
            type: 'heading',
            content: { text: 'UPDATED: What is Java?', level: 1 },
          },
        ],
      };

      const updated = await composerService.updateTutorialContent(
        tutorial1Id,
        { content: updatedContent },
        mockContext
      );

      expect(updated).toBeDefined();
      expect(updated!.id).toBe(tutorial1Id);
    });

    it('should verify Page B unchanged after Page A update', async () => {
      const tutorialB = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        page2,
        brandId
      );

      expect(tutorialB).toBeDefined();
      
      const content = tutorialB!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('Java Syntax'); // UNCHANGED
      }
    });

    it('should verify Page C unchanged after Page A update', async () => {
      const tutorialC = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        page3,
        brandId
      );

      expect(tutorialC).toBeDefined();
      
      const content = tutorialC!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('Primitive Data Types'); // UNCHANGED
      }
    });
  });

  describe('Test 6: DUPLICATE Page Rejection', () => {
    it('should REJECT duplicate (subtopicId, navigationNodeId, brandId)', async () => {
      await expect(async () => {
        await composerService.createTutorial(
          {
            subtopicId: javaSubtopicExternalId,
            navigationNodeId: page1, // DUPLICATE
            brandId: brandId,
            content: createContent('Duplicate What is Java?'),
          },
          mockContext
        );
      }).rejects.toThrow(SectionAlreadyExistsError);
    });
  });

  describe('Test 7: DIFFERENT Page Under SAME Subtopic is VALID (Critical)', () => {
    it('should ALLOW creating another page under same subtopic', async () => {
      // This test proves Composer does NOT enforce one-tutorial-per-subtopic
      // Creating page4 under the SAME Java subtopic should succeed
      
      // We already created page1, page2, page3
      // Now try another valid Java page
      const page4 = 'operators'; // Another real Java sidebar page

      const tutorial4 = await composerService.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: page4,
          brandId: brandId,
          content: createContent('Java Operators'),
        },
        mockContext
      );

      expect(tutorial4.id).toBeTruthy();
      expect(tutorial4.subtopicId).toBe(javaSubtopicId);
      expect(tutorial4.navigationNodeId).toBe(page4);

      // Clean up
      await db.delete(tutorialSections).where(eq(tutorialSections.id, tutorial4.id));
    });
  });

  describe('Test 8: CROSS-SUBTOPIC Invalid Page REJECTION (Critical Security)', () => {
    it('should REJECT Python subtopic + Java page', async () => {
      if (!pythonSubtopicExternalId) {
        console.log('⚠️  Python subtopic not found, skipping cross-topic security test');
        return;
      }

      // Attempt to create tutorial with Python subtopic + Java page
      // This MUST be rejected by the validator
      await expect(async () => {
        await composerService.createTutorial(
          {
            subtopicId: pythonSubtopicExternalId!,
            navigationNodeId: page1, // Java page: "what-is-java"
            brandId: brandId,
            content: createContent('Invalid Cross-Topic Content'),
          },
          mockContext
        );
      }).rejects.toThrow(/Invalid navigation node/);
    });

    it('should REJECT Java subtopic + Python page', async () => {
      // Attempt to create tutorial with Java subtopic + Python page
      // This MUST be rejected by the validator
      await expect(async () => {
        await composerService.createTutorial(
          {
            subtopicId: javaSubtopicExternalId,
            navigationNodeId: pythonPage, // Python page: "introduction-to-python"
            brandId: brandId,
            content: createContent('Invalid Cross-Topic Content'),
          },
          mockContext
        );
      }).rejects.toThrow(/Invalid navigation node/);
    });
  });

  describe('Test 9: NONEXISTENT Page Rejection', () => {
    it('should REJECT nonexistent navigationNodeId', async () => {
      await expect(async () => {
        await composerService.createTutorial(
          {
            subtopicId: javaSubtopicExternalId,
            navigationNodeId: 'definitely-not-real-page-999',
            brandId: brandId,
            content: createContent('Invalid Page'),
          },
          mockContext
        );
      }).rejects.toThrow(/Invalid navigation node/);
    });
  });

  describe('Test 10: GROUP Node Rejection', () => {
    it('should REJECT group node (not a page)', async () => {
      // "java-fundamentals" is a group node in Java sidebar, not a page
      await expect(async () => {
        await composerService.createTutorial(
          {
            subtopicId: javaSubtopicExternalId,
            navigationNodeId: 'java-fundamentals', // GROUP, not PAGE
            brandId: brandId,
            content: createContent('Invalid Group Node'),
          },
          mockContext
        );
      }).rejects.toThrow(/Invalid navigation node/);
    });
  });

  describe('Test 11: EMPTY NavigationNodeId Rejection', () => {
    it('should REJECT empty navigationNodeId', async () => {
      await expect(async () => {
        await composerService.createTutorial(
          {
            subtopicId: javaSubtopicExternalId,
            navigationNodeId: '',
            brandId: brandId,
            content: createContent('Empty Page ID'),
          },
          mockContext
        );
      }).rejects.toThrow(/navigationNodeId is required/);
    });

    it('should REJECT whitespace-only navigationNodeId', async () => {
      await expect(async () => {
        await composerService.createTutorial(
          {
            subtopicId: javaSubtopicExternalId,
            navigationNodeId: '   ',
            brandId: brandId,
            content: createContent('Whitespace Page ID'),
          },
          mockContext
        );
      }).rejects.toThrow(/navigationNodeId is required/);
    });
  });

  describe('Test 12: EXACT Node ID Storage', () => {
    it('should persist EXACT sidebar node.id with hyphens', async () => {
      const tutorial = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        page1,
        brandId
      );

      expect(tutorial).toBeDefined();
      expect(tutorial!.navigationNodeId).toBe('what-is-java'); // WITH hyphen
      expect(tutorial!.navigationNodeId).toContain('-');
    });

    it('should retrieve by EXACT node.id, not normalized', async () => {
      // Using exact sidebar node.id should work
      const exact = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        'what-is-java',
        brandId
      );

      expect(exact).toBeDefined();

      // Using normalized value should fail
      const normalized = await composerService.getTutorialByPageIdentity(
        javaSubtopicId,
        'whatisjava', // Normalized (no hyphen)
        brandId
      );

      expect(normalized).toBeNull();
    });
  });

  describe('Test 14: SOFT DELETE + RECREATE', () => {
    it('should soft delete Page A', async () => {
      if (!tutorial1Id) {
        throw new Error('tutorial1Id not set');
      }

      originalTutorial1Id = tutorial1Id; // Track for cleanup

      await db
        .update(tutorialSections)
        .set({ deletedAt: new Date() })
        .where(eq(tutorialSections.id, tutorial1Id));

      // Verify soft deleted
      const deleted = await db.query.tutorialSections.findFirst({
        where: (sections, { eq }) => eq(sections.id, tutorial1Id!),
      });

      expect(deleted?.deletedAt).not.toBeNull();
    });

    it('should ALLOW recreate with same identity after soft delete', async () => {
      const recreated = await composerService.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: page1, // SAME identity
          brandId: brandId,
          content: createContent('Recreated What is Java?'),
        },
        mockContext
      );

      recreatedTutorial1Id = recreated.id; // Track separately

      expect(recreated.id).toBeTruthy();
      expect(recreated.id).not.toBe(originalTutorial1Id); // Different record
      expect(recreated.navigationNodeId).toBe(page1); // Same page ID

      // Update tutorial1Id for other tests that might run after
      tutorial1Id = recreated.id;
    });
  });
});
