/**
 * Test Helpers for Phase 2E Tests
 * Creates minimal database fixtures required for foreign key constraints
 */

import { db } from '@quiz/db';
import { tutorialDomains, tutorialSubjects, tutorialTopics, tutorialSubtopics } from '@quiz/db-tutorial';
import { eq } from 'drizzle-orm';

/**
 * Creates a complete hierarchy chain for a test subtopic
 * Returns the subtopicId that can be used in tests
 */
export async function createTestSubtopic(subtopicId: string): Promise<string> {
  const domainId = `domain-${subtopicId}`;
  const subjectId = `subject-${subtopicId}`;
  const topicId = `topic-${subtopicId}`;

  // Insert domain
  await db.insert(tutorialDomains).values({
    id: domainId,
    externalId: domainId,
    name: `Test Domain for ${subtopicId}`,
    slug: `test-domain-${subtopicId}`,
  }).onConflictDoNothing();

  // Insert subject
  await db.insert(tutorialSubjects).values({
    id: subjectId,
    externalId: subjectId,
    domainId,
    name: `Test Subject for ${subtopicId}`,
    slug: `test-subject-${subtopicId}`,
  }).onConflictDoNothing();

  // Insert topic
  await db.insert(tutorialTopics).values({
    id: topicId,
    externalId: topicId,
    subjectId,
    name: `Test Topic for ${subtopicId}`,
    slug: `test-topic-${subtopicId}`,
  }).onConflictDoNothing();

  // Insert subtopic
  await db.insert(tutorialSubtopics).values({
    id: subtopicId,
    externalId: subtopicId,
    topicId,
    name: `Test Subtopic ${subtopicId}`,
    slug: `test-subtopic-${subtopicId}`,
  }).onConflictDoNothing();

  return subtopicId;
}

/**
 * Cleans up test subtopic and its hierarchy
 */
export async function cleanupTestSubtopic(subtopicId: string): Promise<void> {
  const domainId = `domain-${subtopicId}`;
  const subjectId = `subject-${subtopicId}`;
  const topicId = `topic-${subtopicId}`;
  
  // Delete in reverse order of foreign key dependencies
  await db.delete(tutorialSubtopics).where(eq(tutorialSubtopics.id, subtopicId));
  await db.delete(tutorialTopics).where(eq(tutorialTopics.id, topicId));
  await db.delete(tutorialSubjects).where(eq(tutorialSubjects.id, subjectId));
  await db.delete(tutorialDomains).where(eq(tutorialDomains.id, domainId));
}
