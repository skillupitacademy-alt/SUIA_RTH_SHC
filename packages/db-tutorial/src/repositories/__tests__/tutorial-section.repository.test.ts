/**
 * Tutorial Section Repository Tests
 * Tests for NEW Tutorial Composer repository layer
 */

import { describe, it, expect, beforeEach, beforeAll, afterEach } from 'vitest';
import { TutorialSectionRepository } from '../tutorial-section.repository';
import type { TutorialDocument } from '@quiz/types';
import { CURRENT_SCHEMA_VERSION } from '@quiz/types';
import { getTestSubtopicId } from '../../test-helpers/get-test-subtopic';

describe('TutorialSectionRepository', () => {
  let repository: TutorialSectionRepository;
  let testSubtopicId: string;
  let createdSectionIds: string[] = [];

  beforeAll(async () => {
    // Get a valid subtopic ID from the database
    testSubtopicId = await getTestSubtopicId();
  });

  beforeEach(() => {
    repository = new TutorialSectionRepository();
    createdSectionIds = [];
  });

  afterEach(async () => {
    // Clean up all sections created during the test
    for (const id of createdSectionIds) {
      try {
        await repository.archiveSection(id);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    createdSectionIds = [];
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
        subtopicId: testSubtopicId,
        sectionType: 'notes',
        difficulty: 'expert',
        content: document,
        brandId: 'shared',
      };

      const section = await repository.createSection(input);
      createdSectionIds.push(section.id);

      expect(section).toBeDefined();
      expect(section.id).toBeDefined();
      expect(section.subtopicId).toBe(input.subtopicId);
      expect(section.sectionType).toBe('notes');
      expect(section.difficulty).toBe('expert');
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
        subtopicId: testSubtopicId,
        sectionType: 'layman',
        difficulty: 'expert',
        content: document,
      };

      const created = await repository.createSection(input);
      createdSectionIds.push(created.id);
      
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
        subtopicId: testSubtopicId,
        sectionType: 'technical',
        difficulty: 'expert',
        content: initialDocument,
      });
      createdSectionIds.push(section.id);

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

  describe('updateSectionWithVersion', () => {
    it('should update content when version matches', async () => {
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
        subtopicId: testSubtopicId,
        sectionType: 'overview',
        difficulty: 'expert',
        content: initialDocument,
      });
      createdSectionIds.push(section.id);

      expect(section.version).toBe(1);

      // Update with correct version
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

      const updated = await repository.updateSectionWithVersion(
        section.id,
        1, // Expected version
        { content: updatedDocument }
      );

      expect(updated).not.toBeNull();
      expect(updated!.version).toBe(2);
      expect(updated!.content).toEqual(updatedDocument);
    });

    it('should return null when version does not match', async () => {
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
        subtopicId: testSubtopicId,
        sectionType: 'real_life',
        difficulty: 'expert',
        content: initialDocument,
      });
      createdSectionIds.push(section.id);

      expect(section.version).toBe(1);

      // Try to update with wrong version
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

      const result = await repository.updateSectionWithVersion(
        section.id,
        999, // Wrong version
        { content: updatedDocument }
      );

      expect(result).toBeNull();

      // Verify original content unchanged
      const retrieved = await repository.getSectionById(section.id);
      expect(retrieved!.version).toBe(1);
      expect(retrieved!.content).toEqual(initialDocument);
    });

    it('should prevent concurrent updates via optimistic concurrency', async () => {
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
        subtopicId: testSubtopicId,
        sectionType: 'practice',
        difficulty: 'expert',
        content: initialDocument,
      });
      createdSectionIds.push(section.id);

      expect(section.version).toBe(1);

      // First update succeeds
      const firstUpdate: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'First Update', level: 1 },
          },
        ],
      };

      const firstResult = await repository.updateSectionWithVersion(
        section.id,
        1, // Both start with version 1
        { content: firstUpdate }
      );

      expect(firstResult).not.toBeNull();
      expect(firstResult!.version).toBe(2);

      // Second concurrent update with stale version fails
      const secondUpdate: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Second Update', level: 1 },
          },
        ],
      };

      const secondResult = await repository.updateSectionWithVersion(
        section.id,
        1, // Stale version
        { content: secondUpdate }
      );

      expect(secondResult).toBeNull(); // Conflict detected

      // Verify first update won
      const retrieved = await repository.getSectionById(section.id);
      expect(retrieved!.version).toBe(2);
      expect(retrieved!.content).toEqual(firstUpdate);
    });

    it('should increment version exactly once per update', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const section = await repository.createSection({
        subtopicId: testSubtopicId,
        sectionType: 'quiz',
        difficulty: 'expert',
        content: document,
      });
      createdSectionIds.push(section.id);

      // Multiple sequential updates
      const updated1 = await repository.updateSectionWithVersion(
        section.id,
        1,
        { content: document }
      );
      expect(updated1!.version).toBe(2);

      const updated2 = await repository.updateSectionWithVersion(
        section.id,
        2,
        { content: document }
      );
      expect(updated2!.version).toBe(3);

      const updated3 = await repository.updateSectionWithVersion(
        section.id,
        3,
        { content: document }
      );
      expect(updated3!.version).toBe(4);
    });

    it('should return null for deleted section', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const section = await repository.createSection({
        subtopicId: testSubtopicId,
        sectionType: 'summary',
        difficulty: 'expert',
        content: document,
      });
      createdSectionIds.push(section.id);

      // Archive section
      await repository.archiveSection(section.id);

      // Try to update archived section
      const result = await repository.updateSectionWithVersion(
        section.id,
        1,
        { content: document }
      );

      expect(result).toBeNull();
    });

    it('should update non-content fields without incrementing version', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      const section = await repository.createSection({
        subtopicId: testSubtopicId,
        sectionType: 'project',
        difficulty: 'expert',
        content: document,
        orderIndex: 0,
      });
      createdSectionIds.push(section.id);

      // Update only orderIndex (not content)
      const updated = await repository.updateSectionWithVersion(
        section.id,
        1,
        { orderIndex: 5 }
      );

      expect(updated).not.toBeNull();
      expect(updated!.orderIndex).toBe(5);
      expect(updated!.version).toBe(1); // Version NOT incremented
    });
  });

  describe('querySections', () => {
    it('should filter by subtopic', async () => {
      const document: TutorialDocument = {
        schemaVersion: CURRENT_SCHEMA_VERSION,
        blocks: [],
      };

      // Create sections for this subtopic with different types
      const section1 = await repository.createSection({
        subtopicId: testSubtopicId,
        sectionType: 'visual',
        difficulty: 'expert',
        content: document,
      });
      createdSectionIds.push(section1.id);

      const section2 = await repository.createSection({
        subtopicId: testSubtopicId,
        sectionType: 'interview',
        difficulty: 'expert',
        content: document,
      });
      createdSectionIds.push(section2.id);

      // Query
      const result = await repository.querySections({ subtopicId: testSubtopicId }, 10);

      expect(result.sections.length).toBeGreaterThanOrEqual(2);
      expect(result.sections.every((s) => s.subtopicId === testSubtopicId)).toBe(
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
        subtopicId: testSubtopicId,
        sectionType: 'code',
        difficulty: 'expert',
        content: document,
      });
      createdSectionIds.push(section.id);

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
        subtopicId: testSubtopicId,
        sectionType: 'assignment',
        difficulty: 'expert',
        content: document,
      });
      createdSectionIds.push(section.id);

      expect(section.status).toBe('draft');
      expect(section.publishedAt).toBeNull();

      const published = await repository.publishSection(section.id);

      expect(published).toBeDefined();
      expect(published!.status).toBe('deployed');
      expect(published!.publishedAt).toBeDefined();
    });
  });
});

