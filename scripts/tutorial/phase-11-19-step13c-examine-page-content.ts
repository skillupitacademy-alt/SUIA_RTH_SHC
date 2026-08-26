/**
 * PHASE 11.19 STEP 13C — Examine tutorial_page_content_v2
 * This table has 2 rows - likely the Definition/Code content
 */

import { db, tutorialPageContentV2, tutorialSubtopics } from '@quiz/db-tutorial';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('PHASE 11.19 STEP 13C — EXAMINE tutorial_page_content_v2');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Get all rows from tutorial_page_content_v2
  console.log('STEP 1: Query all tutorial_page_content_v2 rows');
  console.log('──────────────────────────────────────────────────────────────────────\n');
  
  const allContent = await db
    .select()
    .from(tutorialPageContentV2);
  
  console.log(`Total rows: ${allContent.length}\n`);
  
  for (const content of allContent) {
    console.log(`\n📄 Content ID: ${content.id}`);
    console.log(`   Brand: ${content.brandId}`);
    console.log(`   Domain: ${content.domainId}`);
    console.log(`   Subject: ${content.subjectId}`);
    console.log(`   Topic: ${content.topicId}`);
    console.log(`   Subtopic: ${content.subtopicId}`);
    console.log(`   Content Type: ${content.contentType}`);
    console.log(`   Source Format: ${content.sourceFormat}`);
    console.log(`   Status: ${content.status}`);
    console.log(`   Version: ${content.version}`);
    console.log(`   Published: ${content.publishedAt || 'NOT PUBLISHED'}`);
    console.log(`   Created: ${content.createdAt}`);
    console.log(`   Updated: ${content.updatedAt}`);
    
    // Show payload preview
    if (content.payload) {
      console.log(`   Payload preview:`);
      const payloadStr = JSON.stringify(content.payload).substring(0, 200);
      console.log(`   ${payloadStr}...`);
    }
  }

  // Join with subtopic names
  console.log('\n\nSTEP 2: Content with subtopic metadata');
  console.log('──────────────────────────────────────────────────────────────────────\n');
  
  const contentWithSubtopics = await db
    .select({
      contentId: tutorialPageContentV2.id,
      contentType: tutorialPageContentV2.contentType,
      brandId: tutorialPageContentV2.brandId,
      status: tutorialPageContentV2.status,
      publishedAt: tutorialPageContentV2.publishedAt,
      subtopicId: tutorialPageContentV2.subtopicId,
      subtopicName: tutorialSubtopics.name,
      subtopicSlug: tutorialSubtopics.slug,
      subtopicExternalId: tutorialSubtopics.externalId,
    })
    .from(tutorialPageContentV2)
    .leftJoin(tutorialSubtopics, eq(tutorialPageContentV2.subtopicId, tutorialSubtopics.id));
  
  for (const row of contentWithSubtopics) {
    console.log(`📗 Content Type: ${row.contentType}`);
    console.log(`   Subtopic: ${row.subtopicName} (${row.subtopicSlug})`);
    console.log(`   Brand: ${row.brandId}`);
    console.log(`   Status: ${row.status}`);
    console.log(`   Published: ${row.publishedAt || 'NOT PUBLISHED'}\n`);
  }

  // Check if Java subtopic has content
  console.log('STEP 3: Check for Java content');
  console.log('──────────────────────────────────────────────────────────────────────\n');
  
  const javaSubtopic = contentWithSubtopics.find(
    row => row.subtopicExternalId === '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
  );
  
  if (javaSubtopic) {
    console.log('✅ Java content found in tutorial_page_content_v2!');
    console.log(`   Content Type: ${javaSubtopic.contentType}`);
    console.log(`   Status: ${javaSubtopic.status}\n`);
  } else {
    console.log('⚠️  No Java content in tutorial_page_content_v2\n');
    console.log('Existing content is for different subtopics.');
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('CRITICAL DISCOVERY');
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('tutorial_page_content_v2 contains content (likely Definition/Code)');
  console.log('BUT getTutorialById() queries tutorial_sections, not tutorial_page_content_v2!');
  console.log('');
  console.log('This explains the mismatch:');
  console.log('  - Previously visible content: stored in tutorial_page_content_v2');
  console.log('  - Current delivery query: looks in tutorial_sections');
  console.log('  - Result: content exists but wrong table is queried');
  console.log('══════════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
