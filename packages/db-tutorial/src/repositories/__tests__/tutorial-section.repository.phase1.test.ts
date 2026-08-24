/**
 * Repository Integration Test - Phase 1 Page Identity
 * 
 * Tests the repository layer with the Phase 1 identity model:
 * (subtopicId, navigationNodeId, brandId)
 * 
 * This test verifies that the repository correctly:
 * 1. Creates multiple independent pages per subtopic
 * 2. Retrieves pages in isolation (Page A ≠ Page B)
 * 3. Updates pages in isolation (change A, B unchanged)
 * 4. Rejects duplicate identity
 * 5. Handles soft delete/recreate
 * 6. Persists exact sidebar node.id values
 * 
 * Uses canonical test fixture:
 * - Subtopic: "What is Java?"
 * - Pages: what-is-java, java-syntax, primitive-data-types
 * - Brand: shared
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TutorialSectionRepository } from '../tutorial-section.repository';
import { getTutorialDb } from '../../db';
import { tutorialSections, tutorialSubtopics } from '../../schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { TutorialDocument } from '@quiz/types';

const db = getTutorialDb();
const repository = new TutorialSectionRepository(db);

describe('Repository Integration - Phase 1 Page Identity', () => {
  let javaSubtopicId: string;
  
  const brandId = 'shared';
  
  // Three Java pages
  const page1 = 'what-is-java';
  const page2 = 'java-syntax';
  const page3 = 'primitive-data-types';
  
  // Tutorial IDs (will be set after creation)
  let tutorial1Id: string | null = null;
  let tutorial2Id: string | null = null;
  let tutorial3Id: string | null = null;

  // Test content
  const createContent = (title: string): TutorialDocument => ({
    schemaVersion: 1,
    blocks: [
      {
        id: 'block-1',
        type: 'heading',
        content: { text: title, level: 1 },
      },
      {
        id: 'block-2',
        type: 'paragraph',
        content: { text: `Content for ${title}` },
      },
    ],
  });

  beforeAll(async () => {
    // Get canonical Java subtopic
    const javaSubtopic = await db.query.tutorialSubtopics.findFirst({
      where: (subtopics, { eq, and, isNull }) => 
        and(
          eq(subtopics.name, 'What is Java?'),
          eq(subtopics.slug, 'whatisjava'),
          isNull(subtopics.deletedAt)
        ),
    });

    if (!javaSubtopic) {
      throw new Error('Java subtopic not found. Run database setup first.');
    }

    javaSubtopicId = javaSubtopic.id;

    // Clean up any existing test tutorials
    await db
      .delete(tutorialSections)
      .where(
        and(
          eq(tutorialSections.subtopicId, javaSubtopicId),
          isNull(tutorialSections.deletedAt)
        )
      );
  });

  afterAll(async () => {
    // Clean up test data
    if (tutorial1Id) {
      await db.delete(tutorialSections).where(eq(tutorialSections.id, tutorial1Id));
    }
    if (tutorial2Id) {
      await db.delete(tutorialSections).where(eq(tutorialSections.id, tutorial2Id));
    }
    if (tutorial3Id) {
      await db.delete(tutorialSections).where(eq(tutorialSections.id, tutorial3Id));
    }
  });

  describe('Test 1: CREATE - Three Independent Pages', () => {
    it('should CREATE page 1: what-is-java', async () => {
      const tutorial = await repository.createTutorial({
        subtopicId: javaSubtopicId,
        navigationNodeId: page1,
        brandId: brandId,
        content: createContent('What is Java?'),
      });

      tutorial1Id = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.subtopicId).toBe(javaSubtopicId);
      expect(tutorial.navigationNodeId).toBe(page1);
      expect(tutorial.brandId).toBe(brandId);
      expect(tutorial.content).toBeDefined();
    });

    it('should CREATE page 2: java-syntax', async () => {
      const tutorial = await repository.createTutorial({
        subtopicId: javaSubtopicId,
        navigationNodeId: page2,
        brandId: brandId,
        content: createContent('Java Syntax'),
      });

      tutorial2Id = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.subtopicId).toBe(javaSubtopicId);
      expect(tutorial.navigationNodeId).toBe(page2);
      expect(tutorial.brandId).toBe(brandId);
    });

    it('should CREATE page 3: primitive-data-types', async () => {
      const tutorial = await repository.createTutorial({
        subtopicId: javaSubtopicId,
        navigationNodeId: page3,
        brandId: brandId,
        content: createContent('Primitive Data Types'),
      });

      tutorial3Id = tutorial.id;

      expect(tutorial.id).toBeTruthy();
      expect(tutorial.subtopicId).toBe(javaSubtopicId);
      expect(tutorial.navigationNodeId).toBe(page3);
      expect(tutorial.brandId).toBe(brandId);
    });

    it('should VERIFY all three pages have unique IDs', () => {
      expect(tutorial1Id).toBeTruthy();
      expect(tutorial2Id).toBeTruthy();
      expect(tutorial3Id).toBeTruthy();

      expect(tutorial1Id).not.toBe(tutorial2Id);
      expect(tutorial1Id).not.toBe(tutorial3Id);
      expect(tutorial2Id).not.toBe(tutorial3Id);
    });

    it('should VERIFY all three pages exist via getPagesBySubtopic', async () => {
      const pages = await repository.getPagesBySubtopic(javaSubtopicId, brandId);

      expect(pages).toHaveLength(3);

      const nodeIds = pages.map(p => p.navigationNodeId).sort();
      expect(nodeIds).toEqual([page1, page2, page3].sort());
    });
  });

  describe('Test 2: READ Isolation - Independent Page Retrieval', () => {
    it('should retrieve Page A independently', async () => {
      const tutorialA = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        page1,
        brandId
      );

      expect(tutorialA).toBeDefined();
      expect(tutorialA!.id).toBe(tutorial1Id);
      expect(tutorialA!.navigationNodeId).toBe(page1);
      
      const content = tutorialA!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('What is Java?');
      }
    });

    it('should retrieve Page B independently', async () => {
      const tutorialB = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        page2,
        brandId
      );

      expect(tutorialB).toBeDefined();
      expect(tutorialB!.id).toBe(tutorial2Id);
      expect(tutorialB!.navigationNodeId).toBe(page2);
      
      const content = tutorialB!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('Java Syntax');
      }
    });

    it('should retrieve Page C independently', async () => {
      const tutorialC = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        page3,
        brandId
      );

      expect(tutorialC).toBeDefined();
      expect(tutorialC!.id).toBe(tutorial3Id);
      expect(tutorialC!.navigationNodeId).toBe(page3);
      
      const content = tutorialC!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('Primitive Data Types');
      }
    });

    it('should prove Page A ≠ Page B (different IDs, different content)', async () => {
      const tutorialA = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        page1,
        brandId
      );

      const tutorialB = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        page2,
        brandId
      );

      expect(tutorialA!.id).not.toBe(tutorialB!.id);
      expect(tutorialA!.navigationNodeId).not.toBe(tutorialB!.navigationNodeId);
      
      const contentA = tutorialA!.content as TutorialDocument;
      const contentB = tutorialB!.content as TutorialDocument;
      
      const headingA = contentA.blocks[0];
      const headingB = contentB.blocks[0];
      
      if (headingA.type === 'heading' && headingB.type === 'heading') {
        expect(headingA.content.text).not.toBe(headingB.content.text);
      }
    });
  });

  describe('Test 3: UPDATE Isolation - Changes Only Target Page', () => {
    it('should update Page A only', async () => {
      if (!tutorial1Id) {
        throw new Error('tutorial1Id not set');
      }

      const updatedContent: TutorialDocument = {
        schemaVersion: 1,
        blocks: [
          {
            id: 'block-1',
            type: 'heading',
            content: { text: 'UPDATED: What is Java?', level: 1 },
          },
          {
            id: 'block-2',
            type: 'paragraph',
            content: { text: 'This content has been updated.' },
          },
        ],
      };

      const updated = await repository.updateTutorialContent(tutorial1Id, {
        content: updatedContent,
      });

      expect(updated).toBeDefined();
      expect(updated!.id).toBe(tutorial1Id);
      
      const content = updated!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('UPDATED: What is Java?');
      }
    });

    it('should verify Page B unchanged after Page A update', async () => {
      const tutorialB = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        page2,
        brandId
      );

      expect(tutorialB).toBeDefined();
      
      const content = tutorialB!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('Java Syntax'); // UNCHANGED
      }
    });

    it('should verify Page C unchanged after Page A update', async () => {
      const tutorialC = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        page3,
        brandId
      );

      expect(tutorialC).toBeDefined();
      
      const content = tutorialC!.content as TutorialDocument;
      const heading = content.blocks[0];
      expect(heading.type).toBe('heading');
      if (heading.type === 'heading') {
        expect(heading.content.text).toBe('Primitive Data Types'); // UNCHANGED
      }
    });
  });

  describe('Test 4: DUPLICATE Rejection', () => {
    it('should REJECT duplicate (subtopicId, navigationNodeId, brandId)', async () => {
      await expect(async () => {
        await repository.createTutorial({
          subtopicId: javaSubtopicId,
          navigationNodeId: page1, // DUPLICATE
          brandId: brandId,
          content: createContent('Duplicate What is Java?'),
        });
      }).rejects.toThrow();
    });
  });

  describe('Test 5: Cross-Subtopic Database Identity', () => {
    it('should ALLOW same navigationNodeId for different subtopicId (database level)', async () => {
      // This test proves the database identity allows (SubtopicA, Page) and (SubtopicB, Page)
      // The validator layer prevents invalid cross-topic pages separately
      
      // Get Python subtopic if exists
      const pythonSubtopic = await db.query.tutorialSubtopics.findFirst({
        where: (subtopics, { eq, and, isNull }) =>
          and(
            eq(subtopics.name, 'Complete Python'),
            isNull(subtopics.deletedAt)
          ),
      });

      if (!pythonSubtopic) {
        console.log('⚠️  Python subtopic not found, skipping cross-subtopic database test');
        return;
      }

      // The database SHOULD allow this because subtopicId is part of the unique constraint
      // (Even though the validator would reject it for topic mismatch)
      let pythonTutorialId: string | null = null;

      try {
        const pythonTutorial = await repository.createTutorial({
          subtopicId: pythonSubtopic.id,
          navigationNodeId: page1, // SAME page ID as Java
          brandId: brandId,
          content: createContent('Python What is Java Test'),
        });

        pythonTutorialId = pythonTutorial.id;

        // If we got here, database allows it (correct behavior)
        expect(pythonTutorial.subtopicId).toBe(pythonSubtopic.id);
        expect(pythonTutorial.navigationNodeId).toBe(page1);

        // Clean up
        await db.delete(tutorialSections).where(eq(tutorialSections.id, pythonTutorialId));
      } catch (error) {
        // If it failed, that would be incorrect database design
        throw new Error('Database should allow same navigationNodeId for different subtopics');
      }
    });
  });

  describe('Test 6: Soft Delete + Recreate', () => {
    it('should soft delete Page A', async () => {
      if (!tutorial1Id) {
        throw new Error('tutorial1Id not set');
      }

      await db
        .update(tutorialSections)
        .set({ deletedAt: new Date() })
        .where(eq(tutorialSections.id, tutorial1Id));

      // Verify soft deleted
      const deleted = await db.query.tutorialSections.findFirst({
        where: (sections, { eq }) => eq(sections.id, tutorial1Id!),
      });

      expect(deleted?.deletedAt).not.toBeNull();
    });

    it('should recreate Page A with same identity after soft delete', async () => {
      const recreated = await repository.createTutorial({
        subtopicId: javaSubtopicId,
        navigationNodeId: page1, // SAME identity
        brandId: brandId,
        content: createContent('Recreated What is Java?'),
      });

      expect(recreated.id).toBeTruthy();
      expect(recreated.id).not.toBe(tutorial1Id); // Different record
      expect(recreated.navigationNodeId).toBe(page1); // Same page ID

      // Update tutorial1Id to the new record for cleanup
      tutorial1Id = recreated.id;
    });
  });

  describe('Test 7: Exact Navigation Node ID Storage', () => {
    it('should persist EXACT sidebar node.id values', async () => {
      const pages = await repository.getPagesBySubtopic(javaSubtopicId, brandId);

      const storedIds = pages.map(p => p.navigationNodeId).sort();

      // Verify exact sidebar IDs with hyphens
      expect(storedIds).toContain('what-is-java');
      expect(storedIds).toContain('java-syntax');
      expect(storedIds).toContain('primitive-data-types');

      // Verify NOT normalized (no hyphens removed)
      for (const page of pages) {
        expect(page.navigationNodeId).toContain('-');
        expect(page.navigationNodeId).not.toMatch(/[A-Z]/); // No uppercase
      }
    });

    it('should retrieve by EXACT node.id, not normalized', async () => {
      // Using exact sidebar node.id should work
      const exact = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        'what-is-java',
        brandId
      );

      expect(exact).toBeDefined();

      // Using normalized value should fail
      const normalized = await repository.getTutorialByPageIdentity(
        javaSubtopicId,
        'whatisjava', // normalized (no hyphen)
        brandId
      );

      expect(normalized).toBeUndefined();
    });
  });
});
