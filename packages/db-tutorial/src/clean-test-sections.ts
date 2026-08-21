/**
 * Clean up test sections by explicit section IDs
 * 
 * SAFETY: This script requires explicit section IDs to prevent
 * accidental deletion of unrelated records.
 * 
 * Usage:
 *   tsx src/clean-test-sections.ts <section-id-1> <section-id-2> ...
 * 
 * Example:
 *   tsx src/clean-test-sections.ts abc-123 def-456 ghi-789
 */
import { db } from './db';
import { tutorialSections } from './schema';
import { inArray } from 'drizzle-orm';

async function cleanTestSections(sectionIds: string[]) {
  if (sectionIds.length === 0) {
    console.error('❌ Error: No section IDs provided\n');
    console.log('Usage:');
    console.log('  tsx src/clean-test-sections.ts <section-id-1> <section-id-2> ...\n');
    console.log('Example:');
    console.log('  tsx src/clean-test-sections.ts abc-123 def-456 ghi-789\n');
    console.log('⚠️  This script requires explicit section IDs to prevent');
    console.log('    accidental deletion of unrelated records.');
    process.exit(1);
  }

  try {
    console.log(`Cleaning ${sectionIds.length} test section(s)...\n`);
    console.log('Section IDs:', sectionIds);
    console.log('');

    // Delete only the specified sections
    const deleted = await db
      .delete(tutorialSections)
      .where(inArray(tutorialSections.id, sectionIds))
      .returning({ 
        id: tutorialSections.id,
        subtopicId: tutorialSections.subtopicId,
        brandId: tutorialSections.brandId
      });

    if (deleted.length === 0) {
      console.log('⚠️  No sections found with the provided IDs');
    } else {
      console.log(`✅ Deleted ${deleted.length} section(s):`);
      console.table(deleted);
    }

    console.log('\n✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Error cleaning test sections:', error);
    process.exit(1);
  }
}

// Get section IDs from command line arguments
const sectionIds = process.argv.slice(2);
cleanTestSections(sectionIds);
