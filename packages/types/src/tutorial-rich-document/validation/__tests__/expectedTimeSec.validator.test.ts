/**
 * Test Suite: expectedTimeSec Validator
 * 
 * Verifies expectedTimeSec validation logic for all UBRC blocks
 */

import { describe, it, expect } from 'vitest';
import {
  validateExpectedTimeSec,
  validateExpectedTimeSecForBlocks,
  type ExpectedTimeSecValidationResult,
} from '../expectedTimeSec.validator';
import type { TutorialBlock } from '../../blocks';

describe('expectedTimeSec.validator', () => {
  describe('D1 Definition Block', () => {
    it('should pass validation with valid expectedTimeSec', () => {
      const block: TutorialBlock = {
        id: 'test-d1-1',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 180,
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test intro',
            definition: 'Test definition',
            explanation: ['Test'],
            example: { language: 'javascript', code: 'test' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when expectedTimeSec is missing', () => {
      const block: TutorialBlock = {
        id: 'test-d1-2',
        type: 'definition',
        version: 'D1',
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'javascript', code: 'test' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true); // Not an error, just a warning
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('MISSING_EXPECTED_TIME');
      expect(result.warnings[0].message).toContain('missing expectedTimeSec');
    });

    it('should error when expectedTimeSec is negative', () => {
      const block: TutorialBlock = {
        id: 'test-d1-3',
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
            example: { language: 'javascript', code: 'test' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_RANGE');
      expect(result.errors[0].message).toContain('greater than 0');
    });

    it('should error when expectedTimeSec is a decimal', () => {
      const block: TutorialBlock = {
        id: 'test-d1-4',
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
            example: { language: 'javascript', code: 'test' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
      expect(result.errors[0].message).toContain('whole number');
    });

    it('should error when expectedTimeSec is a string', () => {
      const block: any = {
        id: 'test-d1-5',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: "180",
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'javascript', code: 'test' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('INVALID_TYPE');
      expect(result.errors[0].message).toContain('must be a number');
    });

    it('should warn when expectedTimeSec is unusually low', () => {
      const block: TutorialBlock = {
        id: 'test-d1-6',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 30, // Very low for D1 (typical: 90-300)
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'javascript', code: 'test' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('UNUSUAL_VALUE');
      expect(result.warnings[0].message).toContain('unusually low');
    });

    it('should warn when expectedTimeSec is unusually high', () => {
      const block: TutorialBlock = {
        id: 'test-d1-7',
        type: 'definition',
        version: 'D1',
        expectedTimeSec: 800, // Very high for D1 (typical: 90-300)
        content: {
          page: {
            type: 'definition',
            category: 'Test',
            title: 'Test',
            intro: 'Test',
            definition: 'Test',
            explanation: ['Test'],
            example: { language: 'javascript', code: 'test' },
            characteristics: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('UNUSUAL_VALUE');
      expect(result.warnings[0].message).toContain('unusually high');
    });
  });

  describe('C1 Code Block', () => {
    it('should pass validation with valid expectedTimeSec', () => {
      const block: TutorialBlock = {
        id: 'test-c1-1',
        type: 'code',
        version: 'C1',
        expectedTimeSec: 240,
        content: {
          page: {
            type: 'code',
            title: 'Test',
            introduction: 'Test',
            language: 'javascript',
            code: 'console.log("test")',
            explanation: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn when C1 expectedTimeSec is missing', () => {
      const block: TutorialBlock = {
        id: 'test-c1-2',
        type: 'code',
        version: 'C1',
        content: {
          page: {
            type: 'code',
            title: 'Test',
            introduction: 'Test',
            language: 'javascript',
            code: 'test',
            explanation: [],
            takeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].code).toBe('MISSING_EXPECTED_TIME');
    });
  });

  describe('I1 Introduction Block', () => {
    it('should pass validation with valid expectedTimeSec', () => {
      const block: TutorialBlock = {
        id: 'test-i1-1',
        type: 'introduction',
        version: 'I1',
        expectedTimeSec: 420,
        content: {
          page: {
            badge: 'Test',
            title: 'Test',
            subtitle: 'Test',
            motto: { lines: ['Test', 'Test', 'Test', 'Test'] },
            learningGoal: 'Test',
            topic: { title: 'Test', description: 'Test', quote: 'Test' },
            whereFit: {
              title: 'Test',
              description: 'Test',
              flowCards: [],
            },
            solution: {
              title: 'Test',
              description: 'Test',
              code: { language: 'javascript', code: 'test' },
            },
            whereUsed: {
              title: 'Test',
              description: 'Test',
              useCases: [],
            },
            roadmap: {
              title: 'Test',
              description: 'Test',
              steps: [],
            },
            whyMatters: {
              title: 'Test',
              benefits: [],
            },
            keyTakeaway: 'Test',
          },
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('S1 Summary Block', () => {
    it('should pass validation with valid expectedTimeSec', () => {
      const block: TutorialBlock = {
        id: 'test-s1-1',
        type: 'summary',
        version: 'S1',
        expectedTimeSec: 120,
        content: {
          title: 'Summary',
          points: ['Point 1', 'Point 2'],
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateExpectedTimeSecForBlocks - batch validation', () => {
    it('should validate multiple blocks and collect all warnings/errors', () => {
      const blocks: TutorialBlock[] = [
        {
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
              example: { language: 'javascript', code: 'test' },
              characteristics: [],
              takeaway: 'Test',
            },
          },
        },
        {
          id: 'block-2',
          type: 'code',
          version: 'C1',
          // Missing expectedTimeSec - should warn
          content: {
            page: {
              type: 'code',
              title: 'Test',
              introduction: 'Test',
              language: 'javascript',
              code: 'test',
              explanation: [],
              takeaway: 'Test',
            },
          },
        },
        {
          id: 'block-3',
          type: 'summary',
          version: 'S1',
          expectedTimeSec: -10, // Invalid - should error
          content: {
            title: 'Summary',
            points: ['Test'],
          },
        },
      ];

      const result = validateExpectedTimeSecForBlocks(blocks);
      
      expect(result.valid).toBe(false); // Has errors
      expect(result.warnings).toHaveLength(1); // One missing
      expect(result.errors).toHaveLength(1); // One invalid
    });
  });

  describe('Non-instructional blocks', () => {
    it('should not warn for missing expectedTimeSec on structural blocks', () => {
      const block: TutorialBlock = {
        id: 'heading-1',
        type: 'heading',
        content: {
          level: 1,
          text: 'Test Heading',
        },
      };

      const result = validateExpectedTimeSec(block);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0); // Should not warn for non-instructional
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Complete validator behavior verification', () => {
    describe('Edge case: zero value', () => {
      it('should error when expectedTimeSec is zero', () => {
        const block: TutorialBlock = {
          id: 'test-zero',
          type: 'definition',
          version: 'D1',
          expectedTimeSec: 0,
          content: {
            page: {
              type: 'definition',
              category: 'Test',
              title: 'Test',
              intro: 'Test',
              definition: 'Test',
              explanation: ['Test'],
              example: { language: 'python', code: 'test' },
              characteristics: [],
              takeaway: 'Test',
            },
          },
        };

        const result = validateExpectedTimeSec(block);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('INVALID_RANGE');
        expect(result.errors[0].message).toContain('greater than 0');
      });
    });

    describe('Edge case: string value', () => {
      it('should error when expectedTimeSec is a string', () => {
        const block: any = {
          id: 'test-string',
          type: 'definition',
          version: 'D1',
          expectedTimeSec: '180',
          content: {
            page: {
              type: 'definition',
              category: 'Test',
              title: 'Test',
              intro: 'Test',
              definition: 'Test',
              explanation: ['Test'],
              example: { language: 'python', code: 'test' },
              characteristics: [],
              takeaway: 'Test',
            },
          },
        };

        const result = validateExpectedTimeSec(block);
        expect(result.valid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('INVALID_TYPE');
        expect(result.errors[0].message).toContain('must be a number');
      });
    });

    describe('Edge case: nested in page', () => {
      it('should handle blocks where AI mistakenly nested expectedTimeSec (validator checks root only)', () => {
        // Note: This malformed structure would be rejected by Zod schema validation first
        // The custom validator focuses on root-level expectedTimeSec validation
        const block: any = {
          id: 'test-nested-page',
          type: 'definition',
          version: 'D1',
          // Missing root-level expectedTimeSec
          content: {
            page: {
              type: 'definition',
              category: 'Test',
              title: 'Test',
              intro: 'Test',
              definition: 'Test',
              explanation: ['Test'],
              example: { language: 'python', code: 'test' },
              characteristics: [],
              takeaway: 'Test',
              expectedTimeSec: 180, // Wrong placement (would fail Zod first)
            },
          },
        };

        const result = validateExpectedTimeSec(block);
        // Validator warns about missing root-level value
        expect(result.valid).toBe(true); // Not a hard error
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].code).toBe('MISSING_EXPECTED_TIME');
      });
    });

    describe('Edge case: nested in content', () => {
      it('should handle blocks where AI mistakenly nested expectedTimeSec in content (validator checks root only)', () => {
        // Note: This malformed structure would be rejected by Zod schema validation first
        const block: any = {
          id: 'test-nested-content',
          type: 'definition',
          version: 'D1',
          // Missing root-level expectedTimeSec
          content: {
            expectedTimeSec: 180, // Wrong placement (would fail Zod first)
            page: {
              type: 'definition',
              category: 'Test',
              title: 'Test',
              intro: 'Test',
              definition: 'Test',
              explanation: ['Test'],
              example: { language: 'python', code: 'test' },
              characteristics: [],
              takeaway: 'Test',
            },
          },
        };

        const result = validateExpectedTimeSec(block);
        // Validator warns about missing root-level value
        expect(result.valid).toBe(true); // Not a hard error
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].code).toBe('MISSING_EXPECTED_TIME');
      });
    });

    describe('Valid case: no nested expectedTimeSec in legitimate content', () => {
      it('should not error on valid page content without expectedTimeSec', () => {
        const block: TutorialBlock = {
          id: 'test-valid',
          type: 'definition',
          version: 'D1',
          expectedTimeSec: 180,
          content: {
            page: {
              type: 'definition',
              category: 'Test',
              title: 'Test',
              intro: 'Test intro',
              definition: 'Test definition',
              explanation: ['Test explanation'],
              example: { language: 'python', code: 'test' },
              characteristics: [],
              takeaway: 'Test takeaway',
            },
          },
        };

        const result = validateExpectedTimeSec(block);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });
});
