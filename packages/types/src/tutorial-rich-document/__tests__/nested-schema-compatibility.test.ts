/**
 * FND21 Nested Schema Compatibility Test
 *
 * Tests nested document schema validation with focus on compatibility.
 * Baseline: 1d510f14 - nested unknown child test VERIFICATION_FAILED
 *
 * PROBLEM: TutorialBlockSchemaLazy resolves to z.any(), accepting any nested content
 * including unknown block types that should be rejected.
 *
 * This test documents current behavior and expected behavior for compatible
 * schema tightening without breaking historical documents.
 */

import { expect, it, describe } from 'vitest';
import { TutorialDocumentSchema } from '../schemas/document.schema';
import { CURRENT_SCHEMA_VERSION } from '../constants';

const container = (child: unknown) => ({
  id: 'container-1',
  type: 'two-column',
  content: {
    left: { blocks: [child] },
    right: { blocks: [] },
  },
});

const doc = (child: unknown) => ({
  schemaVersion: CURRENT_SCHEMA_VERSION,
  blocks: [container(child)],
});

describe('FND21 Nested Schema Compatibility', () => {
  describe('Valid nested blocks (must always pass)', () => {
    it('accepts nested paragraph', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({ id: 'child-1', type: 'paragraph', content: { text: 'Hello world' } })
      );
      expect(result.success).toBe(true);
    });

    it('accepts nested definition D1', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({
          id: 'def-1',
          type: 'definition',
          version: 'D1',
          content: {
            page: {
              type: 'Definition',
              title: 'Test',
              intro: 'Intro',
              definition: 'Definition text',
              explanation: ['Point 1'],
            },
          },
        })
      );
      expect(result.success).toBe(true);
    });

    it('accepts nested code C1', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({
          id: 'code-1',
          type: 'code',
          version: 'C1',
          content: {
            page: { type: 'CODE + EXPLANATION', title: 'Example' },
            code: { language: 'javascript', source: 'console.log("test");' },
          },
        })
      );
      expect(result.success).toBe(true);
    });

    it('accepts nested introduction I1', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({
          id: 'intro-1',
          type: 'introduction',
          version: 'I1',
          content: {
            page: {
              badge: 'Topic',
              title: 'Introduction',
              subtitle: 'Learn basics',
              learningGoal: 'Master concepts',
            },
          },
        })
      );
      expect(result.success).toBe(true);
    });

    it('accepts deeply nested valid structure', () => {
      const nestedDoc = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'outer-1',
            type: 'two-column',
            content: {
              left: {
                blocks: [
                  {
                    id: 'inner-1',
                    type: 'card-grid',
                    content: {
                      cards: [
                        {
                          id: 'card-1',
                          title: 'Card Title',
                          blocks: [
                            { id: 'para-1', type: 'paragraph', content: { text: 'Nested' } },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
              right: { blocks: [] },
            },
          },
        ],
      };
      const result = TutorialDocumentSchema.safeParse(nestedDoc);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid nested blocks (should reject)', () => {
    it('FAILING: rejects unknown nested block type', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({ id: 'child-1', type: 'unrecognized', content: {} })
      );
      // KNOWN FAILURE: currently passes due to z.any() in TutorialBlockSchemaLazy
      // DO NOT FIX without compatibility assessment per D4 requirements
      expect(result.success).toBe(false);
    });

    it('FAILING: rejects nested block with missing required id', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({ type: 'paragraph', content: { text: 'No ID' } })
      );
      // Should reject due to missing required id field
      expect(result.success).toBe(false);
    });

    it('FAILING: rejects nested block with missing required type', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({ id: 'block-1', content: { text: 'No type' } })
      );
      // Should reject due to missing required type field
      expect(result.success).toBe(false);
    });

    it('FAILING: rejects nested block with malformed content structure', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({ id: 'para-1', type: 'paragraph', content: 'should be object' })
      );
      // Should reject - paragraph content must be object with text property
      expect(result.success).toBe(false);
    });
  });

  describe('Schema version validation', () => {
    it('rejects unsupported document version', () => {
      const result = TutorialDocumentSchema.safeParse({
        ...doc({ id: 'child-1', type: 'paragraph', content: { text: 'Test' } }),
        schemaVersion: -1,
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing schema version', () => {
      const docWithoutVersion = {
        blocks: [container({ id: 'child-1', type: 'paragraph', content: { text: 'Test' } })],
      };
      const result = TutorialDocumentSchema.safeParse(docWithoutVersion);
      expect(result.success).toBe(false);
    });
  });

  describe('Historical compatibility scenarios', () => {
    it('accepts legacy code block without version', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({
          id: 'code-legacy',
          type: 'code',
          content: {
            page: { type: 'CODE', title: 'Legacy' },
            code: { language: 'text', source: 'legacy' },
          },
        })
      );
      // Legacy blocks may not have explicit version field
      expect(result.success).toBe(true);
    });

    it('accepts block with extra fields (forward compatibility)', () => {
      const result = TutorialDocumentSchema.safeParse(
        doc({
          id: 'para-1',
          type: 'paragraph',
          content: { text: 'Test' },
          futureField: 'ignored',
          metadata: { custom: 'data' },
        })
      );
      // Schema should allow unknown fields for forward compatibility
      expect(result.success).toBe(true);
    });
  });
});
