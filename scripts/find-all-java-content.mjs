/**
 * Search for ANY Java-related tutorial content
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getTutorialDb } from '../packages/db-tutorial/src/db.ts';
import { tutorialSubtopics } from '../packages/db-tutorial/src/schema/tutorial-subtopics.ts';
import { tutorialSections } from '../packages/db-tutorial/src/schema/tutorial-sections.ts';
import { tutorialTopics } from '../packages/db-tutorial/src/schema/tutorial-topics.ts';
import { isNull, like, or, eq } from 'drizzle-orm';

const db = getTutorialDb();

async function main() {
  console.log('SEARCHING FOR ALL JAVA-RELATED CONTENT');
  console.log('='.repeat(80));

  // Search for Java topics
  console.log('\n1. Searching for Java topics...');
  const javaTopics = await db
    .select()
    .from(tutorialTopics)
    .where(or(
      like(tutorialTopics.name, '%Java%'),
      like(tutorialTopics.slug, '%java%')
    ));

  console.log(`Found ${javaTopics.length} Java topic(s):`);
  javaTopics.forEach(topic => {
    console.log(`  - ${topic.name} (${topic.slug})`);
    console.log(`    ID: ${topic.id}`);
    console.log(`    External ID: ${topic.externalId}`);
  });

  // Search for Java subtopics
  console.log('\n2. Searching for Java subtopics...');
  const javaSubtopics = await db
    .select()
    .from(tutorialSubtopics)
    .where(or(
      like(tutorialSubtopics.name, '%Java%'),
      like(tutorialSubtopics.slug, '%java%')
    ));

  console.log(`Found ${javaSubtopics.length} Java subtopic(s):`);
  javaSubtopics.forEach(subtopic => {
    console.log(`  - ${subtopic.name} (${subtopic.slug})`);
    console.log(`    Internal ID: ${subtopic.id}`);
    console.log(`    External ID: ${subtopic.externalId}`);
  });

  // Search for sections related to ANY Java subtopic
  console.log('\n3. Searching for Java tutorial sections...');
  
  if (javaSubtopics.length > 0) {
    for (const subtopic of javaSubtopics) {
      const sections = await db
        .select()
        .from(tutorialSections)
        .where(eq(tutorialSections.subtopicId, subtopic.id));

      console.log(`\n   Subtopic: ${subtopic.name}`);
      if (sections.length > 0) {
        console.log(`   ✅ Found ${sections.length} section(s):`);
        sections.forEach(section => {
          console.log(`      - Navigation Node: "${section.navigationNodeId}"`);
          console.log(`        Section ID: ${section.id}`);
          console.log(`        Brand: ${section.brandId}`);
          console.log(`        Status: ${section.status}`);
          console.log(`        Deleted: ${section.deletedAt ? 'YES' : 'NO'}`);
        });
      } else {
        console.log(`   ❌ No sections found`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('CONCLUSION');
  console.log('='.repeat(80));
  console.log(`
If NO Java sections exist, then:
  - Java tutorial pages cannot render content
  - Any "working Java" claim needs to be verified
  - The comparison between Java and Python may be invalid
  `);

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
