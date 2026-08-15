/**
 * Tutorial Section Repository Tests
 * Tests for NEW Tutorial Composer repository layer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TutorialSectionRepository } from '../tutorial-section.repository';
import type { TutorialDocument } from '@quiz/types';
import { CURRENT_SCHEMA_VERSION } from '@quiz/types';

describe('TutorialSectionRepository', () => {
  let repository: TutorialSectionRepository;

  beforeEach(() => {
    repository = new TutorialSectionRepository();
  });

  describe('createSection', () => {
    it('should create section with TutorialDocument content', async () => {
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
        ],
      };

      const input = {
        subtopicId: crypto.randomUUID(),
        sectionType: 'notes',
        difficulty: 'beginner',
        content: document,
        brandId: 'shared',
      };

      const section = await repository.createSection(input);

      expect(section).toBeDefined();
      expect(section.id).toBeDefined();
      expect(section.subtopicId).toBe(input.subtopicId);
      expect(section.sectionType).toBe('notes');
      expect(section.difficulty).toBe('beginner');
      expect(section.content).toEqual(document);
      expect(section.version).toBe(1);
      expect(section.status).toBe('draft');
    });

    it('should preserve TutorialDocument in JSONB round-trip', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Heading', level: 1 },
          },
          {
            id: 'paragraph-1',
            type: 'paragraph',
            content: { text: 'This is a test paragraph with Unicode: 你好 🎉' },
          },
          {
            id: 'code-1',
            type: 'code',
            content: {
              language: 'javascript',
              code: 'const x = "hello world";',
            },
          },
          {
            id: 'two-col-1',
            type: 'two-column',
            content: {
              left: {
                blocks: [
                  {
                    id: 'left-para',
                    type: 'paragraph',
                    content: { text: 'Left content' },
                  },
                ],
              },
              right: {
                blocks: [
                  {
                    id: 'right-para',
                    type: 'paragraph',
                    content: { text: 'Right content' },
                  },
                ],
              },
            },
          },
        ],
        metadata: {
          estimatedReadTime: 5,
          tags: ['test', 'example'],
        },
      };

      const input = {
        subtopicId: crypto.randomUUID(),
        sectionType: 'notes',
        difficulty: 'beginner',
        content: document,
      };

      const created = await repository.createSection(input);
      const retrieved = await repository.getSectionById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.content).toEqual(document);
    });
  });

  describe('updateSection', () => {
    it('should update content and increment version', async () => {
      // Create section
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

      const section = await repository.createSection({
        subtopicId: crypto.randomUUID(),
        sectionType: 'notes',
        difficulty: 'beginner',
        content: initialDocument,
      });

      expect(section.version).toBe(1);

      // Update content
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

      const updated = await repository.updateSection(section.id, {
        content: updatedDocument,
      });

      expect(updated).toBeDefined();
      expect(updated!.version).toBe(2);
      expect(updated!.content).toEqual(updatedDocument);
    });
  });

  describe('querySections', () => {
    it('should filter by subtopic', async () => {
      const subtopicId = crypto.randomUUID();

      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      // Create sections for this subtopic
      await repository.createSection({
        subtopicId,
        sectionType: 'notes',
        difficulty: 'beginner',
        content: document,
      });

      await repository.createSection({
        subtopicId,
        sectionType: 'technical',
        difficulty: 'beginner',
        content: document,
      });

      // Query
      const result = await repository.querySections({ subtopicId }, 10);

      expect(result.sections.length).toBeGreaterThanOrEqual(2);
      expect(result.sections.every((s) => s.subtopicId === subtopicId)).toBe(
        true
      );
    });
  });

  describe('archiveSection', () => {
    it('should soft delete section', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const section = await repository.createSection({
        subtopicId: crypto.randomUUID(),
        sectionType: 'notes',
        difficulty: 'beginner',
        content: document,
      });

      // Archive
      await repository.archiveSection(section.id);

      // Should not be retrievable
      const retrieved = await repository.getSectionById(section.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('publishSection', () => {
    it('should set status to deployed and publishedAt', async () => {
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

      const section = await repository.createSection({
        subtopicId: crypto.randomUUID(),
        sectionType: 'notes',
        difficulty: 'beginner',
        content: document,
      });

      expect(section.status).toBe('draft');
      expect(section.publishedAt).toBeNull();

      const published = await repository.publishSection(section.id);

      expect(published).toBeDefined();
      expect(published!.status).toBe('deployed');
      expect(published!.publishedAt).toBeDefined();
    });
  });
});
