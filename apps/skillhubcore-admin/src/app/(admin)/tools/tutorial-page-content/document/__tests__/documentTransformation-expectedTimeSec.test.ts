/**
 * Test Suite: Document Transformation - expectedTimeSec Flow
 * Phase 4.5
 * 
 * Verifies expectedTimeSec preservation through:
 * TutorialBlock → BlockInstance → TutorialBlock
 */

import { describe, it, expect } from 'vitest';
import type { TutorialBlock } from '@quiz/types/tutorial-rich-document';
import {
  tutorialBlocksToInstances,
  toTutorialBlock,
  type BlockInstance,
} from '../documentTransformation';

describe('documentTransformation: expectedTimeSec Flow', () => {
  describe('D1 Block Round-Trip', () => {
    it('should preserve expectedTimeSec: TutorialBlock → BlockInstance → TutorialBlock', () => {
      const inputBlock: TutorialBlock = {
        id: '550e8400-e29b-41d4-a716-446655440000',
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

      // Step 1: TutorialBlock → BlockInstance
      const instances = tutorialBlocksToInstances([inputBlock]);
      expect(instances).toHaveLength(1);

      const instance = instances[0];
      expect(instance.expectedTimeSec).toBe(180);

      // Step 2: BlockInstance → TutorialBlock
      const outputBlock = toTutorialBlock(instance);
      expect(outputBlock.expectedTimeSec).toBe(180);

      // Verify no loss
      expect(outputBlock.expectedTimeSec).toBe(inputBlock.expectedTimeSec);
    });

    it('should handle D1 block without expectedTimeSec', () => {
      const inputBlock: TutorialBlock = {
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

      // Step 1: TutorialBlock → BlockInstance
      const instances = tutorialBlocksToInstances([inputBlock]);
      expect(instances).toHaveLength(1);

      const instance = instances[0];
      expect(instance.expectedTimeSec).toBeUndefined();

      // Step 2: BlockInstance → TutorialBlock
      const outputBlock = toTutorialBlock(instance);
      expect(outputBlock.expectedTimeSec).toBeUndefined();
    });
  });

  describe('C1 Block Round-Trip', () => {
    it('should preserve expectedTimeSec: TutorialBlock → BlockInstance → TutorialBlock', () => {
      const inputBlock: TutorialBlock = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        type: 'code',
        version: 'C1',
        expectedTimeSec: 240,
        content: {
          page: {
            type: 'code',
            title: 'Hello World',
            introduction: 'A simple program that prints a greeting.',
            language: 'javascript',
            code: 'console.log("Hello, World!");',
            explanation: [
              {
                focus: 'console.log',
                description: 'Prints to the console',
              },
            ],
            takeaway: 'This is your first program.',
          },
        },
      };

      // Step 1: TutorialBlock → BlockInstance
      const instances = tutorialBlocksToInstances([inputBlock]);
      expect(instances).toHaveLength(1);

      const instance = instances[0];
      expect(instance.expectedTimeSec).toBe(240);

      // Step 2: BlockInstance → TutorialBlock
      const outputBlock = toTutorialBlock(instance);
      expect(outputBlock.expectedTimeSec).toBe(240);

      // Verify no loss
      expect(outputBlock.expectedTimeSec).toBe(inputBlock.expectedTimeSec);
    });

    it('should handle C1 block without expectedTimeSec', () => {
      const inputBlock: TutorialBlock = {
        id: '550e8400-e29b-41d4-a716-446655440003',
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
            takeaway: 'Your first program.',
          },
        },
      };

      // Step 1: TutorialBlock → BlockInstance
      const instances = tutorialBlocksToInstances([inputBlock]);
      expect(instances).toHaveLength(1);

      const instance = instances[0];
      expect(instance.expectedTimeSec).toBeUndefined();

      // Step 2: BlockInstance → TutorialBlock
      const outputBlock = toTutorialBlock(instance);
      expect(outputBlock.expectedTimeSec).toBeUndefined();
    });
  });

  describe('expectedTimeSec NOT in payload', () => {
    it('should NOT have expectedTimeSec in D1 payload.page', () => {
      const inputBlock: TutorialBlock = {
        id: '550e8400-e29b-41d4-a716-446655440004',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 180,
        content: {
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
        },
      };

      const instances = tutorialBlocksToInstances([inputBlock]);
      const instance = instances[0];

      // Verify expectedTimeSec is at BlockInstance level
      expect(instance.expectedTimeSec).toBe(180);

      // Verify it's NOT in payload
      expect((instance.payload as any).expectedTimeSec).toBeUndefined();
      expect((instance.payload as any).page?.expectedTimeSec).toBeUndefined();
    });

    it('should NOT have expectedTimeSec in C1 payload.page', () => {
      const inputBlock: TutorialBlock = {
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
            code: 'console.log("Hello");',
            explanation: [
              {
                focus: 'console.log',
                description: 'Prints',
              },
            ],
            takeaway: 'First program.',
          },
        },
      };

      const instances = tutorialBlocksToInstances([inputBlock]);
      const instance = instances[0];

      // Verify expectedTimeSec is at BlockInstance level
      expect(instance.expectedTimeSec).toBe(240);

      // Verify it's NOT in payload
      expect((instance.payload as any).expectedTimeSec).toBeUndefined();
      expect((instance.payload as any).page?.expectedTimeSec).toBeUndefined();
    });
  });
});
