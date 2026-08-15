/**
 * Clean up test sections created during tests
 * Deletes all sections for test subtopic with expert difficulty
 */
import { db } from './db';
import { sql } from 'drizzle-orm';
import { getTestSubtopicId } from './test-helpers/get-test-subtopic';

async function cleanTestSections() {
  try {
    console.log('Cleaning test sections...\n');

    const testSubtopicId = await getTestSubtopicId();
    console.log(`Test subtopic ID: ${testSubtopicId}\n`);

    // Delete all expert difficulty sections for this subtopic
    const result = await db.execute(sql`
      DELETE FROM tutorial_sections
      WHERE subtopic_id = ${testSubtopicId}
      AND difficulty = 'expert'
      RETURNING id, section_type, difficulty;
    `);

    console.log(`✅ Deleted ${result.rowCount} test sections:`);
    console.table(result.rows);

    console.log('\n✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Error cleaning test sections:', error);
    process.exit(1);
  }
}

cleanTestSections();
