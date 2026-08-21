/**
 * Test helper to obtain any existing subtopic.
 *
 * IMPORTANT:
 * This does not identify a dedicated test fixture.
 * Tests using this ID MUST only clean up records they created.
 */
import { db } from '../db';
import { tutorialSubtopics } from '../schema/tutorial-subtopics';

export async function getAnySubtopicId(): Promise<string> {
  const result = await db
    .select({ id: tutorialSubtopics.id })
    .from(tutorialSubtopics)
    .limit(1);

  if (result.length === 0) {
    throw new Error('No subtopics found in database. Please run seed script first.');
  }

  return result[0].id;
}
