/**
 * Phase 1H — Definition D1 Persistence Integration Tests
 * 
 * OBJECTIVE: Prove end-to-end D1 pipeline with real persistence
 * 
 * ARCHITECTURE UNDER TEST:
 * AI Output (fixture)
 *   ↓
 * Phase 1F: validateDefinitionD1AIOutput()
 *   ↓
 * Phase 1G: buildCanonicalDefinitionD1Block()
 *   ↓
 * Phase 1G: buildTutorialDocument()
 *   ↓
 * TutorialComposerService.createTutorial()
 *   ↓
 * tutorial_sections.content (JSONB)
 *   ↓
 * TutorialDeliveryService.getTutorialById()
 *   ↓
 * TutorialDeliveryV2 { tutorial: DeliveredTutorial | null }
 *   ↓
 * DefinitionD1Block (canonical)
 * 
 * CRITICAL BOUNDARIES TESTED:
 * ✅ D1 block persists to JSONB
 * ✅ Hierarchy stored in subtopic_id column (NOT in JSONB)
 * ✅ Version metadata preserved
 * ✅ page.* structure preserved exactly
 * ✅ Round-trip integrity (save → load → identical)
 * ✅ Malicious metadata rejected
 * ✅ Delivery returns canonical D1
 * ✅ No admin metadata in delivery
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { db } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { eq, inArray, and } from 'drizzle-orm';
import {
  validateDefinitionD1AIOutput,
  type DefinitionD1AuthorContent,
  type DefinitionD1Block,
  type TutorialDocument,
} from '@quiz/types';
import {
  buildCanonicalDefinitionD1Block,
  buildTutorialDocument,
  tutorialComposerService,
  tutorialDeliveryService,
  type TutorialComposerServiceContext,
} from '../../index';

describe('Phase 1H — Definition D1 Persistence Integration', () => {
  let testSubtopicId: string; // External ID for test input
  let testSubtopicInternalId: string; // Internal ID for cleanup queries
  let createdTutorialIds: string[] = [];

  const mockContext: TutorialComposerServiceContext = {
    userId: 'phase-1h-test-user',
  };
  
  const TEST_NAV_NODE_ID = 'whatisjava'; // Phase 1 canonical navigation node (actual sidebar node.id)
  const TEST_BRAND = 'shared'; // Only brand with existing sidebar

  // Deterministic AI output fixture
  const validAIOutput = {
    page: {
      type: 'definition' as const,
      category: 'Python Fundamentals',
      title: 'What Is a Variable?',
      intro: 'A variable is a name given to a value or object in memory.',
      definition: 'A variable is a symbolic name that refers to an object stored in memory.',
      explanation: [
        'Python binds a name to an object using the assignment operator.',
        'The name can later refer to a different object through reassignment.',
        'Variables do not have fixed types; the object they reference determines the type.',
      ],
      example: {
        language: 'python',
        code: 'x = 10\nprint(x)  # Output: 10\nx = "Hello"\nprint(x)  # Output: Hello',
      },
      characteristics: [
        {
          icon: '○',
          title: 'Named Reference',
          description: 'A variable is a name that refers to an object in memory.',
        },
        {
          icon: '◆',
          title: 'Dynamic Typing',
          description: 'Variables can refer to objects of any type.',
        },
      ],
      takeaway: 'A variable is a name that refers to an object in memory, providing a way to access and manipulate data.',
    },
  };

  beforeAll(async () => {
    // Get canonical Java subtopic (deterministic fixture)
    const javaSubtopic = await db.query.tutorialSubtopics.findFirst({
      where: (subtopics, { eq, and, isNull, like }) => 
        and(
          eq(subtopics.name, 'What is Java?'),
          like(subtopics.slug, 'what-is-java-%'), // Match slug pattern with UUID suffix
          isNull(subtopics.deletedAt)
        ),
    });

    if (!javaSubtopic) {
      throw new Error('Java subtopic not found. Run database setup first.');
    }

    testSubtopicId = javaSubtopic.externalId; // External ID for Composer input
    testSubtopicInternalId = javaSubtopic.id; // Internal ID for cleanup
  });

  beforeEach(async () => {
    // Clean up before EACH test to ensure isolation
    // Use internal ID for database query
    await db
      .delete(tutorialSections)
      .where(
        and(
          eq(tutorialSections.subtopicId, testSubtopicInternalId),
          eq(tutorialSections.navigationNodeId, TEST_NAV_NODE_ID),
          eq(tutorialSections.brandId, TEST_BRAND)
        )
      );
    
    createdTutorialIds = [];
  });

  afterEach(async () => {
    // Cleanup created tutorials
    if (createdTutorialIds.length > 0) {
      await db
        .delete(tutorialSections)
        .where(inArray(tutorialSections.id, createdTutorialIds));
      createdTutorialIds = [];
    }
  });

  describe('Phase 1H-B: Repository Round-Trip', () => {
    it('should persist D1 block to JSONB and retrieve exactly', async () => {
      
      
      // Phase 1F: Validate AI output
      const authorContent: DefinitionD1AuthorContent = validateDefinitionD1AIOutput(validAIOutput);

      // Phase 1G: Build canonical block
      const block: DefinitionD1Block = buildCanonicalDefinitionD1Block(authorContent);

      // Phase 1G: Build document
      const document: TutorialDocument = buildTutorialDocument([block], {
        estimatedReadTime: 5,
        tags: ['python', 'variables'],
      });

      // V2: Create tutorial via service
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      // ✅ VERIFY: Tutorial created
      expect(tutorial.id).toBeTruthy();
      expect(tutorial.subtopicId).toBeDefined(); // Returns internal ID
      expect(tutorial.brandId).toBe('shared');
      expect(tutorial.status).toBe('draft');

      // ✅ VERIFY: Read from database
      const dbRows = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.id, tutorial.id));

      expect(dbRows).toHaveLength(1);
      const dbTutorial = dbRows[0];

      // ✅ VERIFY: Hierarchy in column, NOT in JSONB
      expect(dbTutorial.subtopicId).toBeDefined(); // Internal ID stored
      const contentJSON = JSON.stringify(dbTutorial.content);
      expect(contentJSON).not.toContain('subtopicId');
      expect(contentJSON).not.toContain('domainId');
      expect(contentJSON).not.toContain('subjectId');
      expect(contentJSON).not.toContain('topicId');

      // ✅ VERIFY: Content is TutorialDocument
      const persistedDoc = dbTutorial.content as TutorialDocument;
      expect(persistedDoc.schemaVersion).toBe(1);
      expect(persistedDoc.blocks).toHaveLength(1);

      // ✅ VERIFY: Block is DefinitionD1Block
      const persistedBlock = persistedDoc.blocks[0] as DefinitionD1Block;
      
      // ✅ VERIFY: Canonical envelope preserved
      expect(persistedBlock).toMatchObject({
        id: block.id,
        type: 'definition',
        version: 'D1',
      });

      // ✅ VERIFY: page.* structure preserved exactly
      expect(persistedBlock.content.page.type).toBe('definition');
      expect(persistedBlock.content.page.category).toBe('Python Fundamentals');
      expect(persistedBlock.content.page.title).toBe('What Is a Variable?');
      expect(persistedBlock.content.page.definition).toBe(validAIOutput.page.definition);
      expect(persistedBlock.content.page.explanation).toEqual(validAIOutput.page.explanation);
      expect(persistedBlock.content.page.example).toEqual(validAIOutput.page.example);
      expect(persistedBlock.content.page.characteristics).toEqual(validAIOutput.page.characteristics);
      expect(persistedBlock.content.page.takeaway).toBe(validAIOutput.page.takeaway);

      // ✅ VERIFY: Round-trip integrity (content identical)
      expect(persistedBlock.content).toEqual(authorContent);
    });

    it('should preserve block ID through persistence', async () => {
      
      const customBlockId = '550e8400-e29b-41d4-a716-446655440000';

      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block = buildCanonicalDefinitionD1Block(authorContent, customBlockId);
      const document = buildTutorialDocument([block]);

      // V2: Create tutorial
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      // ✅ VERIFY: Block ID preserved
      const persistedDoc = tutorial.content as TutorialDocument;
      expect(persistedDoc.blocks[0].id).toBe(customBlockId);
    });

    it('should support multiple D1 blocks in same document', async () => {
      
      
      const authorContent1 = validateDefinitionD1AIOutput({
        page: {
          ...validAIOutput.page,
          title: 'First Definition',
        },
      });

      const authorContent2 = validateDefinitionD1AIOutput({
        page: {
          ...validAIOutput.page,
          title: 'Second Definition',
        },
      });

      const block1 = buildCanonicalDefinitionD1Block(authorContent1);
      const block2 = buildCanonicalDefinitionD1Block(authorContent2);
      const document = buildTutorialDocument([block1, block2]);

      // V2: Create tutorial
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      // ✅ VERIFY: Both blocks persisted
      const persistedDoc = tutorial.content as TutorialDocument;
      expect(persistedDoc.blocks).toHaveLength(2);

      const d1Block1 = persistedDoc.blocks[0] as DefinitionD1Block;
      const d1Block2 = persistedDoc.blocks[1] as DefinitionD1Block;

      expect(d1Block1.version).toBe('D1');
      expect(d1Block2.version).toBe('D1');
      expect(d1Block1.content.page.title).toBe('First Definition');
      expect(d1Block2.content.page.title).toBe('Second Definition');
    });
  });

  describe('Phase 1H-D: Full Pipeline Integration', () => {
    it('should execute complete AI → Persistence → Delivery pipeline', async () => {
      
      // Step 1: AI Output (fixture)
      const aiOutput = validAIOutput;

      // Step 2: Phase 1F - Validate AI output
      const authorContent = validateDefinitionD1AIOutput(aiOutput);

      // Step 3: Phase 1G - Build canonical block
      const block = buildCanonicalDefinitionD1Block(authorContent);

      // Step 4: Phase 1G - Build document
      const document = buildTutorialDocument([block], {
        estimatedReadTime: 5,
        learningObjectives: ['Understand variables', 'Use variables in Python'],
        tags: ['python', 'fundamentals', 'variables'],
      });

      // Step 5: V2 - Persist via Composer Service
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      // Step 6: V2 - Publish tutorial (make it deliverable)
      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // Step 7: V2 - Retrieve via Delivery Service
      const delivery = await tutorialDeliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND,
        includeUnpublished: false,
      });

      // ✅ VERIFY: Delivery contains tutorial
      expect(delivery.tutorial).toBeTruthy();
      expect(delivery.tutorial!.id).toBe(tutorial.id);

      // ✅ VERIFY: Tutorial was published (has publishedAt timestamp)
      expect(delivery.tutorial!.publishedAt).toBeTruthy();

      // ✅ VERIFY: Content is TutorialDocument
      expect(delivery.tutorial!.content.schemaVersion).toBe(1);
      expect(delivery.tutorial!.content.blocks).toHaveLength(1);

      // ✅ VERIFY: Block is canonical DefinitionD1Block
      const deliveredBlock = delivery.tutorial!.content.blocks[0] as DefinitionD1Block;
      expect(deliveredBlock.type).toBe('definition');
      expect(deliveredBlock.version).toBe('D1');
      expect(deliveredBlock.id).toBe(block.id);

      // ✅ VERIFY: page.* structure preserved through full pipeline
      expect(deliveredBlock.content.page.title).toBe('What Is a Variable?');
      expect(deliveredBlock.content.page.category).toBe('Python Fundamentals');
      expect(deliveredBlock.content.page.definition).toBe(aiOutput.page.definition);
      expect(deliveredBlock.content.page.explanation).toEqual(aiOutput.page.explanation);
      expect(deliveredBlock.content.page.example).toEqual(aiOutput.page.example);
      expect(deliveredBlock.content.page.characteristics).toEqual(aiOutput.page.characteristics);

      // ✅ VERIFY: Metadata preserved
      expect(delivery.tutorial!.content.metadata?.estimatedReadTime).toBe(5);
      expect(delivery.tutorial!.content.metadata?.tags).toContain('python');
    });
  });

  describe('Phase 1H-E: Security Boundary', () => {
    it('should reject AI output with malicious hierarchy metadata', () => {
      const maliciousOutput = {
        domainId: 'attacker-domain',
        subjectId: 'attacker-subject',
        topicId: 'attacker-topic',
        subtopicId: 'attacker-subtopic',
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Validation rejects malicious metadata
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject AI output with version injection', () => {
      const maliciousOutput = {
        version: 'D999',
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Validation rejects version injection
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject AI output with blockId injection', () => {
      const maliciousOutput = {
        blockId: 'attacker-block-id',
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Validation rejects blockId injection
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject AI output with brand injection', () => {
      const maliciousOutput = {
        brandId: 'attacker-brand',
        theme: { primary: '#ff0000' },
        page: validAIOutput.page,
      };

      // ✅ VERIFY: Validation rejects brand injection
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject AI output with unknown fields (strict mode)', () => {
      const maliciousOutput = {
        page: validAIOutput.page,
        maliciousField: 'should-be-rejected',
      };

      // ✅ VERIFY: Strict mode rejects unknown fields
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject AI output with hierarchy inside page', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          domainId: 'attacker-domain',
        },
      };

      // ✅ VERIFY: Validation rejects hierarchy inside page
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('Phase 1H-F: Delivery Round-Trip', () => {
    it('should deliver canonical D1 block after persistence', async () => {
      
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block = buildCanonicalDefinitionD1Block(authorContent);
      const document = buildTutorialDocument([block]);

      // V2: Create and publish
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // V2: Deliver
      const delivery = await tutorialDeliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND,
      });

      // ✅ VERIFY: Delivered block matches saved block
      expect(delivery.tutorial).toBeTruthy();
      const deliveredBlock = delivery.tutorial!.content.blocks[0] as DefinitionD1Block;
      expect(deliveredBlock.id).toBe(block.id);
      expect(deliveredBlock.type).toBe('definition');
      expect(deliveredBlock.version).toBe('D1');
      expect(deliveredBlock.content).toEqual(authorContent);
    });

    it('should not include hierarchy in delivered content', async () => {
      
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block = buildCanonicalDefinitionD1Block(authorContent);
      const document = buildTutorialDocument([block]);

      // V2: Create and publish
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // V2: Deliver
      const delivery = await tutorialDeliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND,
      });

      // ✅ VERIFY: No hierarchy in delivered content
      expect(delivery.tutorial).toBeTruthy();
      const contentJSON = JSON.stringify(delivery.tutorial!.content);
      expect(contentJSON).not.toContain('subtopicId');
      expect(contentJSON).not.toContain('domainId');
      expect(contentJSON).not.toContain('subjectId');
      expect(contentJSON).not.toContain('topicId');

      // ✅ VERIFY: Hierarchy only in delivery metadata
      expect(delivery.subtopicId).toBe(testSubtopicId);
      expect(delivery.subtopicSlug).toBeTruthy();
    });

    it('should not leak admin metadata in delivery', async () => {
      
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block = buildCanonicalDefinitionD1Block(authorContent);
      const document = buildTutorialDocument([block]);

      // V2: Create and publish
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // V2: Deliver
      const delivery = await tutorialDeliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND,
      });

      expect(delivery.tutorial).toBeTruthy();
      const deliveryTutorial = delivery.tutorial!;

      // ✅ VERIFY: Admin-only fields not in delivery
      expect((deliveryTutorial as any).generatedByAi).toBeUndefined();
      expect((deliveryTutorial as any).aiModelUsed).toBeUndefined();
      expect((deliveryTutorial as any).qualityScore).toBeUndefined();
      expect((deliveryTutorial as any).approvedBy).toBeUndefined();
      expect((deliveryTutorial as any).generationJobId).toBeUndefined();
    });
  });

  describe('Phase 1H-G: Content Preservation', () => {
    it('should preserve all page.* fields exactly through pipeline', async () => {
      
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block = buildCanonicalDefinitionD1Block(authorContent);
      const document = buildTutorialDocument([block]);

      // V2: Create and publish
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // V2: Deliver
      const delivery = await tutorialDeliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND,
      });

      expect(delivery.tutorial).toBeTruthy();
      const deliveredBlock = delivery.tutorial!.content.blocks[0] as DefinitionD1Block;

      // ✅ VERIFY: All page fields preserved
      const pageFields = [
        'type',
        'category',
        'title',
        'intro',
        'definition',
        'explanation',
        'example',
        'characteristics',
        'takeaway',
      ];

      pageFields.forEach((field) => {
        expect(deliveredBlock.content.page).toHaveProperty(field);
        expect(deliveredBlock.content.page[field as keyof typeof deliveredBlock.content.page])
          .toEqual(validAIOutput.page[field as keyof typeof validAIOutput.page]);
      });
    });

    it('should preserve complex nested structures (characteristics, example)', async () => {
      
      const authorContent = validateDefinitionD1AIOutput(validAIOutput);
      const block = buildCanonicalDefinitionD1Block(authorContent);
      const document = buildTutorialDocument([block]);

      // V2: Create and publish
      const tutorial = await tutorialComposerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document,
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await tutorialComposerService.publishTutorial(tutorial.id, mockContext);

      // V2: Deliver
      const delivery = await tutorialDeliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND,
      });

      expect(delivery.tutorial).toBeTruthy();
      const deliveredBlock = delivery.tutorial!.content.blocks[0] as DefinitionD1Block;

      // ✅ VERIFY: Characteristics array preserved
      expect(deliveredBlock.content.page.characteristics).toHaveLength(2);
      expect(deliveredBlock.content.page.characteristics[0]).toEqual({
        icon: '○',
        title: 'Named Reference',
        description: 'A variable is a name that refers to an object in memory.',
      });

      // ✅ VERIFY: Example object preserved
      expect(deliveredBlock.content.page.example).toEqual({
        language: 'python',
        code: 'x = 10\nprint(x)  # Output: 10\nx = "Hello"\nprint(x)  # Output: Hello',
      });

      // ✅ VERIFY: Explanation array preserved
      expect(deliveredBlock.content.page.explanation).toHaveLength(3);
      expect(deliveredBlock.content.page.explanation[0]).toBe(
        'Python binds a name to an object using the assignment operator.'
      );
    });
  });
});





