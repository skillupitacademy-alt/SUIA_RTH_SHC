/**
 * Tutorial Rich Document - Document Tests
 */

import { describe, it, expect } from 'vitest';
import { TutorialDocumentSchema } from '../schemas/document.schema';
import { validateDocumentForSection } from '../validation';
import { javascriptIntroFixture } from './fixtures/javascript-intro.fixture';
import { twoColumnLayoutFixture } from './fixtures/two-column-layout.fixture';

describe('TutorialDocument', () => {
  describe('Schema Validation', () => {
    it('should validate JavaScript intro fixture', () => {
      const result = TutorialDocumentSchema.safeParse(javascriptIntroFixture);
      expect(result.success).toBe(true);
    });

    it('should validate two-column layout fixture', () => {
      const result = TutorialDocumentSchema.safeParse(twoColumnLayoutFixture);
      expect(result.success).toBe(true);
    });

    it('should reject document with invalid schema version', () => {
      const invalid = {
        ...javascriptIntroFixture,
        schemaVersion: 999,
      };
      const result = TutorialDocumentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject document with missing blocks', () => {
      const invalid = {
        schemaVersion: 1,
        // blocks missing
      };
      const result = TutorialDocumentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject document with invalid block type', () => {
      const invalid = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'test',
            type: 'invalid-type',
            content: {},
          },
        ],
      };
      const result = TutorialDocumentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Section Validation', () => {
    it('should validate JavaScript intro for notes section', () => {
      const result = validateDocumentForSection(javascriptIntroFixture, 'notes');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate JavaScript intro for layman section', () => {
      const result = validateDocumentForSection(javascriptIntroFixture, 'layman');
      expect(result.valid).toBe(true);
    });

    it('should validate two-column layout for technical section', () => {
      const result = validateDocumentForSection(twoColumnLayoutFixture, 'technical');
      expect(result.valid).toBe(true);
    });

    it('should reject code blocks in overview section', () => {
      const docWithCode = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'code1',
            type: 'code' as const,
            content: {
              language: 'javascript' as const,
              code: 'console.log("test");',
            },
          },
        ],
      };
      const result = validateDocumentForSection(docWithCode, 'overview');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'BLOCK_NOT_ALLOWED',
        })
      );
    });

    it('should detect duplicate block IDs', () => {
      const docWithDuplicates = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'duplicate',
            type: 'heading' as const,
            content: { text: 'Test 1', level: 1 as const },
          },
          {
            id: 'duplicate', // Same ID!
            type: 'paragraph' as const,
            content: { text: 'Test' },
          },
        ],
      };
      const result = validateDocumentForSection(docWithDuplicates, 'notes');
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'DUPLICATE_BLOCK_ID',
        })
      );
    });
  });
});
