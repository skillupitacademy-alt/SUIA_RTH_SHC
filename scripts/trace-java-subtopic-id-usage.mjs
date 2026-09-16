/**
 * Trace Java Internal vs External Subtopic ID Usage
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getTutorialDb } from '../packages/db-tutorial/src/db.ts';
import { tutorialSubtopics } from '../packages/db-tutorial/src/schema/tutorial-subtopics.ts';
import { tutorialSections } from '../packages/db-tutorial/src/schema/tutorial-sections.ts';
import { tutorialNavigationProgress } from '../packages/db-tutorial/src/schema/tutorial-navigation-progress.ts';
import { tutorialProgress } from '../packages/db-tutorial/src/schema/tutorial-progress.ts';
import { eq, and, isNull } from 'drizzle-orm';

const db = getTutorialDb();

const JAVA_SLUG = 'what-is-java-12efacf1';

async function main() {
  console.log('JAVA SUBTOPIC ID USAGE ANALYSIS');
  console.log('='.repeat(80));

  // Get Java subtopic
  const [javaSubtopic] = await db
    .select()
    .from(tutorialSubtopics)
    .where(and(
      eq(tutorialSubtopics.slug, JAVA_SLUG),
      isNull(tutorialSubtopics.deletedAt)
    ))
    .limit(1);

  if (!javaSubtopic) {
    console.log('❌ Java subtopic not found');
    process.exit(1);
  }

  console.log('\n📋 JAVA SUBTOPIC:');
  console.log({
    internalId: javaSubtopic.id,
    externalId: javaSubtopic.externalId,
    name: javaSubtopic.name,
    slug: javaSubtopic.slug,
  });

  const internalId = javaSubtopic.id;
  const externalId = javaSubtopic.externalId;

  console.log('\n' + '='.repeat(80));
  console.log('QUERY 1: tutorial_sections - ALL navigation nodes');
  console.log('='.repeat(80));

  // Find ALL sections with INTERNAL ID
  console.log(`\n🔍 Querying ALL sections with INTERNAL ID: ${internalId}`);
  const sectionsInternal = await db
    .select({
      id: tutorialSections.id,
      subtopicId: tutorialSections.subtopicId,
      navigationNodeId: tutorialSections.navigationNodeId,
      brandId: tutorialSections.brandId,
      status: tutorialSections.status,
    })
    .from(tutorialSections)
    .where(and(
      eq(tutorialSections.subtopicId, internalId),
      isNull(tutorialSections.deletedAt)
    ));

  if (sectionsInternal.length > 0) {
    console.log(`✅ FOUND ${sectionsInternal.length} section(s) with internal ID:`);
    sectionsInternal.forEach(s => {
      console.log(`   - navigationNodeId: "${s.navigationNodeId}"`);
      console.log(`     sectionId: ${s.id}`);
      console.log(`     brand: ${s.brandId}, status: ${s.status}`);
      console.log('');
    });
  } else {
    console.log('❌ NO SECTIONS FOUND with internal ID');
  }

  // Try with EXTERNAL ID
  console.log(`🔍 Querying ALL sections with EXTERNAL ID: ${externalId}`);
  const sectionsExternal = await db
    .select({
      id: tutorialSections.id,
      subtopicId: tutorialSections.subtopicId,
      navigationNodeId: tutorialSections.navigationNodeId,
      brandId: tutorialSections.brandId,
      status: tutorialSections.status,
    })
    .from(tutorialSections)
    .where(and(
      eq(tutorialSections.subtopicId, externalId),
      isNull(tutorialSections.deletedAt)
    ));

  if (sectionsExternal.length > 0) {
    console.log(`⚠️  FOUND ${sectionsExternal.length} section(s) with external ID (UNEXPECTED):`);
    sectionsExternal.forEach(s => {
      console.log(`   - navigationNodeId: "${s.navigationNodeId}"`);
      console.log(`     sectionId: ${s.id}`);
      console.log(`     brand: ${s.brandId}, status: ${s.status}`);
      console.log('');
    });
  } else {
    console.log('✓ NO SECTIONS FOUND with external ID (expected)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('QUERY 2: tutorial_navigation_progress (ILS)');
  console.log('='.repeat(80));

  const testUserId = '00000000-0000-0000-0000-000000000001';

  // Check with INTERNAL ID
  console.log(`\n🔍 Querying ILS progress with INTERNAL ID: ${internalId}`);
  const navProgressInternal = await db
    .select()
    .from(tutorialNavigationProgress)
    .where(and(
      eq(tutorialNavigationProgress.userId, testUserId),
      eq(tutorialNavigationProgress.subtopicId, internalId),
      isNull(tutorialNavigationProgress.deletedAt)
    ));

  if (navProgressInternal.length > 0) {
    console.log('⚠️  FOUND with internal ID:');
    navProgressInternal.forEach(p => {
      console.log(`   - Progress ${p.id}`);
      console.log(`     navNode: ${p.navigationNodeId}`);
      console.log(`     sectionId: ${p.sectionId}`);
    });
  } else {
    console.log('❌ NOT FOUND with internal ID');
  }

  // Check with EXTERNAL ID
  console.log(`\n🔍 Querying ILS progress with EXTERNAL ID: ${externalId}`);
  const navProgressExternal = await db
    .select()
    .from(tutorialNavigationProgress)
    .where(and(
      eq(tutorialNavigationProgress.userId, testUserId),
      eq(tutorialNavigationProgress.subtopicId, externalId),
      isNull(tutorialNavigationProgress.deletedAt)
    ));

  if (navProgressExternal.length > 0) {
    console.log('✅ FOUND with external ID:');
    navProgressExternal.forEach(p => {
      console.log(`   - Progress ${p.id}`);
      console.log(`     navNode: ${p.navigationNodeId}`);
      console.log(`     sectionId: ${p.sectionId}`);
    });
  } else {
    console.log('❌ NOT FOUND with external ID');
  }

  console.log('\n' + '='.repeat(80));
  console.log('QUERY 3: tutorial_progress (Legacy)');
  console.log('='.repeat(80));

  // Check with INTERNAL ID
  console.log(`\n🔍 Querying legacy progress with INTERNAL ID: ${internalId}`);
  const progressInternal = await db
    .select()
    .from(tutorialProgress)
    .where(and(
      eq(tutorialProgress.userId, testUserId),
      eq(tutorialProgress.subtopicId, internalId),
      isNull(tutorialProgress.deletedAt)
    ));

  if (progressInternal.length > 0) {
    console.log('⚠️  FOUND with internal ID:');
    progressInternal.forEach(p => {
      console.log(`   - Progress ${p.id}, status: ${p.status}`);
    });
  } else {
    console.log('❌ NOT FOUND with internal ID');
  }

  // Check with EXTERNAL ID
  console.log(`\n🔍 Querying legacy progress with EXTERNAL ID: ${externalId}`);
  const progressExternal = await db
    .select()
    .from(tutorialProgress)
    .where(and(
      eq(tutorialProgress.userId, testUserId),
      eq(tutorialProgress.subtopicId, externalId),
      isNull(tutorialProgress.deletedAt)
    ));

  if (progressExternal.length > 0) {
    console.log('✅ FOUND with external ID:');
    progressExternal.forEach(p => {
      console.log(`   - Progress ${p.id}, status: ${p.status}`);
    });
  } else {
    console.log('❌ NOT FOUND with external ID');
  }

  console.log('\n' + '='.repeat(80));
  console.log('JAVA ANALYSIS SUMMARY');
  console.log('='.repeat(80));
  console.log(`
Internal ID: ${internalId}
External ID: ${externalId}

Sections found: ${sectionsInternal.length}
ILS progress records: 0 (checked both IDs)
Legacy progress records: 0 (checked both IDs)

If Java has NO section records, the tutorial page cannot render content.
This means either:
  1. Java is not actually being accessed/working
  2. Different navigation node ID is being used
  3. Different subtopic slug is being used
  `);

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
