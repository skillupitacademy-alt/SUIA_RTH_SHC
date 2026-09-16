/**
 * Find all navigation nodes for Java tutorial
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getTutorialDb } from '../packages/db-tutorial/src/db.ts';
import { tutorialSubtopics } from '../packages/db-tutorial/src/schema/tutorial-subtopics.ts';
import { tutorialSections } from '../packages/db-tutorial/src/schema/tutorial-sections.ts';
import { eq, and, isNull } from 'drizzle-orm';

const db = getTutorialDb();

async function main() {
  console.log('Finding all Java tutorial sections...\n');

  // Find Java subtopic
  const [javaSubtopic] = await db
    .select()
    .from(tutorialSubtopics)
    .where(and(
      eq(tutorialSubtopics.slug, 'what-is-java-12efacf1'),
      isNull(tutorialSubtopics.deletedAt)
    ))
    .limit(1);

  if (!javaSubtopic) {
    console.log('❌ Java subtopic not found');
    process.exit(1);
  }

  console.log('Java Subtopic:');
  console.log({
    id: javaSubtopic.id,
    externalId: javaSubtopic.externalId,
    name: javaSubtopic.name,
    slug: javaSubtopic.slug,
  });

  // Find ALL sections for this subtopic
  console.log('\n\nAll sections for Java subtopic:');
  const sections = await db
    .select({
      id: tutorialSections.id,
      subtopicId: tutorialSections.subtopicId,
      navigationNodeId: tutorialSections.navigationNodeId,
      brandId: tutorialSections.brandId,
      status: tutorialSections.status,
    })
    .from(tutorialSections)
    .where(and(
      eq(tutorialSections.subtopicId, javaSubtopic.id),
      isNull(tutorialSections.deletedAt)
    ));

  if (sections.length === 0) {
    console.log('❌ NO SECTIONS FOUND for Java');
  } else {
    console.log(`✓ Found ${sections.length} section(s):\n`);
    sections.forEach((section, idx) => {
      console.log(`${idx + 1}. navigationNodeId: "${section.navigationNodeId}"`);
      console.log(`   sectionId: ${section.id}`);
      console.log(`   brandId: ${section.brandId}`);
      console.log(`   status: ${section.status}`);
      console.log('');
    });
  }

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
