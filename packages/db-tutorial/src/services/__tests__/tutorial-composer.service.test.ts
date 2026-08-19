/**
 * Tutorial Composer Service Tests
 * Tests for NEW Tutorial Composer business logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialComposerService } from '../tutorial-composer.service';
import type { TutorialDocument } from '@quiz/types';
import {
  TutorialDocumentValidationError,
  SectionAlreadyExistsError,
  SectionNotFoundError,
  CURRENT_SCHEMA_VERSION,
} from '@quiz/types';

describe('TutorialComposerService', () => {
  let service: TutorialComposerService;
  const mockContext = { userId: 'test-user-id' };

  beforeEach(() => {
    service = new TutorialComposerService();
  });

  describe('createSection', () => {
    it('should create section with valid TutorialDocument', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: {
              text: 'Test Heading',
              level: 1,
            },
          },
          {
            id: 'paragraph-1',
            type: 'paragraph',
            content: {
              text: 'Test paragraph',
            },
          },
        ],
      };

      const section = await service.createSection(
        {
          subtopicId: crypto.randomUUID(),
          sectionType: 'notes',
          difficulty: 'simple',
          content: document,
        },
        mockContext
      );

      expect(section).toBeDefined();
      expect(section.content).toEqual(document);
    });

    it('should reject invalid schemaVersion', async () => {
      const invalidDocument = {
        schemaVersion: 999,
        blocks: [],
      } as any;

      await expect(
        service.createSection(
          {
            subtopicId: crypto.randomUUID(),
            sectionType: 'notes',
            difficulty: 'simple',
            content: invalidDocument,
          },
          mockContext
        )
      ).rejects.toThrow(TutorialDocumentValidationError);
    });

    it('should reject invalid block type', async () => {
      const invalidDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'test',
            type: 'invalid-block-type',
            content: {},
          },
        ],
      } as any;

      await expect(
        service.createSection(
          {
            subtopicId: crypto.randomUUID(),
            sectionType: 'notes',
            difficulty: 'simple',
            content: invalidDocument,
          },
          mockContext
        )
      ).rejects.toThrow(TutorialDocumentValidationError);
    });

    it('should reject duplicate block IDs', async () => {
      const documentWithDuplicates: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'duplicate-id',
            type: 'heading',
            content: { text: 'First', level: 1 },
          },
          {
            id: 'duplicate-id', // Same ID!
            type: 'paragraph',
            content: { text: 'Second' },
          },
        ],
      };

      await expect(
        service.createSection(
          {
            subtopicId: crypto.randomUUID(),
            sectionType: 'notes',
            difficulty: 'simple',
            content: documentWithDuplicates,
          },
          mockContext
        )
      ).rejects.toThrow(TutorialDocumentValidationError);
    });

    it('should reject blocks not allowed in section type', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'code-1',
            type: 'code',
            content: {
              language: 'javascript',
              code: 'console.log("test");',
            },
          },
        ],
      };

      // Code blocks are not allowed in 'overview' section
      await expect(
        service.createSection(
          {
            subtopicId: crypto.randomUUID(),
            sectionType: 'overview',
            difficulty: 'simple',
            content: document,
          },
          mockContext
        )
      ).rejects.toThrow(TutorialDocumentValidationError);
    });

    it('should reject duplicate section creation', async () => {
      const subtopicId = crypto.randomUUID();
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Test', level: 1 },
          },
        ],
      };

      // Create first section
      await service.createSection(
        {
          subtopicId,
          sectionType: 'notes',
          difficulty: 'simple',
          content: document,
        },
        mockContext
      );

      // Try to create duplicate
      await expect(
        service.createSection(
          {
            subtopicId,
            sectionType: 'notes',
            difficulty: 'simple',
            content: document,
          },
          mockContext
        )
      ).rejects.toThrow(SectionAlreadyExistsError);
    });
  });

  describe('updateSection', () => {
    it('should update section content and validate', async () => {
      const initialDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Original', level: 1 },
          },
        ],
      };

      const section = await service.createSection(
        {
          subtopicId: crypto.randomUUID(),
          sectionType: 'notes',
          difficulty: 'simple',
          content: initialDocument,
        },
        mockContext
      );

      const updatedDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Updated', level: 1 },
          },
        ],
      };

      const updated = await service.updateSection(
        section.id,
        { content: updatedDocument },
        mockContext
      );

      expect(updated.content).toEqual(updatedDocument);
      expect(updated.version).toBe(2);
    });

    it('should reject invalid content on update', async () => {
      const initialDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const section = await service.createSection(
        {
          subtopicId: crypto.randomUUID(),
          sectionType: 'notes',
          difficulty: 'simple',
          content: initialDocument,
        },
        mockContext
      );

      const invalidDocument = {
        schemaVersion: 999,
        blocks: [],
      } as any;

      await expect(
        service.updateSection(
          section.id,
          { content: invalidDocument },
          mockContext
        )
      ).rejects.toThrow(TutorialDocumentValidationError);
    });
  });

  describe('publishSection', () => {
    it('should publish valid section', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Test', level: 1 },
          },
        ],
      };

      const section = await service.createSection(
        {
          subtopicId: crypto.randomUUID(),
          sectionType: 'notes',
          difficulty: 'simple',
          content: document,
        },
        mockContext
      );

      const published = await service.publishSection(section.id, mockContext);

      expect(published.status).toBe('deployed');
      expect(published.publishedAt).toBeDefined();
    });

    it('should reject publishing empty document', async () => {
      const emptyDocument: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const section = await service.createSection(
        {
          subtopicId: crypto.randomUUID(),
          sectionType: 'notes',
          difficulty: 'simple',
          content: emptyDocument,
        },
        mockContext
      );

      await expect(
        service.publishSection(section.id, mockContext)
      ).rejects.toThrow(TutorialDocumentValidationError);
    });

    it('should reject publishing non-existent section', async () => {
      const fakeSectionId = crypto.randomUUID();

      await expect(
        service.publishSection(fakeSectionId, mockContext)
      ).rejects.toThrow(SectionNotFoundError);
    });
  });

  describe('getSection', () => {
    it('should retrieve section by ID', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Test', level: 1 },
          },
        ],
      };

      const created = await service.createSection(
        {
          subtopicId: crypto.randomUUID(),
          sectionType: 'notes',
          difficulty: 'simple',
          content: document,
        },
        mockContext
      );

      const retrieved = await service.getSection(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.content).toEqual(document);
    });

    it('should throw for non-existent section', async () => {
      const fakeSectionId = crypto.randomUUID();

      await expect(service.getSection(fakeSectionId)).rejects.toThrow(
        SectionNotFoundError
      );
    });
  });
});

