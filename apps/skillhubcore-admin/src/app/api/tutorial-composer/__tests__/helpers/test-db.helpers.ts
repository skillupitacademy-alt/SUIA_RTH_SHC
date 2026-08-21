/**
 * Test Database Helpers
 * 
 * Follows Phase 1H proven pattern for test isolation
 */

import { db, tutorialSections, tutorialSubtopics } from '@quiz/db-tutorial';
import { inArray, sql } from 'drizzle-orm';

/**
 * Get a test subtopic ID from the database
 * Throws if no subtopics exist (seed required)
 */
export async function getTestSubtopicId(): Promise<string> {
  const result = await db
    .select({ id: tutorialSubtopics.id })
    .from(tutorialSubtopics)
    .limit(1);

  if (result.length === 0) {
    throw new Error(
      'No subtopics found in test database. Run seed script first.'
    );
  }

  return result[0].id;
}

/**
 * Hard delete test sections by IDs
 * Uses Phase 1H proven cleanup pattern
 */
export async function cleanupTestSections(sectionIds: string[]): Promise<void> {
  if (sectionIds.length === 0) return;

  await db
    .delete(tutorialSections)
    .where(inArray(tutorialSections.id, sectionIds));
}

/**
 * Verify a section exists in the database
 */
export async function verifySectionExists(sectionId: string): Promise<boolean> {
  const result = await db
    .select({ id: tutorialSections.id })
    .from(tutorialSections)
    .where(sql`id = ${sectionId}`)
    .limit(1);

  return result.length > 0;
}
