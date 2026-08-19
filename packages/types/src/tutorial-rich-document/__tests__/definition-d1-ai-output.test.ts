/**
 * Definition D1 - AI Output Validation Tests
 * 
 * Phase 1F: Verifies AI output can be safely accepted as author content
 * 
 * CRITICAL ARCHITECTURE:
 * - AI INPUT: receives version D1 (system tells AI what to generate)
 * - AI OUTPUT: returns { page: {...} } (AI does NOT return version)
 * - CANONICAL: system restores version D1 (system owns metadata)
 * 
 * VALIDATION BOUNDARIES:
 * - Valid page structure → PASS
 * - AI tries to generate hierarchy → REJECT
 * - AI tries to generate version → REJECT
 * - AI tries to generate blockId → REJECT
 * - AI tries to generate brand/theme → REJECT
 * - Unknown fields in output → REJECT
 * - Missing required fields → REJECT
 */

import { describe, it, expect } from 'vitest';
import {
  validateDefinitionD1AIOutput,
  DefinitionD1AuthorContentSchema,
} from '../schemas/definition-d1.schema';
import type { DefinitionD1AuthorContent } from '../blocks/content';

describe('Definition D1 - AI Output Validation', () => {
  const validAIOutput: DefinitionD1AuthorContent = {
    page: {
      type: 'definition',
      category: 'Python Fundamentals',
      title: 'What Is a Variable?',
      intro: 'A variable is a name given to a value or object in memory.',
      definition: 'A variable is a symbolic name that refers to an object stored in memory.',
      explanation: [
        'Python binds a name to an object.',
        'The name can later refer to another object.',
      ],
      example: {
        language: 'python',
        code: 'x = 10\nprint(x)',
      },
      characteristics: [
        {
          icon: '○',
          title: 'Named Reference',
          description: 'A variable is a name that refers to an object.',
        },
      ],
      takeaway: 'A variable is a name that refers to an object in memory.',
    },
  };

  describe('Valid AI Output', () => {
    it('should accept valid page structure', () => {
      expect(() => validateDefinitionD1AIOutput(validAIOutput)).not.toThrow();
    });

    it('should return DefinitionD1AuthorContent type', () => {
      const result = validateDefinitionD1AIOutput(validAIOutput);
      expect(result).toHaveProperty('page');
      expect(result.page).toHaveProperty('type');
      expect(result.page).toHaveProperty('category');
      expect(result.page).toHaveProperty('title');
    });

    it('should accept multiple explanation paragraphs', () => {
      const output = {
        page: {
          ...validAIOutput.page,
          explanation: [
            'First paragraph',
            'Second paragraph',
            'Third paragraph',
          ],
        },
      };
      expect(() => validateDefinitionD1AIOutput(output)).not.toThrow();
    });

    it('should accept multiple characteristics', () => {
      const output = {
        page: {
          ...validAIOutput.page,
          characteristics: [
            { icon: '○', title: 'Characteristic 1', description: 'Description 1' },
            { icon: '◆', title: 'Characteristic 2', description: 'Description 2' },
            { icon: '✎', title: 'Characteristic 3', description: 'Description 3' },
          ],
        },
      };
      expect(() => validateDefinitionD1AIOutput(output)).not.toThrow();
    });

    it('should accept different programming languages', () => {
      const languages = ['python', 'java', 'javascript', 'typescript', 'go'];
      languages.forEach((language) => {
        const output = {
          page: {
            ...validAIOutput.page,
            example: {
              language,
              code: 'console.log("test");',
            },
          },
        };
        expect(() => validateDefinitionD1AIOutput(output)).not.toThrow();
      });
    });
  });

  describe('AI Tries to Generate Hierarchy (REJECT)', () => {
    it('should reject if AI adds domainId at root', () => {
      const maliciousOutput = {
        domainId: 'domain-001',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds subjectId at root', () => {
      const maliciousOutput = {
        subjectId: 'subject-001',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds topicId at root', () => {
      const maliciousOutput = {
        topicId: 'topic-001',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds subtopicId at root', () => {
      const maliciousOutput = {
        subtopicId: 'subtopic-001',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds multiple hierarchy IDs', () => {
      const maliciousOutput = {
        domainId: 'domain-001',
        subjectId: 'subject-001',
        topicId: 'topic-001',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('AI Tries to Add Hierarchy Inside Page (REJECT)', () => {
    it('should reject if AI adds domainId inside page', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          domainId: 'domain-001',
        },
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds hierarchy names inside page', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          domainName: 'Full Stack Development',
        },
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('AI Tries to Generate Version (REJECT)', () => {
    it('should reject if AI adds version at root', () => {
      const maliciousOutput = {
        version: 'D1',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds version inside page', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          version: 'D1',
        },
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('AI Tries to Generate Block ID (REJECT)', () => {
    it('should reject if AI adds blockId at root', () => {
      const maliciousOutput = {
        blockId: '550e8400-e29b-41d4-a716-446655440000',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds id at root', () => {
      const maliciousOutput = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('AI Tries to Generate Brand/Theme (REJECT)', () => {
    it('should reject if AI adds brandId', () => {
      const maliciousOutput = {
        brandId: 'rth',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds theme', () => {
      const maliciousOutput = {
        theme: { primary: '#ff0000' },
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('AI Tries to Generate System Metadata (REJECT)', () => {
    it('should reject if AI adds schemaVersion', () => {
      const maliciousOutput = {
        schemaVersion: 1,
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds metadata object', () => {
      const maliciousOutput = {
        metadata: { domainId: 'domain-001' },
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject if AI adds type at root', () => {
      const maliciousOutput = {
        type: 'definition',
        page: validAIOutput.page,
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('Unknown Fields (REJECT)', () => {
    it('should reject unknown field at root due to strict mode', () => {
      const maliciousOutput = {
        page: validAIOutput.page,
        unknownField: 'should be rejected',
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject unknown field inside page due to strict mode', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          unknownField: 'should be rejected',
        },
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject unknown field in example', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          example: {
            language: 'python',
            code: 'x = 10',
            unknownField: 'should be rejected',
          },
        },
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });

    it('should reject unknown field in characteristics', () => {
      const maliciousOutput = {
        page: {
          ...validAIOutput.page,
          characteristics: [
            {
              icon: '○',
              title: 'Title',
              description: 'Description',
              unknownField: 'should be rejected',
            },
          ],
        },
      };
      expect(() => validateDefinitionD1AIOutput(maliciousOutput)).toThrow();
    });
  });

  describe('Missing Required Fields (REJECT)', () => {
    it('should reject if type is missing', () => {
      const invalidOutput = {
        page: {
          category: 'Python Fundamentals',
          title: 'What Is a Variable?',
          intro: '...',
          definition: '...',
          explanation: ['...'],
          example: { language: 'python', code: '...' },
          characteristics: [],
          takeaway: '...',
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if category is missing', () => {
      const invalidOutput = {
        page: {
          type: 'definition',
          title: 'What Is a Variable?',
          intro: '...',
          definition: '...',
          explanation: ['...'],
          example: { language: 'python', code: '...' },
          characteristics: [],
          takeaway: '...',
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if title is missing', () => {
      const invalidOutput = {
        page: {
          type: 'definition',
          category: 'Python Fundamentals',
          intro: '...',
          definition: '...',
          explanation: ['...'],
          example: { language: 'python', code: '...' },
          characteristics: [],
          takeaway: '...',
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if explanation is empty array', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          explanation: [],
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if example.language is missing', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          example: {
            code: 'x = 10',
          },
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if example.code is missing', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          example: {
            language: 'python',
          },
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });
  });

  describe('Field Validation Rules', () => {
    it('should reject if type is not "definition"', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          type: 'code',
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if category is empty string', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          category: '',
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if title exceeds max length (200)', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          title: 'a'.repeat(201),
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if definition exceeds max length (3000)', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          definition: 'a'.repeat(3001),
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });

    it('should reject if explanation paragraph is empty', () => {
      const invalidOutput = {
        page: {
          ...validAIOutput.page,
          explanation: ['Valid paragraph', ''],
        },
      };
      expect(() => validateDefinitionD1AIOutput(invalidOutput)).toThrow();
    });
  });

  describe('Integration with Existing Schema', () => {
    it('should use same schema as DefinitionD1AuthorContentSchema', () => {
      // Verify both validators use the same schema
      const result1 = validateDefinitionD1AIOutput(validAIOutput);
      const result2 = DefinitionD1AuthorContentSchema.parse(validAIOutput);
      
      expect(result1).toEqual(result2);
    });

    it('should enforce strict mode from schema', () => {
      // This test proves .strict() is working
      const outputWithExtra = {
        page: validAIOutput.page,
        extraField: 'should fail',
      };
      
      expect(() => validateDefinitionD1AIOutput(outputWithExtra)).toThrow();
      expect(() => DefinitionD1AuthorContentSchema.parse(outputWithExtra)).toThrow();
    });
  });
});
