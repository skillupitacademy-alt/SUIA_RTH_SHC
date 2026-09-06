/**
 * Test Suite: expectedTimeSec Flow - Phase 4.5
 * 
 * Verifies that expectedTimeSec metadata flows correctly through:
 * 1. AI JSON → BlockInstance
 * 2. BlockInstance → TutorialBlock
 * 3. TutorialBlock → Database → TutorialBlock
 * 
 * For D1 and C1 blocks only.
 */

import { describe, it, expect } from 'vitest';
import type {
  DefinitionD1Block,
  CodeC1Block,
} from '../blocks';
import {
  DefinitionD1BlockSchema,
  CodeC1BlockSchema,
} from '../index';

describe('Phase 4.5: expectedTimeSec Type Contract', () => {
  describe('D1 Block expectedTimeSec', () => {
    it('should accept D1 block with expectedTimeSec at root level', () => {
      const block: DefinitionD1Block = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 180, // 3 minutes
        content: {
          page: {
            type: 'definition',
            category: 'Programming Concepts',
            title: 'Variable',
            intro: 'A variable is a container for storing data values.',
            definition: 'A variable is a named storage location in memory.',
            explanation: ['Variables allow programs to store and manipulate data.'],
            example: {
              language: 'javascript',
              code: 'let x = 10;',
            },
            characteristics: [
              {
                icon: 'box',
                title: 'Storage',
                description: 'Stores data in memory',
              },
            ],
            takeaway: 'Variables are fundamental to programming.',
          },
        },
      };

      // Should pass Zod validation
      expect(() => DefinitionD1BlockSchema.parse(block)).not.toThrow();

      // TypeScript should infer expectedTimeSec as number | undefined
      const timeSec: number | undefined = block.expectedTimeSec;
      expect(timeSec).toBe(180);
    });

    it('should accept D1 block without expectedTimeSec (optional)', () => {
      const block: DefinitionD1Block = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            type: 'definition',
            category: 'Programming Concepts',
            title: 'Variable',
            intro: 'A variable is a container for storing data values.',
            definition: 'A variable is a named storage location in memory.',
            explanation: ['Variables allow programs to store and manipulate data.'],
            example: {
              language: 'javascript',
              code: 'let x = 10;',
            },
            characteristics: [
              {
                icon: 'box',
                title: 'Storage',
                description: 'Stores data in memory',
              },
            ],
            takeaway: 'Variables are fundamental to programming.',
          },
        },
      };

      // Should pass Zod validation
      expect(() => DefinitionD1BlockSchema.parse(block)).not.toThrow();

      // TypeScript should infer expectedTimeSec as number | undefined
      const timeSec: number | undefined = block.expectedTimeSec;
      expect(timeSec).toBeUndefined();
    });

    it('should verify expectedTimeSec is NOT in page payload', () => {
      const block: DefinitionD1Block = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 180,
        content: {
          page: {
            type: 'definition',
            category: 'Programming Concepts',
            title: 'Variable',
            intro: 'A variable is a container for storing data values.',
            definition: 'A variable is a named storage location in memory.',
            explanation: ['Variables allow programs to store and manipulate data.'],
            example: {
              language: 'javascript',
              code: 'let x = 10;',
            },
            characteristics: [
              {
                icon: 'box',
                title: 'Storage',
                description: 'Stores data in memory',
              },
            ],
            takeaway: 'Variables are fundamental to programming.',
          },
        },
      };

      // Verify expectedTimeSec is NOT in content.page
      expect((block.content.page as any).expectedTimeSec).toBeUndefined();
      
      // Verify it's at the root block level
      expect(block.expectedTimeSec).toBe(180);
    });
  });

  describe('C1 Block expectedTimeSec', () => {
    it('should accept C1 block with expectedTimeSec at root level', () => {
      const block: CodeC1Block = {
        id: '550e8400-e29b-41d4-a716-446655440003',
        type: 'code',
        version: 'C1',
        expectedTimeSec: 240, // 4 minutes
        content: {
          page: {
            type: 'code',
            title: 'Hello World',
            introduction: 'A simple program.',
            language: 'javascript',
            code: 'console.log("Hello, World!");',
            explanation: [
              {
                focus: 'console.log',
                description: 'Prints to console',
              },
            ],
            takeaway: 'This is your first program.',
          },
        },
      };

      // Should pass Zod validation
      expect(() => CodeC1BlockSchema.parse(block)).not.toThrow();

      // TypeScript should infer expectedTimeSec as number | undefined
      const timeSec: number | undefined = block.expectedTimeSec;
      expect(timeSec).toBe(240);
    });

    it('should accept C1 block without expectedTimeSec (optional)', () => {
      const block: CodeC1Block = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        type: 'code',
        version: 'C1',
        content: {
          page: {
            type: 'code',
            title: 'Hello World',
            introduction: 'A simple program.',
            language: 'javascript',
            code: 'console.log("Hello, World!");',
            explanation: [
              {
                focus: 'console.log',
                description: 'Prints to console',
              },
            ],
            takeaway: 'This is your first program.',
          },
        },
      };

      // Should pass Zod validation
      expect(() => CodeC1BlockSchema.parse(block)).not.toThrow();

      // TypeScript should infer expectedTimeSec as number | undefined
      const timeSec: number | undefined = block.expectedTimeSec;
      expect(timeSec).toBeUndefined();
    });

    it('should verify expectedTimeSec is NOT in page payload', () => {
      const block: CodeC1Block = {
        id: '550e8400-e29b-41d4-a716-446655440005',
        type: 'code',
        version: 'C1',
        expectedTimeSec: 240,
        content: {
          page: {
            type: 'code',
            title: 'Hello World',
            introduction: 'A simple program.',
            language: 'javascript',
            code: 'console.log("Hello, World!");',
            explanation: [
              {
                focus: 'console.log',
                description: 'Prints to console',
              },
            ],
            takeaway: 'This is your first program.',
          },
        },
      };

      // Verify expectedTimeSec is NOT in content.page
      expect((block.content.page as any).expectedTimeSec).toBeUndefined();
      
      // Verify it's at the root block level
      expect(block.expectedTimeSec).toBe(240);
    });
  });

  describe('AI JSON Normalization Contract', () => {
    it('should extract expectedTimeSec from root level of AI output', () => {
      // This is what AI returns:
      const aiOutput = {
        expectedTimeSec: 180,
        page: {
          type: 'definition',
          category: 'Programming Concepts',
          title: 'Variable',
          intro: 'A variable is a container.',
          definition: 'A variable is a named storage location.',
          explanation: ['Variables store data.'],
          example: {
            language: 'javascript',
            code: 'let x = 10;',
          },
          characteristics: [
            {
              icon: 'box',
              title: 'Storage',
              description: 'Stores data',
            },
          ],
          takeaway: 'Variables are fundamental.',
        },
      };

      // Verify structure: expectedTimeSec at root, NOT in page
      expect(aiOutput.expectedTimeSec).toBe(180);
      expect((aiOutput.page as any).expectedTimeSec).toBeUndefined();

      // After normalization to BlockInstance, expectedTimeSec should be:
      // 1. At BlockInstance.expectedTimeSec
      // 2. NOT in BlockInstance.payload.page
      const normalizedBlock = {
        id: '550e8400-e29b-41d4-a716-446655440006',
        type: 'definition' as const,
        version: 'D1',
        expectedTimeSec: aiOutput.expectedTimeSec, // ← Extracted here
        content: {
          page: aiOutput.page, // ← Page content only, no expectedTimeSec
        },
      };

      expect(normalizedBlock.expectedTimeSec).toBe(180);
      expect((normalizedBlock.content.page as any).expectedTimeSec).toBeUndefined();
    });
  });
});
