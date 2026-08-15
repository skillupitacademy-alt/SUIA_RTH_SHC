/**
 * Test helper to get a valid subtopic ID from the database
 */
import { db } from '../db';
import { tutorialSubtopics } from '../schema/tutorial-subtopics';

export async function getTestSubtopicId(): Promise<string> {
  const result = await db
    .select({ id: tutorialSubtopics.id })
    .from(tutorialSubtopics)
    .limit(1);
  
  if (result.length === 0) {
    throw new Error('No subtopics found in database. Please run seed script first.');
  }
  
  return result[0].id;
}
