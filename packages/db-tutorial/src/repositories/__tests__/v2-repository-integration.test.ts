/**
 * V2 Repository Integration Test
 *
 * OBJECTIVE: Prove V2 repository works with real V2 database
 *
 * Tests V2 identity: (subtopic_id, brand_id)
 * Tests TutorialDocument JSONB persistence
 * Tests Definition D1 round-trip
 *
 * DOES NOT test:
 * - Composer service (Step 3)
 * - Delivery service (Step 4)
 * - Phase 1H educational pipeline (Step 5)
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { db } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { eq, inArray } from 'drizzle-orm';
import { TutorialSectionRepository } from '../tutorial-section.repository';
import type { TutorialDocument } from '@quiz/types';

describe('V2 Repository Integration Test', () => {
  let testSubtopicId: string;
  let createdTutorialIds: string[] = [];
  const repository = new TutorialSectionRepository();

  beforeAll(async () => {
    // Get first available subtopic for testing
    const result = await db
      .select({ id: tutorialSubtopics.id })
      .from(tutorialSubtopics)
      .limit(1);

    if (result.length === 0) {
      throw new Error('No test subtopic available - database may be empty');
    }

    testSubtopicId = result[0].id;
    console.log(`Using test subtopic: ${testSubtopicId}`);
  });

  beforeEach(() => {
    // Reset the array to track tutorials created in this test
    createdTutorialIds = [];
  });

  afterEach(async () => {
    // Cleanup created tutorials
    if (createdTutorialIds.length > 0) {
      await db
        .delete(tutorialSections)
        .where(inArray(tutorialSections.id, createdTutorialIds));

      createdTutorialIds = [];
    }
  });

  describe('V2 Identity: (subtopic_id, brand_id)', () => {
    it('should create tutorial with V2 identity (shared brand)', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: 'block-1',
          type: 'paragraph',
          content: { text: 'Test paragraph' }
        }]
      };

      const tutorial = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: document
      });

      createdTutorialIds.push(tutorial.id);

      expect(tutorial.subtopicId).toBe(testSubtopicId);
      expect(tutorial.brandId).toBe('shared');
      expect(tutorial.content).toEqual(document);
      expect(tutorial.version).toBe(1);
      expect(tutorial.status).toBe('draft');
    });

    it('should retrieve tutorial by V2 identity (subtopicId, brandId)', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: 'block-2',
          type: 'heading',
          content: { text: 'Test Heading', level: 2 }
        }]
      };

      const created = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: document
      });

      createdTutorialIds.push(created.id);

      const retrieved = await repository.getTutorialBySubtopic(
        testSubtopicId,
        'shared'
      );

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.content).toEqual(document);
    });

    it('should enforce UNIQUE(subtopic_id, brand_id) constraint', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{ id: 'b1', type: 'paragraph', content: { text: 'First' } }]
      };

      const first = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: document
      });

      createdTutorialIds.push(first.id);

      // Attempt duplicate creation - should fail
      await expect(
        repository.createTutorial({
          subtopicId: testSubtopicId,
          brandId: 'shared',
          content: document
        })
      ).rejects.toThrow();
    });

    it('should allow different brands for same subtopic', async () => {
      const sharedDoc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{ id: 'b1', type: 'paragraph', content: { text: 'Shared content' } }]
      };

      const skillupDoc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{ id: 'b2', type: 'paragraph', content: { text: 'SkillUp content' } }]
      };

      const sharedTutorial = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: sharedDoc
      });

      const skillupTutorial = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'skillup',
        content: skillupDoc
      });

      createdTutorialIds.push(sharedTutorial.id, skillupTutorial.id);

      expect(sharedTutorial.brandId).toBe('shared');
      expect(skillupTutorial.brandId).toBe('skillup');
      expect(sharedTutorial.content).toEqual(sharedDoc);
      expect(skillupTutorial.content).toEqual(skillupDoc);
    });
  });

  describe('TutorialDocument JSONB Persistence', () => {
    it('should persist and retrieve TutorialDocument exactly', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'heading-1',
            type: 'heading',
            content: { text: 'Introduction', level: 2 }
          },
          {
            id: 'para-1',
            type: 'paragraph',
            content: { text: 'This is a test paragraph.' }
          }
        ],
        metadata: {
          estimatedReadTime: 5,
          tags: ['test', 'v2']
        }
      };

      const created = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: document
      });

      createdTutorialIds.push(created.id);

      const retrieved = await repository.getTutorialById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.content).toEqual(document);
      expect(retrieved!.content.blocks).toHaveLength(2);
      expect(retrieved!.content.blocks[0].type).toBe('heading');
      expect(retrieved!.content.blocks[1].type).toBe('paragraph');
      expect(retrieved!.content.metadata).toEqual(document.metadata);
    });

    it('should preserve multiple blocks of same type', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          { id: 'p1', type: 'paragraph', content: { text: 'First paragraph' } },
          { id: 'p2', type: 'paragraph', content: { text: 'Second paragraph' } },
          { id: 'p3', type: 'paragraph', content: { text: 'Third paragraph' } }
        ]
      };

      const created = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: document
      });

      createdTutorialIds.push(created.id);

      const retrieved = await repository.getTutorialById(created.id);

      expect(retrieved!.content.blocks).toHaveLength(3);
      expect(retrieved!.content.blocks.every(b => b.type === 'paragraph')).toBe(true);
    });
  });

  describe('Definition D1 Block Round-Trip', () => {
    it('should persist and retrieve Definition D1 block exactly', async () => {
      const document: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{
          id: 'd1-block-1',
          type: 'definition',
          version: 'D1',
          content: {
            page: {
              type: 'definition',
              category: 'JavaScript Fundamentals',
              title: 'What Is a Variable?',
              intro: 'A variable is a name given to a value.',
              definition: 'A variable is a symbolic name that refers to an object.',
              explanation: [
                'Variables store data',
                'Variables have names',
                'Variables can change'
              ],
              example: {
                language: 'javascript',
                code: 'let x = 10;'
              },
              characteristics: [
                { icon: '📝', title: 'Named', description: 'Has a name' },
                { icon: '🔄', title: 'Mutable', description: 'Can change' }
              ],
              takeaway: 'Variables store data by name.'
            }
          }
        }]
      };

      const created = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: document
      });

      createdTutorialIds.push(created.id);

      const retrieved = await repository.getTutorialById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.content.blocks).toHaveLength(1);

      // Narrow type using discriminator
      const block = retrieved!.content.blocks[0];
      if (block.type !== 'definition') {
        throw new Error('Expected definition block');
      }
      expect(block.version).toBe('D1');
      expect(block.content.page.type).toBe('definition');
      expect(block.content.page.title).toBe('What Is a Variable?');
      expect(block.content.page.explanation).toHaveLength(3);
      expect(block.content.page.characteristics).toHaveLength(2);
    });
  });

  describe('Content Updates', () => {
    it('should update tutorial content and increment version', async () => {
      const originalDoc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{ id: 'b1', type: 'paragraph', content: { text: 'Original' } }]
      };

      const created = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: originalDoc
      });

      createdTutorialIds.push(created.id);
      expect(created.version).toBe(1);

      const updatedDoc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{ id: 'b1', type: 'paragraph', content: { text: 'Updated' } }]
      };

      const updated = await repository.updateTutorialContent(created.id, {
        content: updatedDoc
      });

      expect(updated).toBeDefined();
      expect(updated!.version).toBe(2);
      expect(updated!.content).toEqual(updatedDoc);
    });

    it('should support optimistic concurrency control', async () => {
      const doc: TutorialDocument = {
        schemaVersion: 1,
        blocks: [{ id: 'b1', type: 'paragraph', content: { text: 'Test' } }]
      };

      const created = await repository.createTutorial({
        subtopicId: testSubtopicId,
        brandId: 'shared',
        content: doc
      });

      createdTutorialIds.push(created.id);

      const newDoc: TutorialDocument = {
        ...doc,
        blocks: [{ id: 'b1', type: 'paragraph', content: { text: 'Updated' } }]
      };

      // Update with correct version
      const updated = await repository.updateTutorialContentWithVersion(
        created.id,
        1, // expected version
        { content: newDoc }
      );

      expect(updated).not.toBeNull();
      expect(updated!.version).toBe(2);

      // Update with stale version - should fail
      const staleUpdate = await repository.updateTutorialContentWithVersion(
        created.id,
        1, // stale version
        { content: newDoc }
      );

      expect(staleUpdate).toBeNull();
    });
  });
});
