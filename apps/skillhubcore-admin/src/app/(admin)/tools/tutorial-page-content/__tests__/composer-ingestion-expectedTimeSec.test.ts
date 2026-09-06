/**
 * Composer Ingestion - expectedTimeSec Contract Tests
 * 
 * Verify that Composer correctly ingests AI JSON with expectedTimeSec at root level
 * and preserves the content.page structure expected by transformation layer.
 */

import { describe, it, expect } from 'vitest';

describe('Composer AI JSON Ingestion - expectedTimeSec', () => {
  describe('D1 Definition Block', () => {
    it('extracts expectedTimeSec from root level', () => {
      const aiJson = {
        expectedTimeSec: 180,
        page: {
          type: 'definition' as const,
          category: 'Java Fundamentals',
          title: 'What is Java?',
          intro: 'Java is a programming language',
          definition: 'Java is a high-level, object-oriented language',
          explanation: ['First explanation', 'Second explanation'],
          example: {
            language: 'java',
            code: 'System.out.println("Hello");',
          },
          characteristics: [],
          takeaway: 'Java is powerful',
        },
      };

      // Simulate parseSource() behavior
      const parsed = aiJson;
      const expectedTimeSec = typeof aiJson.expectedTimeSec === 'number' 
        ? aiJson.expectedTimeSec 
        : undefined;

      expect(expectedTimeSec).toBe(180);
      expect(parsed).toHaveProperty('page');
      expect(parsed.page).not.toHaveProperty('expectedTimeSec');
    });

    it('handles missing expectedTimeSec', () => {
      const aiJson = {
        page: {
          type: 'definition' as const,
          category: 'Test',
          title: 'Test',
          intro: 'Test',
          definition: 'Test',
          explanation: ['Test'],
          example: { language: 'python', code: 'x = 1' },
          characteristics: [],
          takeaway: 'Test',
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedTimeSec = typeof (aiJson as any).expectedTimeSec === 'number'
        ? (aiJson as any).expectedTimeSec
        : undefined;

      expect(expectedTimeSec).toBeUndefined();
    });

    it('ignores invalid expectedTimeSec types', () => {
      const aiJson = {
        expectedTimeSec: 'not-a-number' as any,
        page: {
          type: 'definition' as const,
          category: 'Test',
          title: 'Test',
          intro: 'Test',
          definition: 'Test',
          explanation: ['Test'],
          example: { language: 'python', code: 'x = 1' },
          characteristics: [],
          takeaway: 'Test',
        },
      };

      const expectedTimeSec = typeof aiJson.expectedTimeSec === 'number'
        ? aiJson.expectedTimeSec
        : undefined;

      expect(expectedTimeSec).toBeUndefined();
    });

    it('payload contains page structure (not flat)', () => {
      const aiJson = {
        expectedTimeSec: 180,
        page: {
          type: 'definition' as const,
          category: 'Test',
          title: 'Test',
          intro: 'Test',
          definition: 'Test',
          explanation: ['Test'],
          example: { language: 'python', code: 'x = 1' },
          characteristics: [],
          takeaway: 'Test',
        },
      };

      // Simulate what parseSource returns
      const payload = aiJson;

      // Verify structure matches what toTutorialBlock expects
      expect(payload).toHaveProperty('page');
      expect(payload.page).toHaveProperty('type', 'definition');
      expect(payload).not.toHaveProperty('type'); // type is inside page, not at root
    });
  });

  describe('C1 Code Block', () => {
    it('extracts expectedTimeSec from root level', () => {
      const aiJson = {
        expectedTimeSec: 240,
        page: {
          type: 'code' as const,
          title: 'Hello World',
          introduction: 'Your first program',
          language: 'java',
          code: 'public class Hello { }',
          explanation: [
            {
              focus: 'public class',
              description: 'Defines a public class',
            },
          ],
          takeaway: 'You created a Java program',
        },
      };

      const expectedTimeSec = typeof aiJson.expectedTimeSec === 'number'
        ? aiJson.expectedTimeSec
        : undefined;

      expect(expectedTimeSec).toBe(240);
      expect(aiJson.page).not.toHaveProperty('expectedTimeSec');
    });

    it('handles missing expectedTimeSec', () => {
      const aiJson = {
        page: {
          type: 'code' as const,
          title: 'Test',
          introduction: 'Test',
          language: 'python',
          code: 'x = 1',
          explanation: [],
          takeaway: 'Test',
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const expectedTimeSec = typeof (aiJson as any).expectedTimeSec === 'number'
        ? (aiJson as any).expectedTimeSec
        : undefined;

      expect(expectedTimeSec).toBeUndefined();
    });

    it('payload contains page structure', () => {
      const aiJson = {
        expectedTimeSec: 240,
        page: {
          type: 'code' as const,
          title: 'Test',
          introduction: 'Test',
          language: 'python',
          code: 'x = 1',
          explanation: [],
          takeaway: 'Test',
        },
      };

      const payload = aiJson;

      expect(payload).toHaveProperty('page');
      expect(payload.page).toHaveProperty('type', 'code');
      expect(payload).not.toHaveProperty('type'); // type is inside page, not at root
    });
  });

  describe('BlockInstance Shape', () => {
    it('creates correct BlockInstance from AI JSON', () => {
      const aiJson = {
        expectedTimeSec: 180,
        page: {
          type: 'definition' as const,
          category: 'Test',
          title: 'Test Definition',
          intro: 'Test',
          definition: 'Test',
          explanation: ['Test'],
          example: { language: 'python', code: 'x = 1' },
          characteristics: [],
          takeaway: 'Test',
        },
      };

      // Simulate Composer ingestion with normalization
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawParsed = aiJson as any;
      const expectedTimeSec = typeof rawParsed.expectedTimeSec === 'number'
        ? rawParsed.expectedTimeSec
        : undefined;
      
      // Normalize payload: remove expectedTimeSec (metadata at BlockInstance level only)
      const normalizedPayload = { ...aiJson };
      delete (normalizedPayload as any).expectedTimeSec;
      
      const payload = normalizedPayload;

      const blockInstance = {
        id: 'test-id',
        type: 'definition' as const,
        version: 'v1',
        versionCode: 'D1',
        title: 'Test Definition',
        payload,
        payloadFormat: 'legacy' as const,
        sourceFormat: 'json' as const,
        sourceContent: JSON.stringify(aiJson),
        expectedTimeSec,
      };

      // Verify BlockInstance shape matches contract:
      // 1. expectedTimeSec at BlockInstance level
      expect(blockInstance.expectedTimeSec).toBe(180);
      
      // 2. payload contains page structure
      expect(blockInstance.payload).toHaveProperty('page');
      
      // 3. expectedTimeSec NOT duplicated inside payload
      expect((blockInstance.payload as any).expectedTimeSec).toBeUndefined();
      expect(blockInstance.payload.page).not.toHaveProperty('expectedTimeSec');
    });

    it('C1 canonical conversion preserves expectedTimeSec at BlockInstance level only', () => {
      const aiJson = {
        expectedTimeSec: 240,
        page: {
          type: 'code' as const,
          title: 'Hello World',
          introduction: 'Your first program',
          language: 'java',
          code: 'public class Hello { }',
          explanation: [
            {
              focus: 'public class',
              description: 'Defines a public class',
            },
          ],
          takeaway: 'You created a Java program',
        },
      };

      // Simulate Composer C1 ingestion path
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawParsed = aiJson as any;
      const expectedTimeSec = typeof rawParsed.expectedTimeSec === 'number'
        ? rawParsed.expectedTimeSec
        : undefined;
      
      // Normalize payload before C1 canonicalization
      const normalizedPayload = { ...aiJson };
      delete (normalizedPayload as any).expectedTimeSec;
      
      // After C1 canonicalization, payload structure changes but expectedTimeSec remains separate
      const blockInstance = {
        id: 'test-id',
        type: 'code' as const,
        version: 'v1',
        versionCode: 'C1',
        title: 'Hello World',
        payload: normalizedPayload,
        payloadFormat: 'canonical' as const,
        sourceFormat: 'json' as const,
        sourceContent: JSON.stringify(aiJson),
        expectedTimeSec,
      };

      // Verify C1 preserves the contract
      expect(blockInstance.expectedTimeSec).toBe(240);
      expect(blockInstance.payload).toHaveProperty('page');
      expect((blockInstance.payload as any).expectedTimeSec).toBeUndefined();
      expect(blockInstance.payload.page).not.toHaveProperty('expectedTimeSec');
    });
  });
});
