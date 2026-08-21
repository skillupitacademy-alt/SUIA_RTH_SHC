/**
 * GATE 4 — Concurrency & Duplicate Identity Test
 * 
 * Verifies that the V2 unique constraint (subtopic_id, brand_id) prevents
 * duplicate tutorials from being created concurrently while allowing
 * different brands to create tutorials for the same subtopic.
 */

import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { db } from '../../db';
import { tutorialSubtopics, tutorialSections } from '../../schema';
import { inArray } from 'drizzle-orm';
import { TutorialComposerService } from '../tutorial-composer.service';
import type { CreateTutorialInput } from '../../repositories/tutorial-section.repository';
import type { TutorialDocument } from '@quiz/types';

describe('GATE 4 — V2 Concurrency & Duplicate Prevention', () => {
  let service: TutorialComposerService;
  let createdTutorialIds: string[] = [];
  let testSubtopicId: string;

  beforeAll(async () => {
    const result = await db
      .select({ id: tutorialSubtopics.id })
      .from(tutorialSubtopics)
      .limit(1);

    if (result.length === 0) {
      throw new Error('No test subtopic available');
    }

    testSubtopicId = result[0].id;
  });

  beforeEach(() => {
    service = new TutorialComposerService();
    createdTutorialIds = [];
  });

  afterEach(async () => {
    if (createdTutorialIds.length > 0) {
      await db
        .delete(tutorialSections)
        .where(inArray(tutorialSections.id, createdTutorialIds));
    }
  });

  it('should prevent concurrent creation of duplicate (subtopicId, brandId)', async () => {
    const document: TutorialDocument = {
      schemaVersion: 1,
      blocks: [{
        id: randomUUID(),
        type: 'paragraph',
        content: { text: 'Concurrency test content' }
      }]
    };

    const input: CreateTutorialInput = {
      subtopicId: testSubtopicId,
      brandId: 'realtutorialhub', // Valid brand enum value
      content: document,
    };

    const mockContext = { userId: 'test-user-gate4' };

    // Attempt to create 5 identical tutorials concurrently
    const promises = Array.from({ length: 5 }, () =>
      service.createTutorial(input, mockContext).catch((err) => err)
    );

    const results = await Promise.all(promises);

    // Exactly one should succeed
    const successes = results.filter((r) => typeof r === 'object' && r.id);
    const failures = results.filter((r) => r instanceof Error);

    expect(successes.length).toBe(1);
    expect(failures.length).toBe(4);

    // Track the successful tutorial for cleanup
    if (successes[0]?.id) {
      createdTutorialIds.push(successes[0].id);
    }

    // Verify failures are due to duplicate constraint
    failures.forEach((err) => {
      expect(err.message).toMatch(/already exists|duplicate|unique constraint/i);
    });
  });

  it('should allow different brands to create tutorials for the same subtopic', async () => {
    const document: TutorialDocument = {
      schemaVersion: 1,
      blocks: [{
        id: randomUUID(),
        type: 'paragraph',
        content: { text: 'Multi-brand test content' }
      }]
    };

    const brandA: CreateTutorialInput = {
      subtopicId: testSubtopicId,
      brandId: 'realtutorialhub', // Valid brand enum value
      content: document,
    };
    const brandB: CreateTutorialInput = {
      subtopicId: testSubtopicId,
      brandId: 'skillup', // Different valid brand enum value
      content: document,
    };

    const mockContextA = { userId: 'test-user-gate4-a' };
    const mockContextB = { userId: 'test-user-gate4-b' };

    // Both should succeed because brandId differs
    const tutorialA = await service.createTutorial(brandA, mockContextA);
    const tutorialB = await service.createTutorial(brandB, mockContextB);

    expect(tutorialA.id).toBeDefined();
    expect(tutorialB.id).toBeDefined();
    expect(tutorialA.id).not.toBe(tutorialB.id);

    expect(tutorialA.subtopicId).toBe(testSubtopicId);
    expect(tutorialB.subtopicId).toBe(testSubtopicId);
    expect(tutorialA.brandId).toBe('realtutorialhub');
    expect(tutorialB.brandId).toBe('skillup');

    createdTutorialIds.push(tutorialA.id, tutorialB.id);
  });

  it('should prevent duplicate creation after the first succeeds', async () => {
    const document: TutorialDocument = {
      schemaVersion: 1,
      blocks: [{
        id: randomUUID(),
        type: 'paragraph',
        content: { text: 'Sequential test content' }
      }]
    };

    const input: CreateTutorialInput = {
      subtopicId: testSubtopicId,
      brandId: 'skillup', // Valid brand enum value
      content: document,
    };

    const mockContext = { userId: 'test-user-gate4-seq' };

    // First creation should succeed
    const first = await service.createTutorial(input, mockContext);
    expect(first.id).toBeDefined();
    createdTutorialIds.push(first.id);

    // Second creation with same identity should fail
    await expect(service.createTutorial(input, mockContext)).rejects.toThrow(
      /already exists|duplicate|unique constraint/i
    );
  });

  it('should allow creation after archival', async () => {
    const document: TutorialDocument = {
      schemaVersion: 1,
      blocks: [{
        id: randomUUID(),
        type: 'paragraph',
        content: { text: 'Archive test content' }
      }]
    };

    const input: CreateTutorialInput = {
      subtopicId: testSubtopicId,
      brandId: 'shared', // Valid brand enum value
      content: document,
    };

    const mockContext = { userId: 'test-user-gate4-archive' };

    // Create first tutorial
    const first = await service.createTutorial(input, mockContext);
    expect(first.id).toBeDefined();
    createdTutorialIds.push(first.id);

    // Archive it
    await service.archiveTutorial(first.id, mockContext);

    // Should be able to create a new one with the same identity
    const second = await service.createTutorial(input, mockContext);
    expect(second.id).toBeDefined();
    expect(second.id).not.toBe(first.id);
    createdTutorialIds.push(second.id);
  });
});
