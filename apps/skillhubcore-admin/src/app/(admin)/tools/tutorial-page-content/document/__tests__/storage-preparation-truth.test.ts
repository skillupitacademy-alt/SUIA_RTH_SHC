/**
 * FND21 Storage Preparation Truth Control
 *
 * Tests that prepareBlockForStorage does not fill incomplete author content
 * with example lesson claims. Baseline: 6ae971b9 - D1/I1 authoring truth VERIFICATION_FAILED
 *
 * PROBLEM: normalizeDefinitionD1Payload and normalizeIntroductionI1Payload fill
 * missing fields with example content (definitionD1Example, introductionI1Example),
 * causing unrelated lesson titles to acquire example educational claims in persisted storage.
 *
 * REQUIREMENT: Separate preview/sample defaults (for UI rendering) from persisted
 * authored content. Real saved lessons must not contain demo text.
 */

import { expect, it, describe } from 'vitest';
import { prepareBlockForStorage } from '../blockVersionDefinitions';

interface StoragePreparedTestContent {
  page?: {
    type?: string;
    category?: string;
    badge?: string;
    title?: string;
    subtitle?: string;
    intro?: string;
    definition?: string;
    explanation?: string | string[];
    example?: {
      language?: string;
      code?: string;
    };
    characteristics?: Array<{ title: string; description: string }>;
    takeaway?: string;
    learningGoal?: string;
    motto?: {
      lines?: string[];
    };
    topic?: {
      title?: string;
      description?: string;
      quote?: string;
    };
    solution?: {
      code?: {
        code?: string;
      };
    };
    keyTakeaway?: string;
  };
}

