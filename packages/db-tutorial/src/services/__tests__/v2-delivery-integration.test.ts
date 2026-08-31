/**
 * V2 Delivery Integration Test
 *
 * OBJECTIVE: Prove Delivery service works with V2 repository/composer
 *
 * Tests:
 * - V2 identity (subtopicId, brandId) delivery
 * - Single tutorial return (not sections[])
 * - Draft protection
 * - Deployed tutorial delivery
 * - D1/C1/Summary content preservation
 * - Block ordering preservation
 * - Multiple same-type blocks
 * - Brand isolation
 * - TutorialDocument validation
 * - Content sanitization (security)
 * - No V1 dependency (sectionType, difficulty)
 *
 * DOES NOT test:
 * - Repository internals (covered by v2-repository-integration)
 * - Composer internals (covered by v2-composer-integration)
 * - AI generation pipeline
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { inArray, eq, and, isNull, like } from 'drizzle-orm';
import { TutorialComposerService } from '../tutorial-composer.service';
import { TutorialDeliveryService } from '../tutorial-delivery.service';
import type { TutorialDocument, TutorialBlock } from '@quiz/types';

describe('V2 Delivery Integration Test', () => {
  let testSubtopicId: string; // External ID for Composer input
  let testSubtopicInternalId: string; // Internal ID for cleanup
  let testSubtopicSlug: string;
  let createdTutorialIds: string[] = [];
  const composerService = new TutorialComposerService();
  const deliveryService = new TutorialDeliveryService();

  const mockContext = {
    userId: 'v2-delivery-test-user'
  };

  const TEST_NAV_NODE_ID = 'whatisjava'; // Canonical Java navigation node (actual sidebar node.id)
  const TEST_BRAND = 'shared'; // Only brand with existing sidebar for Java topic

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
    testSubtopicSlug = javaSubtopic.slug;
    console.log(`Using test subtopic: ${testSubtopicId}, slug: ${testSubtopicSlug}`);
  });

  beforeEach(async () => {
    // Clean up before EACH test to ensure isolation
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
    if (createdTutorialIds.length > 0) {
      await db
        .delete(tutorialSections)
        .where(inArray(tutorialSections.id, createdTutorialIds));

      createdTutorialIds = [];
    }
  });

  describe('V2 Identity and Single Tutorial Return', () => {
    it('should retrieve single V2 tutorial by subtopic ID and brand', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'Test tutorial content' }
        }]
      };

      const tutorial = await composerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      // Publish tutorial
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver tutorial
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery).toBeDefined();
      expect(delivery.subtopicId).toBe(testSubtopicId);
      expect(delivery.brandId).toBe('shared');
      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial?.id).toBe(tutorial.id);
      expect(delivery.tutorial?.subtopicId).toBe(testSubtopicInternalId); // Service returns internal ID
      expect(delivery.tutorial?.brandId).toBe(TEST_BRAND);
      expect(delivery.tutorial?.content).toBeDefined();
    });

    it('should identify tutorial only by subtopicId and brandId (no sectionType or difficulty)', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'V2 tutorial without V1 concepts' }
        }]
      };

      // Create without sectionType or difficulty
      const tutorial = await composerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver using only subtopicId and brandId
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial?.id).toBe(tutorial.id);
    });
  });

  describe('Publication Status', () => {
    it('should NOT deliver draft tutorials', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'Draft tutorial' }
        }]
      };

      const tutorial = await composerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      // Do NOT publish - leave as draft
      expect(tutorial.status).toBe('draft');

      // Attempt delivery
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      // Draft should not be delivered
      expect(delivery.tutorial).toBeNull();
    });

    it('should deliver deployed tutorials', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'Published tutorial' }
        }]
      };

      const tutorial = await composerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID,
          brandId: TEST_BRAND,
          content: document
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      // Publish tutorial
      const published = await composerService.publishTutorial(tutorial.id, mockContext);
      expect(published.status).toBe('deployed');

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial?.id).toBe(tutorial.id);
      expect(delivery.tutorial?.publishedAt).not.toBeNull();
    });
  });

  describe('D1 Content Preservation', () => {
    it('should preserve Definition D1 block through delivery', async () => {
      const d1Block: TutorialBlock = {
        id: randomUUID(),
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            type: 'definition',
            category: 'JavaScript Fundamentals',
            title: 'What Is a Variable?',
            intro: 'A variable is a name given to a value in memory.',
            definition: 'A variable is a symbolic name that refers to an object stored in memory.',
            explanation: [
              'Variables store data',
              'Variables have names',
              'Variables can be reassigned'
            ],
            example: {
              language: 'javascript',
              code: 'let x = 10;\nconsole.log(x);'
            },
            characteristics: [
              { icon: '📝', title: 'Named', description: 'Has an identifier' },
              { icon: '🔄', title: 'Mutable', description: 'Value can change' }
            ],
            takeaway: 'Variables provide named storage for data.'
          }
        }
      } as any;

      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [d1Block]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial!.content.blocks).toHaveLength(1);

      const deliveredBlock = delivery.tutorial!.content.blocks[0] as any;
      expect(deliveredBlock.type).toBe('definition');
      expect(deliveredBlock.version).toBe('D1');
      expect(deliveredBlock.content.page.title).toBe('What Is a Variable?');
      expect(deliveredBlock.content.page.definition).toBe('A variable is a symbolic name that refers to an object stored in memory.');
      expect(deliveredBlock.content.page.explanation).toHaveLength(3);
      expect(deliveredBlock.content.page.characteristics).toHaveLength(2);
      expect(deliveredBlock.content.page.takeaway).toBe('Variables provide named storage for data.');
    });
  });

  describe('Multiple Block Types', () => {
    it('should preserve D1 + C1 + Summary through delivery', async () => {
      const d1Block: TutorialBlock = {
        id: randomUUID(),
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            type: 'definition',
            category: 'Programming',
            title: 'Function',
            intro: 'A function is reusable code.',
            definition: 'A function encapsulates behavior.',
            explanation: ['Functions execute code', 'Functions return values'],
            example: { language: 'javascript', code: 'function add(a, b) { return a + b; }' },
            characteristics: [{ icon: '🔧', title: 'Tool', description: 'Executes' }],
            takeaway: 'Functions are reusable.'
          }
        }
      } as any;

      const c1Block: TutorialBlock = {
        id: randomUUID(),
        type: 'code',
        version: 'C1',
        content: {
          page: {
            type: 'code',
            title: 'Function Example in JavaScript',
            introduction: 'Here is a practical example demonstrating how functions work in JavaScript with parameters and return values.',
            language: 'javascript',
            code: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));',
            filename: 'greet.js',
            explanation: [
              { focus: 'function greet(name)', description: 'Declares a function named greet that accepts one parameter' },
              { focus: 'return `Hello, ${name}!`', description: 'Returns a template string with the parameter value' }
            ],
            output: { value: 'Hello, World!', description: 'Console output' },
            takeaway: 'Functions are called with arguments and return computed values.',
            practiceHint: 'Try calling the function with different names to see different outputs.'
          }
        }
      } as any;

      const summaryBlock: TutorialBlock = {
        id: randomUUID(),
        type: 'summary',
        content: {
          title: 'Key Points',
          points: [
            'Functions encapsulate code',
            'Functions accept parameters',
            'Functions return values'
          ]
        }
      };

      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [d1Block, c1Block, summaryBlock]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial!.content.blocks).toHaveLength(3);
      expect(delivery.tutorial!.content.blocks[0].type).toBe('definition');
      expect((delivery.tutorial!.content.blocks[0] as any).version).toBe('D1');
      expect(delivery.tutorial!.content.blocks[1].type).toBe('code');
      expect((delivery.tutorial!.content.blocks[1] as any).version).toBe('C1');
      expect(delivery.tutorial!.content.blocks[2].type).toBe('summary');
    });

    it('should preserve D1 + D1 + C1 + C1 + Summary without collapsing', async () => {
      const blocks: TutorialBlock[] = [
        {
          id: randomUUID(),
          type: 'definition',
          version: 'D1',
          content: {
            page: {
              type: 'definition',
              category: 'Test',
              title: 'First Definition',
              intro: 'First',
              definition: 'First def',
              explanation: ['Point 1'],
              example: { language: 'js', code: 'const a = 1;' },
              characteristics: [{ icon: '1', title: 'One', description: 'First' }],
              takeaway: 'First takeaway'
            }
          }
        } as any,
        {
          id: randomUUID(),
          type: 'definition',
          version: 'D1',
          content: {
            page: {
              type: 'definition',
              category: 'Test',
              title: 'Second Definition',
              intro: 'Second',
              definition: 'Second def',
              explanation: ['Point 2'],
              example: { language: 'js', code: 'const b = 2;' },
              characteristics: [{ icon: '2', title: 'Two', description: 'Second' }],
              takeaway: 'Second takeaway'
            }
          }
        } as any,
        {
          id: randomUUID(),
          type: 'code',
          version: 'C1',
          content: {
            page: {
              type: 'code',
              title: 'First Code Example',
              introduction: 'This first code example demonstrates a basic console.log statement for printing output to the terminal.',
              language: 'javascript',
              code: 'console.log(1);',
              explanation: [
                { focus: 'console.log', description: 'Prints output to the console for debugging and monitoring' },
                { focus: 'log(1)', description: 'The numeric literal value being output' }
              ],
              takeaway: 'Console.log is essential for debugging and viewing output.'
            }
          }
        } as any,
        {
          id: randomUUID(),
          type: 'code',
          version: 'C1',
          content: {
            page: {
              type: 'code',
              title: 'Second Code Example',
              introduction: 'This second code example shows another console.log statement with a different value to demonstrate repetition.',
              language: 'javascript',
              code: 'console.log(2);',
              explanation: [
                { focus: 'console.log', description: 'Prints output to the console for debugging and monitoring' },
                { focus: 'log(2)', description: 'The numeric literal value being output' }
              ],
              takeaway: 'Multiple console.log statements can output different values sequentially.'
            }
          }
        } as any,
        {
          id: randomUUID(),
          type: 'summary',
          content: {
            title: 'Summary',
            points: ['Point 1', 'Point 2']
          }
        }
      ];

      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial!.content.blocks).toHaveLength(5);

      // Verify order and distinct titles
      const d1First = delivery.tutorial!.content.blocks[0] as any;
      const d1Second = delivery.tutorial!.content.blocks[1] as any;
      expect(d1First.content.page.title).toBe('First Definition');
      expect(d1Second.content.page.title).toBe('Second Definition');
    });
  });

  describe('Brand Isolation', () => {
    it.skip('should return brand-specific tutorial when it exists [BLOCKED: No skillup sidebar for Java]', async () => {
      // Create skillup-specific tutorial
      const documentSkillup: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'SkillUp specific tutorial' }
        }]
      };

      const tutorialSkillup = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: 'skillup', content: documentSkillup },
        mockContext
      );
      createdTutorialIds.push(tutorialSkillup.id);
      await composerService.publishTutorial(tutorialSkillup.id, mockContext);

      // Request skillup - should get skillup tutorial
      const deliverySkillup = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: 'skillup'
      });

      expect(deliverySkillup.tutorial).not.toBeNull();
      expect(deliverySkillup.tutorial?.brandId).toBe('skillup');
      expect(deliverySkillup.tutorial?.id).toBe(tutorialSkillup.id);
    });

    it('should return shared tutorial when brand-specific tutorial does not exist', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'Shared tutorial available to all brands' }
        }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Request skillup (should get shared tutorial due to brand visibility rules)
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: 'skillup'
      });

      // Shared tutorial should be accessible by skillup brand
      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial?.brandId).toBe('shared');
    });
  });

  describe('Content Sanitization (Security)', () => {
    it('should sanitize malicious SVG in delivered content', async () => {
      const maliciousSVG = '<svg><script>alert("XSS")</script><circle cx="50" cy="50" r="40" /></svg>';

      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'diagram',
          content: {
            diagramType: 'svg',
            diagramData: maliciousSVG,
            alt: 'Test diagram with malicious SVG',
          },
        }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      const diagramBlock = delivery.tutorial!.content.blocks[0];

      if (diagramBlock.type === 'diagram' && 'content' in diagramBlock) {
        const content = diagramBlock.content as any;
        expect(content.diagramData).not.toContain('<script>');
        expect(content.diagramData).not.toContain('alert');
        expect(content.diagramData).toContain('<circle'); // Safe content remains
      } else {
        throw new Error('Expected diagram block');
      }
    });

    it('should sanitize malicious URLs in delivered content', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'image',
          content: {
            assetId: 'javascript:alert(1)',
            alt: 'Test image with malicious URL',
          },
        }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      const imageBlock = delivery.tutorial!.content.blocks[0];

      if (imageBlock.type === 'image' && 'content' in imageBlock) {
        const content = imageBlock.content as any;
        expect(content.assetId).toBe('#unsafe-url');
      } else {
        throw new Error('Expected image block');
      }
    });

    it('should sanitize URL-encoded attacks', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'image',
          content: {
            assetId: 'javascript%3Aalert(1)',
            alt: 'Test image with encoded attack',
          },
        }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      const imageBlock = delivery.tutorial!.content.blocks[0];

      if (imageBlock.type === 'image' && 'content' in imageBlock) {
        const content = imageBlock.content as any;
        expect(content.assetId).toBe('#unsafe-url');
      } else {
        throw new Error('Expected image block');
      }
    });

    it('should sanitize mixed-case SVG attacks', async () => {
      const mixedCaseSVG = '<svg><SCRIPT>alert("XSS")</SCRIPT><circle OnClick="alert(1)" cx="50" cy="50" r="40" /></svg>';

      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'diagram',
          content: {
            diagramType: 'svg',
            diagramData: mixedCaseSVG,
            alt: 'Test diagram with mixed-case attacks',
          },
        }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      const diagramBlock = delivery.tutorial!.content.blocks[0];

      if (diagramBlock.type === 'diagram' && 'content' in diagramBlock) {
        const content = diagramBlock.content as any;
        expect(content.diagramData).not.toContain('<SCRIPT>');
        expect(content.diagramData).not.toContain('OnClick');
        expect(content.diagramData).not.toContain('alert');
      } else {
        throw new Error('Expected diagram block');
      }
    });

    it('should not modify safe content', async () => {
      const safeSVG = '<svg><circle cx="50" cy="50" r="40" fill="blue" /></svg>';

      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: randomUUID(),
            type: 'diagram',
            content: {
              diagramType: 'svg',
              diagramData: safeSVG,
              alt: 'Safe diagram with normal SVG',
            },
          },
          {
            id: randomUUID(),
            type: 'image',
            content: {
              assetId: 'https://example.com/image.png',
              alt: 'Safe HTTPS image',
            },
          },
        ]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();

      const diagramBlock = delivery.tutorial!.content.blocks[0];
      const imageBlock = delivery.tutorial!.content.blocks[1];

      if (diagramBlock.type === 'diagram' && 'content' in diagramBlock) {
        const content = diagramBlock.content as any;
        expect(content.diagramData).toBe(safeSVG);
      }

      if (imageBlock.type === 'image' && 'content' in imageBlock) {
        const content = imageBlock.content as any;
        expect(content.assetId).toBe('https://example.com/image.png');
      }
    });
  });

  describe('Content Round-Trip', () => {
    it('should preserve TutorialDocument block sequence exactly', async () => {
      const originalBlocks: TutorialBlock[] = [
        {
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'First paragraph' }
        },
        {
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'Second paragraph' }
        },
        {
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'Third paragraph' }
        },
      ];

      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: originalBlocks
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId,
          navigationNodeId: TEST_NAV_NODE_ID, brandId: TEST_BRAND, content: document },
        mockContext
      );
      createdTutorialIds.push(tutorial.id);
      await composerService.publishTutorial(tutorial.id, mockContext);

      // Deliver
      const delivery = await deliveryService.getTutorialById(testSubtopicId, {
        brandId: TEST_BRAND
      });

      expect(delivery.tutorial).not.toBeNull();
      expect(delivery.tutorial!.content.blocks).toHaveLength(3);
      expect((delivery.tutorial!.content.blocks[0] as any).content.text).toBe('First paragraph');
      expect((delivery.tutorial!.content.blocks[1] as any).content.text).toBe('Second paragraph');
      expect((delivery.tutorial!.content.blocks[2] as any).content.text).toBe('Third paragraph');
    });
  });
});
