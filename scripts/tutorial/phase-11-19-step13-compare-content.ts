/**
 * PHASE 11.19 STEP 13 — Compare Known-Good Content vs Current Delivery
 * 
 * Find previously published Definition/Code content and compare with
 * current Java "What Is Java?" delivery lookup
 */

import { db, tutorialSections, tutorialSubtopics } from '@quiz/db-tutorial';
import { sql, isNull, inArray, eq, and, or } from 'drizzle-orm';

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('PHASE 11.19 STEP 13 — COMPARE KNOWN-GOOD CONTENT');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  // Step 1: Verify tutorial_sections table exists
  console.log('STEP 1: Verify tutorial_sections schema');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  try {
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      ) as exists
    `);
    
    const exists = tableCheck.rows[0]?.exists;
    console.log(`tutorial_sections table exists: ${exists ? '✅ YES' : '❌ NO'}\n`);
    
    if (!exists) {
      console.log('❌ tutorial_sections table does not exist in TutorialDB');
      console.log('This explains why no content is being returned.\n');
      return;
    }
  } catch (error: any) {
    console.log(`❌ Error checking table: ${error.message}\n`);
    return;
  }

  // Step 2: Find ALL tutorial_sections rows
  console.log('STEP 2: Query ALL tutorial_sections rows');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  const allSections = await db
    .select({
      id: tutorialSections.id,
      subtopicId: tutorialSections.subtopicId,
      navigationNodeId: tutorialSections.navigationNodeId,
      brandId: tutorialSections.brandId,
      status: tutorialSections.status,
      version: tutorialSections.version,
      orderIndex: tutorialSections.orderIndex,
      publishedAt: tutorialSections.publishedAt,
      deletedAt: tutorialSections.deletedAt,
      createdAt: tutorialSections.createdAt,
      updatedAt: tutorialSections.updatedAt,
    })
    .from(tutorialSections);
  
  console.log(`Total tutorial_sections rows: ${allSections.length}\n`);
  
  if (allSections.length === 0) {
    console.log('⚠️  No tutorial_sections rows exist in database');
    console.log('No content has been persisted via TutorialComposerService\n');
    return;
  }

  // Step 3: Find Java subtopic internal ID
  console.log('STEP 3: Resolve Java subtopic identity');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  const [javaSubtopic] = await db
    .select({
      id: tutorialSubtopics.id,
      externalId: tutorialSubtopics.externalId,
      slug: tutorialSubtopics.slug,
      name: tutorialSubtopics.name,
    })
    .from(tutorialSubtopics)
    .where(eq(tutorialSubtopics.externalId, '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'))
    .limit(1);
  
  if (!javaSubtopic) {
    console.log('❌ Java subtopic not found in TutorialDB');
    return;
  }
  
  console.log(`Java subtopic found:`);
  console.log(`  Internal ID: ${javaSubtopic.id}`);
  console.log(`  External ID: ${javaSubtopic.externalId}`);
  console.log(`  Slug: ${javaSubtopic.slug}`);
  console.log(`  Name: ${javaSubtopic.name}\n`);

  // Step 4: Display all sections with subtopic names
  console.log('STEP 4: ALL tutorial_sections with subtopic metadata');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  const sectionsWithSubtopics = await db
    .select({
      sectionId: tutorialSections.id,
      subtopicInternalId: tutorialSections.subtopicId,
      subtopicExternalId: tutorialSubtopics.externalId,
      subtopicName: tutorialSubtopics.name,
      subtopicSlug: tutorialSubtopics.slug,
      navigationNodeId: tutorialSections.navigationNodeId,
      brandId: tutorialSections.brandId,
      status: tutorialSections.status,
      version: tutorialSections.version,
      publishedAt: tutorialSections.publishedAt,
      deletedAt: tutorialSections.deletedAt,
      createdAt: tutorialSections.createdAt,
    })
    .from(tutorialSections)
    .leftJoin(tutorialSubtopics, eq(tutorialSections.subtopicId, tutorialSubtopics.id))
    .orderBy(tutorialSections.createdAt);
  
  for (const section of sectionsWithSubtopics) {
    console.log(`\n📄 Section ID: ${section.sectionId}`);
    console.log(`   Subtopic: ${section.subtopicName} (${section.subtopicSlug})`);
    console.log(`   Navigation Node: ${section.navigationNodeId}`);
    console.log(`   Brand: ${section.brandId}`);
    console.log(`   Status: ${section.status}`);
    console.log(`   Version: ${section.version}`);
    console.log(`   Published: ${section.publishedAt || 'NOT PUBLISHED'}`);
    console.log(`   Deleted: ${section.deletedAt ? 'YES' : 'NO'}`);
    console.log(`   Created: ${section.createdAt}`);
  }
  
  // Step 5: Find Java content specifically
  console.log('\n\nSTEP 5: Java "What Is Java?" content lookup');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  const javaContent = sectionsWithSubtopics.filter(
    s => s.subtopicInternalId === javaSubtopic.id
  );
  
  console.log(`Found ${javaContent.length} section(s) for Java subtopic\n`);
  
  if (javaContent.length === 0) {
    console.log('⚠️  No tutorial_sections rows for Java subtopic');
    console.log('Java content has not been authored/published via Composer\n');
  } else {
    for (const section of javaContent) {
      console.log(`Java section:`);
      console.log(`  Navigation Node: ${section.navigationNodeId}`);
      console.log(`  Brand: ${section.brandId}`);
      console.log(`  Status: ${section.status}`);
      console.log(`  Published: ${section.publishedAt || 'NOT PUBLISHED'}\n`);
    }
  }

  // Step 6: Simulate getTutorialById() query
  console.log('STEP 6: Simulate getTutorialById() query');
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log('Current delivery request:');
  console.log(`  subtopicId (internal): ${javaSubtopic.id}`);
  console.log(`  navigationNodeId: whatisjava`);
  console.log(`  brandId: skillup`);
  console.log(`  includeUnpublished: false`);
  console.log('');
  
  // Exact query from getTutorialById()
  const conditions = [
    eq(tutorialSections.subtopicId, javaSubtopic.id),
    isNull(tutorialSections.deletedAt),
    eq(tutorialSections.navigationNodeId, 'whatisjava'),
    inArray(tutorialSections.status, ['approved', 'deployed']),
    or(
      eq(tutorialSections.brandId, 'shared'),
      eq(tutorialSections.brandId, 'skillup'),
      eq(tutorialSections.brandVisibility, 'shared_visible')
    )!
  ];
  
  const matchingContent = await db
    .select({
      id: tutorialSections.id,
      navigationNodeId: tutorialSections.navigationNodeId,
      brandId: tutorialSections.brandId,
      status: tutorialSections.status,
      publishedAt: tutorialSections.publishedAt,
    })
    .from(tutorialSections)
    .where(and(...conditions))
    .limit(1);
  
  console.log(`Query result: ${matchingContent.length} row(s)\n`);
  
  if (matchingContent.length === 0) {
    console.log('❌ No matching content found');
    console.log('\nPossible reasons:');
    console.log('  1. navigationNodeId mismatch (expected: whatisjava)');
    console.log('  2. status not approved/deployed');
    console.log('  3. brandId mismatch (expected: shared, skillup, or shared_visible)');
    console.log('  4. Content is soft-deleted');
    console.log('  5. No content authored yet\n');
  } else {
    console.log('✅ Matching content found!');
    console.log(JSON.stringify(matchingContent[0], null, 2));
    console.log('');
  }

  // Step 7: Find known-good content (Definition/Code)
  console.log('STEP 7: Identify known-good previously published content');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  const publishedContent = sectionsWithSubtopics.filter(
    s => s.status && ['approved', 'deployed'].includes(s.status) && !s.deletedAt
  );
  
  console.log(`Found ${publishedContent.length} published (approved/deployed) section(s)\n`);
  
  if (publishedContent.length > 0) {
    console.log('Known-good published content:');
    for (const section of publishedContent) {
      console.log(`\n  📗 ${section.subtopicName}`);
      console.log(`     Navigation Node: ${section.navigationNodeId}`);
      console.log(`     Brand: ${section.brandId}`);
      console.log(`     Status: ${section.status}`);
      console.log(`     Published: ${section.publishedAt}`);
    }
    console.log('');
  }

  console.log('\n══════════════════════════════════════════════════════════════════════');
  console.log('DIAGNOSIS');
  console.log('══════════════════════════════════════════════════════════════════════');
  
  if (allSections.length === 0) {
    console.log('No tutorial content exists in tutorial_sections table.');
    console.log('Content must be authored via Composer API first.');
  } else if (javaContent.length === 0) {
    console.log('Java subtopic exists in hierarchy but has no tutorial_sections content.');
    console.log('Previously published content exists for other subtopics.');
    console.log('Java content needs to be authored via Composer.');
  } else if (matchingContent.length === 0) {
    console.log('Java content exists but does not match delivery query predicates.');
    console.log('Check navigationNodeId, status, brandId, or deleted_at fields.');
  } else {
    console.log('Java content exists and matches delivery predicates.');
    console.log('Delivery should work correctly.');
  }
  
  console.log('══════════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
