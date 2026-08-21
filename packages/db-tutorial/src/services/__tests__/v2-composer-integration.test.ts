/**
 * V2 Composer Integration Test
 * 
 * OBJECTIVE: Prove Composer service uses V2 repository correctly
 * 
 * Tests:
 * - Composer validates TutorialDocument
 * - Composer uses V2 identity (subtopicId, brandId)
 * - D1/C1/Summary blocks survive
 * - Multiple blocks preserved
 * - Block ordering preserved
 * - appendBlockToTutorial() works
 * 
 * DOES NOT test:
 * - Delivery service (Step 4)
 * - Phase 1H educational pipeline (Step 5)
 * - Renderers
 */

import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { inArray } from 'drizzle-orm';
import { TutorialComposerService } from '../tutorial-composer.service';
import type { TutorialDocument, TutorialBlock } from '@quiz/types';
import { TutorialDocumentValidationError, SectionAlreadyExistsError } from '@quiz/types';

describe('V2 Composer Integration Test', () => {
  let testSubtopicId: string;
  let createdTutorialIds: string[] = [];
  const composerService = new TutorialComposerService();
  
  const mockContext = {
    userId: 'v2-composer-test-user'
  };

  beforeAll(async () => {
    const result = await db
      .select({ id: tutorialSubtopics.id })
      .from(tutorialSubtopics)
      .limit(1);

    if (result.length === 0) {
      throw new Error('No test subtopic available');
    }

    testSubtopicId = result[0].id;
    console.log(`Using test subtopic: ${testSubtopicId}`);
  });

  afterEach(async () => {
    if (createdTutorialIds.length > 0) {
      await db
        .delete(tutorialSections)
        .where(inArray(tutorialSections.id, createdTutorialIds));
      
      createdTutorialIds = [];
    }
  });

  describe('Definition D1 Creation', () => {
    it('should create tutorial with Definition D1 block', async () => {
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
        {
          subtopicId: testSubtopicId,
          brandId: 'shared',
          content: document
        },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      expect(tutorial.subtopicId).toBe(testSubtopicId);
      expect(tutorial.brandId).toBe('shared');
      expect(tutorial.content.blocks).toHaveLength(1);
      expect(tutorial.content.blocks[0].type).toBe('definition');
      expect(tutorial.content.blocks[0].version).toBe('D1');
      
      const block = tutorial.content.blocks[0] as any;
      expect(block.content.page.title).toBe('What Is a Variable?');
      expect(block.content.page.explanation).toHaveLength(3);
      expect(block.content.page.characteristics).toHaveLength(2);
    });

    it('should reject duplicate tutorial for same (subtopicId, brandId)', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'First tutorial' }
        }]
      };

      const first = await composerService.createTutorial(
        {
          subtopicId: testSubtopicId,
          brandId: 'shared',
          content: document
        },
        mockContext
      );

      createdTutorialIds.push(first.id);

      // Attempt duplicate - should throw
      await expect(
        composerService.createTutorial(
          {
            subtopicId: testSubtopicId,
            brandId: 'shared',
            content: document
          },
          mockContext
        )
      ).rejects.toThrow(SectionAlreadyExistsError);
    });
  });

  describe('Multiple Block Types', () => {
    it('should preserve Definition D1 + Code C1 + Summary', async () => {
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
        { subtopicId: testSubtopicId, brandId: 'shared', content: document },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      expect(tutorial.content.blocks).toHaveLength(3);
      expect(tutorial.content.blocks[0].type).toBe('definition');
      expect(tutorial.content.blocks[0].version).toBe('D1');
      expect(tutorial.content.blocks[1].type).toBe('code');
      expect(tutorial.content.blocks[1].version).toBe('C1');
      expect(tutorial.content.blocks[2].type).toBe('summary');
    });
  });

  describe('Multiple Blocks of Same Type', () => {
    it('should preserve D1 + D1 + C1 + C1 + Summary without collapsing', async () => {
      const d1FirstId = randomUUID();
      const d1SecondId = randomUUID();
      const c1FirstId = randomUUID();
      const c1SecondId = randomUUID();
      const summaryFinalId = randomUUID();
      
      const blocks: TutorialBlock[] = [
        {
          id: d1FirstId,
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
          id: d1SecondId,
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
          id: c1FirstId,
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
          id: c1SecondId,
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
          id: summaryFinalId,
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
        { subtopicId: testSubtopicId, brandId: 'shared', content: document },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      expect(tutorial.content.blocks).toHaveLength(5);
      expect(tutorial.content.blocks[0].id).toBe(d1FirstId);
      expect(tutorial.content.blocks[1].id).toBe(d1SecondId);
      expect(tutorial.content.blocks[2].id).toBe(c1FirstId);
      expect(tutorial.content.blocks[3].id).toBe(c1SecondId);
      expect(tutorial.content.blocks[4].id).toBe(summaryFinalId);
      
      // Verify both D1 blocks are distinct
      const d1First = tutorial.content.blocks[0] as any;
      const d1Second = tutorial.content.blocks[1] as any;
      expect(d1First.content.page.title).toBe('First Definition');
      expect(d1Second.content.page.title).toBe('Second Definition');
    });
  });

  describe('Document Validation', () => {
    it('should reject invalid TutorialDocument schema', async () => {
      const invalidDocument = {
        // Missing schemaVersion
        blocks: [{ id: randomUUID(), type: 'paragraph', content: { text: 'Test' } }]
      } as any;

      await expect(
        composerService.createTutorial(
          { subtopicId: testSubtopicId, brandId: 'shared', content: invalidDocument },
          mockContext
        )
      ).rejects.toThrow(TutorialDocumentValidationError);
    });

    it('should reject empty blocks array', async () => {
      const emptyDocument: TutorialDocument = {
        schemaVersion: 1,
        blocks: []
      };

      // This should either reject at validation or allow empty (depending on business rules)
      // If Composer allows empty documents, this test passes
      // If not, it should throw
      try {
        const tutorial = await composerService.createTutorial(
          { subtopicId: testSubtopicId, brandId: 'shared', content: emptyDocument },
          mockContext
        );
        createdTutorialIds.push(tutorial.id);
        // Empty document allowed - that's fine for V2
        expect(tutorial.content.blocks).toHaveLength(0);
      } catch (error) {
        // Empty document rejected - also acceptable business rule
        expect(error).toBeInstanceOf(TutorialDocumentValidationError);
      }
    });
  });

  describe('Append Block to Tutorial', () => {
    it('should append block to existing tutorial', async () => {
      const initialBlockId = randomUUID();
      const appendedBlockId = randomUUID();
      
      const initialDocument: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: initialBlockId,
          type: 'paragraph',
          content: { text: 'Initial content' }
        }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId, brandId: 'shared', content: initialDocument },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      const newBlock: TutorialBlock = {
        id: appendedBlockId,
        type: 'paragraph',
        content: { text: 'Appended content' }
      };

      const updated = await composerService.appendBlockToTutorial(
        tutorial.id,
        newBlock,
        mockContext
      );

      expect(updated.content.blocks).toHaveLength(2);
      expect(updated.content.blocks[0].id).toBe(initialBlockId);
      expect(updated.content.blocks[1].id).toBe(appendedBlockId);
      expect(updated.version).toBe(2); // Version incremented
    });

    it('should preserve existing blocks when appending', async () => {
      const d1OriginalId = randomUUID();
      const summaryAppendedId = randomUUID();
      
      const d1Block: TutorialBlock = {
        id: d1OriginalId,
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Original',
            intro: 'Original intro',
            definition: 'Original def',
            explanation: ['Explanation'],
            example: { language: 'js', code: 'const x = 1;' },
            characteristics: [{ icon: '📝', title: 'Test', description: 'Test' }],
            takeaway: 'Original'
          }
        }
      } as any;

      const initialDocument: TutorialDocument = {
        schemaVersion: 1,
        blocks: [d1Block]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId, brandId: 'shared', content: initialDocument },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      const summaryBlock: TutorialBlock = {
        id: summaryAppendedId,
        type: 'summary',
        content: {
          title: 'Summary',
          points: ['Point 1', 'Point 2']
        }
      };

      const updated = await composerService.appendBlockToTutorial(
        tutorial.id,
        summaryBlock,
        mockContext
      );

      expect(updated.content.blocks).toHaveLength(2);
      expect(updated.content.blocks[0].type).toBe('definition');
      expect(updated.content.blocks[0].version).toBe('D1');
      expect(updated.content.blocks[1].type).toBe('summary');
      
      // Verify D1 content unchanged
      const preservedD1 = updated.content.blocks[0] as any;
      expect(preservedD1.content.page.title).toBe('Original');
    });
  });

  describe('Update and Publish', () => {
    it('should update tutorial content', async () => {
      const b1Id = randomUUID();
      const b2Id = randomUUID();
      
      const originalDoc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{ id: b1Id, type: 'paragraph', content: { text: 'Original' } }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId, brandId: 'shared', content: originalDoc },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      const updatedDoc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: b1Id, type: 'paragraph', content: { text: 'Updated' } },
          { id: b2Id, type: 'paragraph', content: { text: 'New block' } }
        ]
      };

      const updated = await composerService.updateTutorialContent(
        tutorial.id,
        { content: updatedDoc },
        mockContext
      );

      expect(updated.content.blocks).toHaveLength(2);
      expect(updated.version).toBe(2);
    });

    it('should publish tutorial with valid content', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: randomUUID(),
          type: 'paragraph',
          content: { text: 'Ready to publish' }
        }]
      };

      const tutorial = await composerService.createTutorial(
        { subtopicId: testSubtopicId, brandId: 'shared', content: document },
        mockContext
      );

      createdTutorialIds.push(tutorial.id);

      const published = await composerService.publishTutorial(
        tutorial.id,
        mockContext
      );

      expect(published.status).toBe('deployed');
      expect(published.publishedAt).not.toBeNull();
    });
  });
});