describe('FND21 Storage Preparation Truth', () => {
  describe('Definition D1 storage preparation', () => {
    it('FAILING: does not fill missing definition with example claims', () => {
      const incompletePayload = {
        page: {
          title: 'Understanding Python Lists',
        },
      };

      const prepared = prepareBlockForStorage(incompletePayload, 'definition', 'D1');
      const content = prepared.content as StoragePreparedTestContent;

      // Verify the title is preserved
      expect(content.page?.title).toBe('Understanding Python Lists');

      // KNOWN FAILURE: currently fills missing fields with example content
      // DO NOT FIX without separating preview vs storage normalization

      // Must not contain example definition text about arrays
      expect(JSON.stringify(content)).not.toContain('collection of items');
      expect(JSON.stringify(content)).not.toContain('ordered sequence');

      // Must not contain example explanation points
      expect(JSON.stringify(content)).not.toContain('Arrays provide');
      expect(JSON.stringify(content)).not.toContain('efficiently');

      // Must not contain example code snippets
      expect(JSON.stringify(content)).not.toContain('const numbers');
      expect(JSON.stringify(content)).not.toContain('fruits.push');
    });

    it('FAILING: preserves author-supplied partial content without example injection', () => {
      const partialPayload = {
        page: {
          title: 'Lambda Functions',
          intro: 'Anonymous functions in Python',
          definition: 'A lambda function is a small anonymous function.',
          // Missing: explanation, example, characteristics, takeaway
        },
      };

      const prepared = prepareBlockForStorage(partialPayload, 'definition', 'D1');
      const content = prepared.content as StoragePreparedTestContent;

      // Verify author content preserved
      expect(content.page?.title).toBe('Lambda Functions');
      expect(content.page?.intro).toBe('Anonymous functions in Python');
      expect(content.page?.definition).toBe('A lambda function is a small anonymous function.');

      // KNOWN FAILURE: missing fields get filled with example content
      // Should either: (a) leave fields missing, or (b) use empty defaults, NOT example content

      // Must not inject example explanation about arrays
      expect(content.page?.explanation).not.toContain('Arrays provide');

      // Must not inject example code
      if (content.page?.example) {
        expect(content.page.example.code).not.toContain('const numbers');
        expect(content.page.example.code).not.toContain('fruits.push');
      }
    });

    it('preserves fully supplied definition payload', () => {
      const completePayload = {
        page: {
          type: 'Definition',
          category: 'Python Basics',
          title: 'Dictionary',
          intro: 'Key-value pairs in Python',
          definition: 'A dictionary is an unordered collection of key-value pairs.',
          explanation: ['Fast lookup by key', 'Mutable structure'],
          example: {
            language: 'python',
            code: 'student = {"name": "Alice", "age": 20}',
          },
          characteristics: [
            { title: 'Mutable', description: 'Can be modified' },
          ],
          takeaway: 'Dictionaries enable efficient data lookup.',
        },
      };

      const prepared = prepareBlockForStorage(completePayload, 'definition', 'D1');
      const content = prepared.content as StoragePreparedTestContent;

      // Complete content should pass through unchanged
      expect(content.page?.title).toBe('Dictionary');
      expect(content.page?.definition).toBe('A dictionary is an unordered collection of key-value pairs.');
      expect(content.page?.explanation).toHaveLength(2);
      expect(content.page?.example?.code).toContain('student');
    });
  });

  describe('Introduction I1 storage preparation', () => {
    it('FAILING: does not fill missing introduction with example claims', () => {
      const incompletePayload = {
        page: {
          title: 'Getting Started with Django',
          subtitle: 'Web framework fundamentals',
        },
      };

      const prepared = prepareBlockForStorage(incompletePayload, 'introduction', 'I1');
      const content = prepared.content as StoragePreparedTestContent;

      // Verify the title is preserved
      expect(content.page?.title).toBe('Getting Started with Django');
      expect(content.page?.subtitle).toBe('Web framework fundamentals');

      // KNOWN FAILURE: currently fills missing fields with example content

      // Must not contain example learning goal about arrays
      expect(JSON.stringify(content)).not.toContain('Master arrays');
      expect(JSON.stringify(content)).not.toContain('fundamental data structure');

      // Must not contain example topic description
      expect(JSON.stringify(content)).not.toContain('ordered collection');
      expect(JSON.stringify(content)).not.toContain('dynamic resizing');

      // Must not contain example code snippets
      expect(JSON.stringify(content)).not.toContain('const numbers');
      expect(JSON.stringify(content)).not.toContain('fruits.push');
    });

    it('FAILING: preserves author-supplied partial introduction without example injection', () => {
      const partialPayload = {
        page: {
          badge: 'Web Development',
          title: 'REST APIs',
          subtitle: 'Building modern web services',
          learningGoal: 'Learn to design and implement RESTful APIs.',
          // Missing: motto, topic, whereFit, solution, whereUsed, roadmap, whyMatters, keyTakeaway
        },
      };

      const prepared = prepareBlockForStorage(partialPayload, 'introduction', 'I1');
      const content = prepared.content as StoragePreparedTestContent;

      // Verify author content preserved
      expect(content.page?.badge).toBe('Web Development');
      expect(content.page?.title).toBe('REST APIs');
      expect(content.page?.learningGoal).toBe('Learn to design and implement RESTful APIs.');

      // KNOWN FAILURE: missing fields get filled with example content

      // Must not inject example motto about arrays
      if (content.page?.motto?.lines) {
        expect(content.page.motto.lines.join(' ')).not.toContain('Master Arrays');
      }

      // Must not inject example topic description
      expect(JSON.stringify(content.page?.topic || {})).not.toContain('ordered collection');

      // Must not inject example code
      if (content.page?.solution?.code) {
        expect(content.page.solution.code.code).not.toContain('const numbers');
      }
    });

    it('preserves fully supplied introduction payload', () => {
      const completePayload = {
        page: {
          badge: 'Database',
          title: 'SQL Joins',
          subtitle: 'Combining data from multiple tables',
          motto: { lines: ['Master', 'Data', 'Relationships', 'Today'] },
          learningGoal: 'Understand and apply different types of SQL joins.',
          topic: {
            title: 'SQL Joins',
            description: 'Techniques for combining rows from two or more tables.',
            quote: 'Data is only valuable when connected.',
          },
          keyTakeaway: 'Joins enable powerful relational queries.',
        },
      };

      const prepared = prepareBlockForStorage(completePayload, 'introduction', 'I1');
      const content = prepared.content as StoragePreparedTestContent;

      // Complete content should pass through
      expect(content.page?.title).toBe('SQL Joins');
      expect(content.page?.learningGoal).toContain('SQL joins');
      expect(content.page?.motto?.lines?.[0]).toBe('Master');
      expect(content.page?.keyTakeaway).toContain('relational queries');
    });
  });

  describe('Storage preparation metadata', () => {
    it('returns correct payload format for definition D1', () => {
      const prepared = prepareBlockForStorage({ page: { title: 'Test' } }, 'definition', 'D1');
      expect(prepared.payloadFormat).toBe('legacy');
    });

    it('returns correct payload format for introduction I1', () => {
      const prepared = prepareBlockForStorage({ page: { title: 'Test' } }, 'introduction', 'I1');
      expect(prepared.payloadFormat).toBe('legacy');
    });

    it('returns correct payload format for code C1', () => {
      const payload = {
        page: {
          type: 'CODE + EXPLANATION',
          title: 'Example',
          introduction: 'Test code block'
        },
        code: { language: 'javascript', source: 'console.log("test");' },
      };
      const prepared = prepareBlockForStorage(payload, 'code', 'C1');
      expect(prepared.payloadFormat).toBe('canonical');
    });
  });

  describe('Preview vs storage distinction', () => {
    it('documents that preview normalization currently fills defaults', () => {
      // This test documents current behavior: preview normalization SHOULD fill
      // defaults for UI rendering, but storage preparation should NOT.
      //
      // Current issue: both use the same normalizer functions
      // (normalizeDefinitionD1Payload, normalizeIntroductionI1Payload)
      //
      // Required fix: separate normalizePreview from prepareForStorage logic
      expect(true).toBe(true); // Documentation test
    });
  });
});
