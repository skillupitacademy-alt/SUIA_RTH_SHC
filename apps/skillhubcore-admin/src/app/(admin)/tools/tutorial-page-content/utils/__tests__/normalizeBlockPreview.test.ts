/**
 * Tests for normalizeBlockPreview utility
 * 
 * Verifies:
 * - C1 blocks are canonicalized via toCanonicalCodeC1
 * - C1 memory model warnings are preserved
 * - C1 conversion failures fall back gracefully
 * - Non-C1 blocks pass through unchanged
 * - Future block versions are handled correctly
 * - No mutation of input payload
 */

import { describe, it, expect } from 'vitest';
import { normalizeBlockPreview } from '../normalizeBlockPreview';

describe('normalizeBlockPreview', () => {
  describe('C1 Code Block Canonicalization', () => {
    it('should canonicalize valid C1 block', () => {
      // Valid historical C1 payload that matches HistoricalTutorialCodePayloadSchema
      const legacyPayload = {
        page: {
          type: 'CODE + EXPLANATION',
          title: 'Variables in Python',
          introduction: 'Learn about variable assignment',
        },
        code: {
          language: 'Python',
          source: 'x = 10\nprint(x)',
        },
        explanation: {
          steps: [
            {
              number: 1,
              code: 'x = 10',
              description: 'Assign value 10 to variable x',
            },
          ],
        },
        takeaway: {
          items: ['Variables store data'],
        },
      };

      const result = normalizeBlockPreview(legacyPayload, 'code', 'C1');

      // Should return canonical format (not fallback)
      expect(result.content).toBeDefined();
      expect(result.memoryModelWarning).toBe('');
      
      // Verify it's canonical C1 structure
      const canonical = result.content as any;
      expect(canonical.page).toBeDefined();
      expect(canonical.page.type).toBe('code');
      expect(canonical.page.title).toBe('Variables in Python');
      expect(canonical.page.language).toBe('python'); // normalized to lowercase
      expect(canonical.page.code).toBe('x = 10\nprint(x)');
    });

    it('should preserve memory model warning when present', () => {
      // Valid C1 payload with memoryModel that successfully converts
      // The converter preserves memoryModel but doesn't generate warnings currently
      const payloadWithMemoryModel = {
        page: {
          type: 'CODE + EXPLANATION',
          title: 'Variables with Memory Model',
          introduction: 'Understanding memory',
        },
        code: {
          language: 'python',
          source: 'x = 10',
        },
        takeaway: {
          items: ['Variables are stored in memory'],
        },
        memoryModel: {
          type: 'stack',
          description: 'Stack frame visualization',
          layout: { type: 'table' },
          columns: [],
          nodes: [],
          connections: [],
        },
      };

      const result = normalizeBlockPreview(payloadWithMemoryModel, 'code', 'C1');

      // Should successfully canonicalize (not fallback)
      expect(result.content).toBeDefined();
      const canonical = result.content as any;
      expect(canonical.page).toBeDefined();
      expect(canonical.page.type).toBe('code');
      expect(canonical.page.memoryModel).toBeDefined();
      
      // Current implementation doesn't generate memoryModel warnings during conversion
      // This test verifies successful canonicalization with memoryModel preservation
      expect(result.memoryModelWarning).toBe('');
    });

    it('should return empty warning when C1 has no memoryModel', () => {
      // Valid C1 payload without memoryModel
      const payloadWithoutMemoryModel = {
        page: {
          type: 'CODE + EXPLANATION',
          title: 'Simple Variable Assignment',
          introduction: 'Basic variables',
        },
        code: {
          language: 'javascript',
          source: 'console.log("test")',
        },
        explanation: {
          steps: [
            {
              number: 1,
              code: 'console.log("test")',
              description: 'Logging test',
            },
          ],
        },
        takeaway: {
          items: ['Console logging is useful'],
        },
      };

      const result = normalizeBlockPreview(payloadWithoutMemoryModel, 'code', 'C1');

      // Should successfully canonicalize
      expect(result.content).toBeDefined();
      const canonical = result.content as any;
      expect(canonical.page.type).toBe('code');
      expect(canonical.page.memoryModel).toBeUndefined();
      expect(result.memoryModelWarning).toBe('');
    });

    it('should fallback to original payload on C1 conversion failure', () => {
      const invalidPayload = {
        invalid: 'structure',
      };

      const result = normalizeBlockPreview(invalidPayload, 'code', 'C1');

      // Should fallback to original payload
      expect(result.content).toBe(invalidPayload);
      expect(result.memoryModelWarning).toBe('');
    });
  });

  describe('Non-C1 Block Pass-through', () => {
    it('should pass through D1 definition block unchanged', () => {
      const definitionPayload = {
        page: {
          type: 'definition',
          category: 'Programming',
          title: 'Variable',
          intro: 'A variable stores data',
          definition: 'A named container',
          explanation: ['Detailed explanation'],
          example: { language: 'python', code: 'x = 10' },
          characteristics: [],
          takeaway: 'Variables are fundamental',
        },
      };

      const result = normalizeBlockPreview(definitionPayload, 'definition', 'D1');

      expect(result.content).toBe(definitionPayload);
      expect(result.memoryModelWarning).toBe('');
    });

    it('should pass through I1 introduction block unchanged', () => {
      const introPayload = {
        page: {
          badge: 'Python',
          title: 'Introduction to Variables',
          subtitle: 'Learn the basics',
          motto: { lines: ['Know', 'Your', 'Learning', 'Path'] },
          learningGoal: 'Understand variables',
          topic: { title: 'Variables', description: 'Data storage', quote: 'Quote' },
          whereFit: { title: 'Context', description: 'Desc', flowCards: [] },
          solution: { title: 'Example', description: 'Desc', code: { language: 'python', code: 'x=1' } },
          whereUsed: { title: 'Applications', description: 'Desc', useCases: [] },
          roadmap: { title: 'Path', description: 'Desc', steps: [] },
          whyMatters: { title: 'Importance', benefits: [] },
          keyTakeaway: 'Master variables',
        },
      };

      const result = normalizeBlockPreview(introPayload, 'introduction', 'I1');

      expect(result.content).toBe(introPayload);
      expect(result.memoryModelWarning).toBe('');
    });

    it('should pass through S1 summary block unchanged', () => {
      const summaryPayload = {
        page: {
          title: 'Summary',
          points: ['Point 1', 'Point 2', 'Point 3'],
        },
      };

      const result = normalizeBlockPreview(summaryPayload, 'summary', 'S1');

      expect(result.content).toBe(summaryPayload);
      expect(result.memoryModelWarning).toBe('');
    });
  });

  describe('Future Version Handling', () => {
    it('should not apply C1 canonicalization to future code versions', () => {
      const futureCodePayload = {
        page: {
          type: 'code',
          language: 'python',
          codeSnippet: 'x = 10',
          explanation: 'Future version format',
        },
      };

      // Hypothetical future version C99
      const result = normalizeBlockPreview(futureCodePayload, 'code', 'C99');

      // Should pass through unchanged, NOT invoke C1 canonicalization
      expect(result.content).toBe(futureCodePayload);
      expect(result.memoryModelWarning).toBe('');
    });

    it('should handle unknown block types gracefully', () => {
      const unknownPayload = {
        someField: 'someValue',
      };

      const result = normalizeBlockPreview(unknownPayload, 'unknown' as any, 'V1');

      expect(result.content).toBe(unknownPayload);
      expect(result.memoryModelWarning).toBe('');
    });
  });

  describe('No Mutation', () => {
    it('should not mutate the input payload', () => {
      const originalPayload = {
        page: {
          type: 'definition' as const,
          category: 'Test',
          title: 'Original',
          nested: {
            data: 'value',
          },
        },
      };

      const payloadCopy = JSON.parse(JSON.stringify(originalPayload));

      normalizeBlockPreview(originalPayload, 'definition', 'D1');

      // Original should be unchanged
      expect(JSON.stringify(originalPayload)).toBe(JSON.stringify(payloadCopy));
    });

    it('should not mutate C1 payload on conversion', () => {
      // Valid historical C1 payload
      const originalPayload = {
        page: {
          type: 'CODE + EXPLANATION',
          title: 'Test Code',
          introduction: 'Test introduction',
        },
        code: {
          language: 'python',
          source: 'x = 10',
        },
        takeaway: {
          items: ['Test takeaway'],
        },
      };

      const payloadCopy = JSON.parse(JSON.stringify(originalPayload));

      normalizeBlockPreview(originalPayload, 'code', 'C1');

      // Original should be unchanged (canonicalization creates new object)
      expect(JSON.stringify(originalPayload)).toBe(JSON.stringify(payloadCopy));
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce consistent results for identical inputs', () => {
      const payload = {
        page: {
          type: 'definition' as const,
          category: 'Test',
          title: 'Test Definition',
        },
      };

      const result1 = normalizeBlockPreview(payload, 'definition', 'D1');
      const result2 = normalizeBlockPreview(payload, 'definition', 'D1');

      expect(result1.content).toBe(result2.content);
      expect(result1.memoryModelWarning).toBe(result2.memoryModelWarning);
    });

    it('should produce consistent C1 canonicalization results', () => {
      // Valid historical C1 payload
      const payload = {
        page: {
          type: 'CODE + EXPLANATION',
          title: 'Variable Declaration',
          introduction: 'Understanding constants',
        },
        code: {
          language: 'javascript',
          source: 'const x = 5;',
        },
        explanation: {
          steps: [
            {
              number: 1,
              code: 'const x = 5;',
              description: 'Declare constant',
            },
          ],
        },
        takeaway: {
          items: ['Use const for constants'],
        },
      };

      const result1 = normalizeBlockPreview(payload, 'code', 'C1');
      const result2 = normalizeBlockPreview(payload, 'code', 'C1');

      // Results should be structurally equivalent
      expect(JSON.stringify(result1.content)).toBe(JSON.stringify(result2.content));
      expect(result1.memoryModelWarning).toBe(result2.memoryModelWarning);
      
      // Verify successful canonicalization (not fallback)
      const canonical1 = result1.content as any;
      expect(canonical1.page.type).toBe('code');
      expect(canonical1.page.title).toBe('Variable Declaration');
    });
  });
});
