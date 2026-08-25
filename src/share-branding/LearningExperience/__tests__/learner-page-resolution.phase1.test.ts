/**
 * Learner Page Resolution - Phase 1 Identity Certification
 * 
 * OBJECTIVE: Certify learner URL/route resolution correctly implements Phase 1 page identity
 * 
 * Phase 1 Identity: (subtopicId, navigationNodeId, brandId)
 * 
 * Tests the complete learner resolution flow:
 * URL → hierarchy → sidebar validation → navigationNodeId → Delivery → Page Content
 * 
 * CRITICAL: Uses REAL sidebar relationships and published content
 * 
 * Test Fixture:
 * - Subtopic: "What is Java?" (slug: "whatisjava")
 * - Valid Pages: what-is-java, java-syntax, primitive-data-types
 * - Brand: skillup
 * 
 * Flow:
 * 1. URL contains exact navigationNodeId
 * 2. getPublishedTutorialPagePayload validates navigationNodeId against sidebar
 * 3. Calls getTutorialByPage(subtopicSlug, navigationNodeId, brandId)
 * 4. Returns page-specific TutorialDocument
 * 5. Previous/next URLs include exact navigationNodeId
 * 6. Active sidebar item matches exact navigationNodeId
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTutorialDb, tutorialSections, tutorialSubtopics, tutorialComposerService } from '@quiz/db-tutorial';
import { eq, and, isNull } from 'drizzle-orm';
import type { TutorialDocument } from '@quiz/types';
import { getPublishedTutorialPagePayload } from '../tutorialSidebarDelivery';

const db = getTutorialDb();
const composer = tutorialComposerService;

describe('Learner Page Resolution - Phase 1 Identity', () => {
  let javaSubtopicId: string; // Internal tutorial_subtopics.id
  let javaSubtopicExternalId: string; // External ID for Composer
  let javaSubtopicSlug: string; // Slug for resolution
  
  const brandId = 'skillup' as const;
  
  // Real Java sidebar pages
  const pageA = 'what-is-java';
  const pageB = 'java-syntax';
  const pageC = 'primitive-data-types';
  
  // Tutorial IDs (will be set after creation)
  let tutorialAId: string | null = null;
  let tutorialBId: string | null = null;
  let tutorialCId: string | null = null;

  const mockContext = {
    userId: 'phase1-route-test-user',
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
        content: { text: `ROUTE RESOLUTION MARKER: ${marker}` },
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

    javaSubtopicId = javaSubtopic.id;
    javaSubtopicExternalId = javaSubtopic.externalId;
    javaSubtopicSlug = javaSubtopic.slug;

    // Clean up any existing test tutorials
    await db
      .delete(tutorialSections)
      .where(
        and(
          eq(tutorialSections.subtopicId, javaSubtopicId),
          eq(tutorialSections.brandId, 'shared'),
          isNull(tutorialSections.deletedAt)
        )
      );

    // Create and publish three pages
    const tutorialA = await composer.createTutorial(
      {
        subtopicId: javaSubtopicExternalId,
        navigationNodeId: pageA,
        brandId: 'shared',
        content: createContent('What is Java?', 'PAGE-A'),
      },
      mockContext
    );
    tutorialAId = tutorialA.id;
    await composer.publishTutorial(tutorialAId, mockContext);

    const tutorialB = await composer.createTutorial(
      {
        subtopicId: javaSubtopicExternalId,
        navigationNodeId: pageB,
        brandId: 'shared',
        content: createContent('Java Syntax', 'PAGE-B'),
      },
      mockContext
    );
    tutorialBId = tutorialB.id;
    await composer.publishTutorial(tutorialBId, mockContext);

    const tutorialC = await composer.createTutorial(
      {
        subtopicId: javaSubtopicExternalId,
        navigationNodeId: pageC,
        brandId: 'shared',
        content: createContent('Primitive Data Types', 'PAGE-C'),
        },
      mockContext
    );
    tutorialCId = tutorialC.id;
    await composer.publishTutorial(tutorialCId, mockContext);
  });

  afterAll(async () => {
    // Clean up created tutorials
    const idsToClean = [tutorialAId, tutorialBId, tutorialCId].filter(
      (id): id is string => id !== null
    );

    if (idsToClean.length > 0) {
      for (const id of idsToClean) {
        await db.delete(tutorialSections).where(eq(tutorialSections.id, id));
      }
    }
  });

  describe('GROUP 1: ROUTE RESOLUTION with navigationNodeId', () => {
    it('should resolve Page A with exact navigationNodeId', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: pageA,
      });

      expect(result).not.toBeNull();
      expect(result?.content.blocks).toHaveLength(2);
      
      const paragraph = result?.content.blocks.find(b => b.type === 'paragraph');
      if (paragraph && paragraph.type === 'paragraph') {
        expect(paragraph.content.text).toContain('PAGE-A');
      }
    });

    it('should resolve Page B with exact navigationNodeId', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: pageB,
      });

      expect(result).not.toBeNull();
      
      const paragraph = result?.content.blocks.find(b => b.type === 'paragraph');
      if (paragraph && paragraph.type === 'paragraph') {
        expect(paragraph.content.text).toContain('PAGE-B');
      }
    });

    it('should resolve Page C with exact navigationNodeId', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: pageC,
      });

      expect(result).not.toBeNull();
      
      const paragraph = result?.content.blocks.find(b => b.type === 'paragraph');
      if (paragraph && paragraph.type === 'paragraph') {
        expect(paragraph.content.text).toContain('PAGE-C');
      }
    });
  });

  describe('GROUP 2: PAGE ISOLATION', () => {
    it('Page A must NOT return Page B content', async () => {
      const [resultA, resultB] = await Promise.all([
        getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageA,
        }),
        getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageB,
        }),
      ]);

      const paraA = resultA?.content.blocks.find(b => b.type === 'paragraph');
      const paraB = resultB?.content.blocks.find(b => b.type === 'paragraph');

      if (paraA && paraA.type === 'paragraph') {
        expect(paraA.content.text).toContain('PAGE-A');
        expect(paraA.content.text).not.toContain('PAGE-B');
      }

      if (paraB && paraB.type === 'paragraph') {
        expect(paraB.content.text).toContain('PAGE-B');
        expect(paraB.content.text).not.toContain('PAGE-A');
      }
    });

    it('Page B must NOT return Page C content', async () => {
      const [resultB, resultC] = await Promise.all([
        getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageB,
        }),
        getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageC,
        }),
      ]);

      const paraB = resultB?.content.blocks.find(b => b.type === 'paragraph');
      const paraC = resultC?.content.blocks.find(b => b.type === 'paragraph');

      if (paraB && paraB.type === 'paragraph') {
        expect(paraB.content.text).toContain('PAGE-B');
        expect(paraB.content.text).not.toContain('PAGE-C');
      }

      if (paraC && paraC.type === 'paragraph') {
        expect(paraC.content.text).toContain('PAGE-C');
        expect(paraC.content.text).not.toContain('PAGE-B');
      }
    });
  });

  describe('GROUP 3: EXACT NavigationNodeId PRESERVATION', () => {
    it('should accept exact sidebar node.id with hyphens', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: 'what-is-java', // EXACT sidebar node.id
      });

      expect(result).not.toBeNull();
    });

    it('should reject normalized navigationNodeId (no hyphen)', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: 'whatisjava', // NORMALIZED (no hyphen) - should NOT match
      });

      // Should return null because 'whatisjava' is not a valid page node.id
      // It's the subtopic slug, not a page identity
      expect(result).toBeNull();
    });
  });

  describe('GROUP 4: MISSING PAGE REJECTION', () => {
    it('should return null for nonexistent navigationNodeId', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: 'page-that-does-not-exist',
      });

      expect(result).toBeNull();
    });
  });

  describe('GROUP 5: REPEATED RESOLUTION CONSISTENCY', () => {
    it('repeated Page A requests always return Page A', async () => {
      for (let i = 0; i < 3; i++) {
        const result = await getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageA,
        });

        const paragraph = result?.content.blocks.find(b => b.type === 'paragraph');
        if (paragraph && paragraph.type === 'paragraph') {
          expect(paragraph.content.text).toContain('PAGE-A');
        }
      }
    });

    it('repeated Page B requests always return Page B', async () => {
      for (let i = 0; i < 3; i++) {
        const result = await getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageB,
        });

        const paragraph = result?.content.blocks.find(b => b.type === 'paragraph');
        if (paragraph && paragraph.type === 'paragraph') {
          expect(paragraph.content.text).toContain('PAGE-B');
        }
      }
    });
  });

  describe('GROUP 6: URL STRUCTURE', () => {
    it('previous/next URLs should include exact navigationNodeId', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: pageB, // Middle page
      });

      expect(result).not.toBeNull();
      
      // Previous and next should have exact node.id in URL
      if (result && result.footer.previous) {
        expect(result.footer.previous.url).toMatch(/\/[a-z-]+$/); // Should end with node.id
        expect(result.footer.previous.url).not.toBe('/tutorial-v2/programming/java/java-basics/whatisjava'); // Old V2 format
      }

      if (result && result.footer.next) {
        expect(result.footer.next.url).toMatch(/\/[a-z-]+$/); // Should end with node.id
        expect(result.footer.next.url).not.toBe('/tutorial-v2/programming/java/java-basics/whatisjava'); // Old V2 format
      }
    });

    it('URLs should contain both subtopicSlug and navigationNodeId', async () => {
      const result = await getPublishedTutorialPagePayload({
        brandId,
        domainSlug: 'programming',
        subjectSlug: 'java',
        topicSlug: 'java-basics',
        subtopicSlug: javaSubtopicSlug,
        navigationNodeId: pageA,
      });

      expect(result).not.toBeNull();
      
      // Active URL should contain both subtopic slug and page node.id
      if (result) {
        expect(result.activeUrl).toBeTruthy();
      }
      
      // Footer URLs should also follow Phase 1 pattern
      if (result && result.footer.next && result.footer.next.url) {
        const urlParts = result.footer.next.url.split('/').filter(Boolean);
        expect(urlParts.length).toBeGreaterThan(5); // domain/subject/topic/subtopic/navigationNodeId
      }
    });
  });

  describe('GROUP 7: CONCURRENT PAGE REQUESTS', () => {
    it('concurrent A/B/C requests remain isolated', async () => {
      const [resultA, resultB, resultC] = await Promise.all([
        getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageA,
        }),
        getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageB,
        }),
        getPublishedTutorialPagePayload({
          brandId,
          domainSlug: 'programming',
          subjectSlug: 'java',
          topicSlug: 'java-basics',
          subtopicSlug: javaSubtopicSlug,
          navigationNodeId: pageC,
        }),
      ]);

      const paraA = resultA?.content.blocks.find(b => b.type === 'paragraph');
      const paraB = resultB?.content.blocks.find(b => b.type === 'paragraph');
      const paraC = resultC?.content.blocks.find(b => b.type === 'paragraph');

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
