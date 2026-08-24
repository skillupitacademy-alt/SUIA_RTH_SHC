/**
 * Delivery Integration Test - Phase 1 Page Identity
 * 
 * OBJECTIVE: Certify TutorialDeliveryService correctly implements Phase 1 page identity
 * 
 * Phase 1 Identity: (subtopicId, navigationNodeId, brandId)
 * 
 * Tests the complete delivery flow:
 * Composer → Repository → Database → Delivery → Learner
 * 
 * CRITICAL: Uses REAL sidebar relationships and published content
 * 
 * Test Fixture:
 * - Subtopic: "What is Java?" (slug: "whatisjava")
 * - Valid Pages: what-is-java, java-syntax, primitive-data-types
 * - Brand: shared
 * 
 * Flow:
 * 1. Composer creates + publishes Page A/B/C
 * 2. Delivery requests by (subtopicSlug, navigationNodeId)
 * 3. Verify Page A → A content, Page B → B content, Page C → C content
 * 4. Verify repeated requests remain consistent
 * 5. Verify exact navigationNodeId behavior
 * 6. Verify missing page isolation
 * 7. Verify publication/soft-delete filtering
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTutorialDb } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';
import { TutorialComposerService } from '../tutorial-composer.service';
import { TutorialDeliveryService } from '../tutorial-delivery.service';
import type { TutorialDocument, Brand } from '@quiz/types';

const db = getTutorialDb();
const composer = new TutorialComposerService();
const delivery = new TutorialDeliveryService();

describe('Delivery Integration - Phase 1 Page Identity', () => {
  let javaSubtopicId: string; // Internal tutorial_subtopics.id
  let javaSubtopicExternalId: string; // External ID for Composer/Delivery
  let javaSubtopicSlug: string; // Slug for Delivery
  
  const brandId = 'shared' as const; // Database allows 'shared' for universal content
  
  // Real Java sidebar pages
  const pageA = 'what-is-java';
  const pageB = 'java-syntax';
  const pageC = 'primitive-data-types';
  
  // Tutorial IDs (will be set after creation)
  let tutorialAId: string | null = null;
  let tutorialBId: string | null = null;
  let tutorialCId: string | null = null;
  let unpublishedTutorialId: string | null = null;
  let softDeletedTutorialId: string | null = null;

  const mockContext = {
    userId: 'phase1-delivery-test-user',
  };

  // Test content generator with unique markers
  const createContent = (title: string, marker: string): TutorialDocument => ({
    schemaVersion: 1,
    blocks: [
      {
        id: `heading-${marker}`,
        type: 'heading',
        content: { text: title, level: 1 },
      },
      {
        id: `paragraph-${marker}`,
        type: 'paragraph',
        content: { text: `DELIVERY CONTENT MARKER: ${marker}` },
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
    javaSubtopicExternalId = javaSubtopic.externalId; // External ID
    javaSubtopicSlug = javaSubtopic.slug; // Slug

    // Clean up any existing test tutorials for these pages
    await db
      .delete(tutorialSections)
      .where(
        and(
          eq(tutorialSections.subtopicId, javaSubtopicId),
          eq(tutorialSections.brandId, brandId),
          isNull(tutorialSections.deletedAt)
        )
      );
  });

  afterAll(async () => {
    // Clean up all created tutorials
    const idsToClean = [
      tutorialAId,
      tutorialBId,
      tutorialCId,
      unpublishedTutorialId,
      softDeletedTutorialId,
    ].filter((id): id is string => id !== null);

    if (idsToClean.length > 0) {
      for (const id of idsToClean) {
        await db.delete(tutorialSections).where(eq(tutorialSections.id, id));
      }
    }
  });

  describe('GROUP 1: CREATE + PUBLISH through Composer', () => {
    it('should CREATE Page A: what-is-java', async () => {
      const tutorial = await composer.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: pageA,
          brandId: brandId,
          content: createContent('What is Java?', 'PAGE-A'),
        },
        mockContext
      );

      tutorialAId = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.navigationNodeId).toBe(pageA);
    });

    it('should CREATE Page B: java-syntax', async () => {
      const tutorial = await composer.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: pageB,
          brandId: brandId,
          content: createContent('Java Syntax', 'PAGE-B'),
        },
        mockContext
      );

      tutorialBId = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.navigationNodeId).toBe(pageB);
    });

    it('should CREATE Page C: primitive-data-types', async () => {
      const tutorial = await composer.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: pageC,
          brandId: brandId,
          content: createContent('Primitive Data Types', 'PAGE-C'),
        },
        mockContext
      );

      tutorialCId = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.navigationNodeId).toBe(pageC);
    });

    it('should PUBLISH Page A', async () => {
      if (!tutorialAId) throw new Error('tutorialAId not set');
      
      const published = await composer.publishTutorial(tutorialAId, mockContext);
      
      expect(published?.status).toMatch(/approved|deployed/);
      expect(published?.publishedAt).not.toBeNull();
    });

    it('should PUBLISH Page B', async () => {
      if (!tutorialBId) throw new Error('tutorialBId not set');
      
      const published = await composer.publishTutorial(tutorialBId, mockContext);
      
      expect(published?.status).toMatch(/approved|deployed/);
    });

    it('should PUBLISH Page C', async () => {
      if (!tutorialCId) throw new Error('tutorialCId not set');
      
      const published = await composer.publishTutorial(tutorialCId, mockContext);
      
      expect(published?.status).toMatch(/approved|deployed/);
    });
  });

  describe('GROUP 2: PAGE DELIVERY by (subtopicSlug, navigationNodeId)', () => {
    it('should deliver Page A with correct content', async () => {
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        pageA,
        { brandId }
      );

      expect(result.tutorial).not.toBeNull();
      expect(result.tutorial!.id).toBe(tutorialAId);
      expect(result.subtopicSlug).toBe(javaSubtopicSlug);
      
      const content = result.tutorial!.content as TutorialDocument;
      const paragraph = content.blocks.find(b => b.type === 'paragraph');
      
      expect(paragraph).toBeDefined();
      if (paragraph && paragraph.type === 'paragraph') {
        expect(paragraph.content.text).toContain('PAGE-A');
      }
    });

    it('should deliver Page B with correct content', async () => {
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        pageB,
        { brandId }
      );

      expect(result.tutorial).not.toBeNull();
      expect(result.tutorial!.id).toBe(tutorialBId);
      
      const content = result.tutorial!.content as TutorialDocument;
      const paragraph = content.blocks.find(b => b.type === 'paragraph');
      
      expect(paragraph).toBeDefined();
      if (paragraph && paragraph.type === 'paragraph') {
        expect(paragraph.content.text).toContain('PAGE-B');
      }
    });

    it('should deliver Page C with correct content', async () => {
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        pageC,
        { brandId }
      );

      expect(result.tutorial).not.toBeNull();
      expect(result.tutorial!.id).toBe(tutorialCId);
      
      const content = result.tutorial!.content as TutorialDocument;
      const paragraph = content.blocks.find(b => b.type === 'paragraph');
      
      expect(paragraph).toBeDefined();
      if (paragraph && paragraph.type === 'paragraph') {
        expect(paragraph.content.text).toContain('PAGE-C');
      }
    });
  });

  describe('GROUP 3: PAGE ISOLATION', () => {
    it('Page A must NOT return Page B content', async () => {
      const resultA = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        pageA,
        { brandId }
      );

      expect(resultA.tutorial!.id).toBe(tutorialAId);
      expect(resultA.tutorial!.id).not.toBe(tutorialBId);
      
      const contentA = resultA.tutorial!.content as TutorialDocument;
      const paragraphA = contentA.blocks.find(b => b.type === 'paragraph');
      
      if (paragraphA && paragraphA.type === 'paragraph') {
        expect(paragraphA.content.text).toContain('PAGE-A');
        expect(paragraphA.content.text).not.toContain('PAGE-B');
      }
    });

    it('Page B must NOT return Page C content', async () => {
      const resultB = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        pageB,
        { brandId }
      );

      expect(resultB.tutorial!.id).toBe(tutorialBId);
      expect(resultB.tutorial!.id).not.toBe(tutorialCId);
      
      const contentB = resultB.tutorial!.content as TutorialDocument;
      const paragraphB = contentB.blocks.find(b => b.type === 'paragraph');
      
      if (paragraphB && paragraphB.type === 'paragraph') {
        expect(paragraphB.content.text).toContain('PAGE-B');
        expect(paragraphB.content.text).not.toContain('PAGE-C');
      }
    });

    it('Page C must NOT return Page A content', async () => {
      const resultC = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        pageC,
        { brandId }
      );

      expect(resultC.tutorial!.id).toBe(tutorialCId);
      expect(resultC.tutorial!.id).not.toBe(tutorialAId);
      
      const contentC = resultC.tutorial!.content as TutorialDocument;
      const paragraphC = contentC.blocks.find(b => b.type === 'paragraph');
      
      if (paragraphC && paragraphC.type === 'paragraph') {
        expect(paragraphC.content.text).toContain('PAGE-C');
        expect(paragraphC.content.text).not.toContain('PAGE-A');
      }
    });
  });

  describe('GROUP 4: REPEATED DELIVERY CONSISTENCY', () => {
    it('repeated Page A requests always return Page A', async () => {
      for (let i = 0; i < 5; i++) {
        const result = await delivery.getTutorialByPage(
          javaSubtopicSlug,
          pageA,
          { brandId }
        );

        expect(result.tutorial!.id).toBe(tutorialAId);
        
        const content = result.tutorial!.content as TutorialDocument;
        const paragraph = content.blocks.find(b => b.type === 'paragraph');
        
        if (paragraph && paragraph.type === 'paragraph') {
          expect(paragraph.content.text).toContain('PAGE-A');
        }
      }
    });

    it('repeated Page B requests always return Page B', async () => {
      for (let i = 0; i < 5; i++) {
        const result = await delivery.getTutorialByPage(
          javaSubtopicSlug,
          pageB,
          { brandId }
        );

        expect(result.tutorial!.id).toBe(tutorialBId);
        
        const content = result.tutorial!.content as TutorialDocument;
        const paragraph = content.blocks.find(b => b.type === 'paragraph');
        
        if (paragraph && paragraph.type === 'paragraph') {
          expect(paragraph.content.text).toContain('PAGE-B');
        }
      }
    });

    it('repeated Page C requests always return Page C', async () => {
      for (let i = 0; i < 5; i++) {
        const result = await delivery.getTutorialByPage(
          javaSubtopicSlug,
          pageC,
          { brandId }
        );

        expect(result.tutorial!.id).toBe(tutorialCId);
        
        const content = result.tutorial!.content as TutorialDocument;
        const paragraph = content.blocks.find(b => b.type === 'paragraph');
        
        if (paragraph && paragraph.type === 'paragraph') {
          expect(paragraph.content.text).toContain('PAGE-C');
        }
      }
    });
  });

  describe('GROUP 5: EXACT NavigationNodeId', () => {
    it('should accept exact sidebar node.id with hyphens', async () => {
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'what-is-java', // EXACT sidebar node.id
        { brandId }
      );

      expect(result.tutorial).not.toBeNull();
      expect(result.tutorial!.id).toBe(tutorialAId);
    });

    it('should NOT normalize navigationNodeId (no hyphen)', async () => {
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'whatisjava', // NORMALIZED (no hyphen) - should NOT match
        { brandId }
      );

      expect(result.tutorial).toBeNull();
    });
  });

  describe('GROUP 6: MISSING PAGE ISOLATION', () => {
    it('should return null for nonexistent page (not fallback to another page)', async () => {
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'page-that-definitely-does-not-exist',
        { brandId }
      );

      expect(result.tutorial).toBeNull();
      expect(result.subtopicSlug).toBe(javaSubtopicSlug);
    });

    it('should NOT return Page A when requesting nonexistent page', async () => {
      const nonexistent = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'nonexistent-java-page',
        { brandId }
      );

      const pageAResult = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        pageA,
        { brandId }
      );

      expect(nonexistent.tutorial).toBeNull();
      expect(pageAResult.tutorial).not.toBeNull();
      expect(pageAResult.tutorial!.id).toBe(tutorialAId);
    });
  });

  describe('GROUP 7: MISSING SUBTOPIC', () => {
    it('should throw SubtopicNotFoundError for nonexistent subtopic', async () => {
      await expect(async () => {
        await delivery.getTutorialByPage(
          'subtopic-slug-that-does-not-exist',
          pageA,
          { brandId }
        );
      }).rejects.toThrow(/not found/i);
    });
  });

  describe('GROUP 8: PUBLICATION FILTERING', () => {
    it('should NOT deliver unpublished tutorial to learner', async () => {
      // Create but DO NOT publish
      const unpublished = await composer.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: 'operators', // Another Java page
          brandId: brandId,
          content: createContent('Java Operators', 'UNPUBLISHED'),
        },
        mockContext
      );

      unpublishedTutorialId = unpublished.id;

      // Try to deliver without includeUnpublished flag
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'operators',
        { brandId, includeUnpublished: false }
      );

      expect(result.tutorial).toBeNull();
    });

    it('should deliver unpublished tutorial when includeUnpublished=true', async () => {
      const result = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'operators',
        { brandId, includeUnpublished: true }
      );

      expect(result.tutorial).not.toBeNull();
      expect(result.tutorial!.id).toBe(unpublishedTutorialId);
    });
  });

  describe('GROUP 9: SOFT DELETE FILTERING', () => {
    it('should NOT deliver soft-deleted tutorial', async () => {
      // Create, publish, then soft-delete
      const toDelete = await composer.createTutorial(
        {
          subtopicId: javaSubtopicExternalId,
          navigationNodeId: 'control-flow', // Another Java page
          brandId: brandId,
          content: createContent('Control Flow', 'TO-DELETE'),
        },
        mockContext
      );

      softDeletedTutorialId = toDelete.id;

      await composer.publishTutorial(softDeletedTutorialId, mockContext);

      // Verify it's deliverable before deletion
      const beforeDelete = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'control-flow',
        { brandId }
      );

      expect(beforeDelete.tutorial).not.toBeNull();

      // Soft delete
      await db
        .update(tutorialSections)
        .set({ deletedAt: new Date() })
        .where(eq(tutorialSections.id, softDeletedTutorialId));

      // Try to deliver after soft delete
      const afterDelete = await delivery.getTutorialByPage(
        javaSubtopicSlug,
        'control-flow',
        { brandId }
      );

      expect(afterDelete.tutorial).toBeNull();
    });
  });

  describe('GROUP 10: END-TO-END THREE-PAGE FLOW', () => {
    it('should verify all three pages exist with distinct IDs', async () => {
      expect(tutorialAId).toBeTruthy();
      expect(tutorialBId).toBeTruthy();
      expect(tutorialCId).toBeTruthy();

      expect(tutorialAId).not.toBe(tutorialBId);
      expect(tutorialBId).not.toBe(tutorialCId);
      expect(tutorialCId).not.toBe(tutorialAId);
    });

    it('should verify all three pages deliverable independently', async () => {
      const [resultA, resultB, resultC] = await Promise.all([
        delivery.getTutorialByPage(javaSubtopicSlug, pageA, { brandId }),
        delivery.getTutorialByPage(javaSubtopicSlug, pageB, { brandId }),
        delivery.getTutorialByPage(javaSubtopicSlug, pageC, { brandId }),
      ]);

      expect(resultA.tutorial).not.toBeNull();
      expect(resultB.tutorial).not.toBeNull();
      expect(resultC.tutorial).not.toBeNull();

      expect(resultA.tutorial!.id).toBe(tutorialAId);
      expect(resultB.tutorial!.id).toBe(tutorialBId);
      expect(resultC.tutorial!.id).toBe(tutorialCId);
    });

    it('should verify all three pages have distinct content markers', async () => {
      const [resultA, resultB, resultC] = await Promise.all([
        delivery.getTutorialByPage(javaSubtopicSlug, pageA, { brandId }),
        delivery.getTutorialByPage(javaSubtopicSlug, pageB, { brandId }),
        delivery.getTutorialByPage(javaSubtopicSlug, pageC, { brandId }),
      ]);

      const contentA = resultA.tutorial!.content as TutorialDocument;
      const contentB = resultB.tutorial!.content as TutorialDocument;
      const contentC = resultC.tutorial!.content as TutorialDocument;

      const paraA = contentA.blocks.find(b => b.type === 'paragraph');
      const paraB = contentB.blocks.find(b => b.type === 'paragraph');
      const paraC = contentC.blocks.find(b => b.type === 'paragraph');

      if (paraA && paraA.type === 'paragraph') {
        expect(paraA.content.text).toContain('PAGE-A');
      }
      if (paraB && paraB.type === 'paragraph') {
        expect(paraB.content.text).toContain('PAGE-B');
      }
      if (paraC && paraC.type === 'paragraph') {
        expect(paraC.content.text).toContain('PAGE-C');
      }
    });
  });
});
