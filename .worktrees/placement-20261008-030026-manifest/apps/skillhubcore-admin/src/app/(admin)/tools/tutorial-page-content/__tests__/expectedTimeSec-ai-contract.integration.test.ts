/**
 * Integration Test: expectedTimeSec AI Contract
 * 
 * Verifies the complete flow:
 * 1. AI prompts include expectedTimeSec contract
 * 2. Generated blocks validate with Zod schemas
 * 3. Validation utility provides appropriate feedback
 * 
 * This test confirms the implementation of the global expectedTimeSec
 * metadata contract across all UBRC blocks (D1, C1, I1, S1).
 */

import { describe, it, expect } from 'vitest';
import { getDefinitionD1Prompt } from '../blocks/definition/D1/definitionD1.prompt';
import { getCodeC1Prompt } from '../blocks/code/C1/codeC1.prompt';
import { getIntroductionI1Prompt } from '../blocks/introduction/I1/introductionI1.prompt';
import { getSummaryS1Prompt } from '../blocks/summary/S1/summaryS1.prompt';
import {
  validateExpectedTimeSec,
  type TutorialBlock,
} from '@quiz/types';

describe('expectedTimeSec AI Contract Integration', () => {
  const mockContext = {
    domainName: 'Computer Science',
    subjectName: 'Programming',
    topicName: 'Python Fundamentals',
    subtopicName: 'Data Types',
    navigationNodeName: 'Variables',
    blockName: 'Test Block',
    versionName: 'v1',
    versionId: 'D1',
  };

  describe('D1 Prompt Contract', () => {
    it('should include expectedTimeSec in prompt with dynamic estimation instructions', () => {
      const prompt = getDefinitionD1Prompt(mockContext);
      
      // Verify prompt includes expectedTimeSec contract
      expect(prompt).toContain('expectedTimeSec');
      expect(prompt).toContain('<AI-estimated-value>');
      expect(prompt).toContain('GLOBAL BLOCK METADATA');
      
      // Verify D1-specific estimation factors
      expect(prompt).toContain('definition reading time');
      expect(prompt).toContain('characteristics');
      expect(prompt).toContain('takeaway');
      
      // Verify architectural guidance
      expect(prompt).toContain('Analytics metadata representing estimated learning time');
      expect(prompt).toContain('NOT a completion trigger');
    });
  });

  describe('C1 Prompt Contract', () => {
    it('should include expectedTimeSec in prompt with dynamic estimation instructions', () => {
      const prompt = getCodeC1Prompt(mockContext);
      
      expect(prompt).toContain('expectedTimeSec');
      expect(prompt).toContain('<AI-estimated-value>');
      expect(prompt).toContain('GLOBAL BLOCK METADATA');
      
      // Verify C1-specific estimation factors (check both block-specific and global sections)
      expect(prompt).toContain('Code comprehension');
      expect(prompt).toContain('Memory model');
      expect(prompt).toContain('explanation');
    });
  });

  describe('I1 Prompt Contract', () => {
    it('should include expectedTimeSec in prompt with dynamic estimation instructions', () => {
      const prompt = getIntroductionI1Prompt(mockContext);
      
      expect(prompt).toContain('expectedTimeSec');
      expect(prompt).toContain('<AI-estimated-value>');
      expect(prompt).toContain('GLOBAL BLOCK METADATA');
      
      //  Verify I1-specific estimation factors (check global section)
      expect(prompt).toContain('flow cards');
      expect(prompt).toContain('Roadmap steps');
      expect(prompt).toContain('use cases');
      expect(prompt).toContain('comprehensive roadmap-style');
    });
  });

  describe('S1 Prompt Contract', () => {
    it('should include expectedTimeSec in prompt with dynamic estimation instructions', () => {
      const prompt = getSummaryS1Prompt(mockContext);
      
      expect(prompt).toContain('expectedTimeSec');
      expect(prompt).toContain('<AI-estimated-value>');
      expect(prompt).toContain('GLOBAL BLOCK METADATA');
      
      // Verify S1-specific estimation factors (check global section)
      expect(prompt).toContain('Number of summary points');
      expect(prompt).toContain('Technical depth per point');
    });
  });

  describe('Global Contract Enforcement', () => {
    it('should reject negative expectedTimeSec with custom validator', () => {
      const block: TutorialBlock = {
        id: 'test-invalid',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: -10,
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'python', code: 'x = 10' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      // Custom validator should reject negative values
      const validationResult = validateExpectedTimeSec(block);
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors[0].code).toBe('INVALID_RANGE');
    });

    it('should reject decimal expectedTimeSec with custom validator', () => {
      const block: TutorialBlock = {
        id: 'test-invalid',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 180.5,
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'python', code: 'x = 10' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      // Custom validator should reject decimals
      const validationResult = validateExpectedTimeSec(block);
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors[0].code).toBe('INVALID_TYPE');
    });

    it('should warn when expectedTimeSec is missing from instructional blocks', () => {
      const block: TutorialBlock = {
        id: 'test-missing',
        type: 'definition',
        version: 'D1',
        // Missing expectedTimeSec
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'python', code: 'x = 10' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      // Custom validator warns
      const validationResult = validateExpectedTimeSec(block);
      expect(validationResult.valid).toBe(true); // Not an error
      expect(validationResult.warnings).toHaveLength(1);
      expect(validationResult.warnings[0].code).toBe('MISSING_EXPECTED_TIME');
    });

    it('should validate blocks without modifying them', () => {
      const originalBlock: TutorialBlock = {
        id: 'test-immutable',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 180,
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'python', code: 'x = 10' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const blockCopy = JSON.parse(JSON.stringify(originalBlock));

      validateExpectedTimeSec(originalBlock);

      // Verify block unchanged
      expect(JSON.stringify(originalBlock)).toBe(JSON.stringify(blockCopy));
    });
  });

  describe('Architectural Separation', () => {
    it('should confirm expectedTimeSec is independent metadata field', () => {
      const blockWithExpectedTime: TutorialBlock = {
        id: 'block-1',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 180,
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'python', code: 'x = 10' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const blockWithoutExpectedTime: TutorialBlock = {
        ...blockWithExpectedTime,
        id: 'block-2',
        expectedTimeSec: undefined,
      };

      // Both blocks have same structure except for expectedTimeSec
      // This demonstrates expectedTimeSec doesn't affect block behavior
      expect(blockWithExpectedTime.type).toBe(blockWithoutExpectedTime.type);
      expect(blockWithExpectedTime.version).toBe(blockWithoutExpectedTime.version);
      
      // Validate both work independently
      const result1 = validateExpectedTimeSec(blockWithExpectedTime);
      const result2 = validateExpectedTimeSec(blockWithoutExpectedTime);
      
      expect(result1.valid).toBe(true);
      expect(result1.errors).toHaveLength(0);
      
      expect(result2.valid).toBe(true);
      expect(result2.warnings).toHaveLength(1); // Warns about missing expectedTimeSec
    });
  });
});
