/**
 * Trace Internal vs External Subtopic ID Usage
 * 
 * Check which ID is used where in the database queries
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { getTutorialDb } from '../packages/db-tutorial/src/db.ts';
import { tutorialSubtopics } from '../packages/db-tutorial/src/schema/tutorial-subtopics.ts';
import { tutorialSections } from '../packages/db-tutorial/src/schema/tutorial-sections.ts';
import { tutorialNavigationProgress } from '../packages/db-tutorial/src/schema/tutorial-navigation-progress.ts';
import { tutorialProgress } from '../packages/db-tutorial/src/schema/tutorial-progress.ts';
import { eq, and, isNull, or } from 'drizzle-orm';

const db = getTutorialDb();

const PYTHON_SLUG = 'complete-python-5b1cfc3d';
const PYTHON_NAV_NODE = 'whatispython';

async function main() {
  console.log('SUBTOPIC ID USAGE ANALYSIS');
  console.log('='.repeat(80));

  // Get Python subtopic
  const [pythonSubtopic] = await db
    .select()
    .from(tutorialSubtopics)
    .where(and(
      eq(tutorialSubtopics.slug, PYTHON_SLUG),
      isNull(tutorialSubtopics.deletedAt)
    ))
    .limit(1);

  if (!pythonSubtopic) {
    console.log('❌ Python subtopic not found');
    process.exit(1);
  }

  console.log('\n📋 PYTHON SUBTOPIC:');
  console.log({
    internalId: pythonSubtopic.id,
    externalId: pythonSubtopic.externalId,
    name: pythonSubtopic.name,
    slug: pythonSubtopic.slug,
  });

  const internalId = pythonSubtopic.id;
  const externalId = pythonSubtopic.externalId;

  console.log('\n' + '='.repeat(80));
  console.log('QUERY 1: tutorial_sections (Content Delivery)');
  console.log('='.repeat(80));
  console.log('Expected: Uses INTERNAL ID (tutorial_subtopics.id)');
  console.log('Foreign Key: tutorial_sections.subtopic_id → tutorial_subtopics.id');

  // Test with INTERNAL ID (should work)
  console.log(`\n🔍 Querying with INTERNAL ID: ${internalId}`);
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
      eq(tutorialSections.navigationNodeId, PYTHON_NAV_NODE),
      isNull(tutorialSections.deletedAt)
    ));

  if (sectionsInternal.length > 0) {
    console.log('✅ FOUND with internal ID:');
    sectionsInternal.forEach(s => console.log(`   - Section ${s.id}, brand: ${s.brandId}, status: ${s.status}`));
  } else {
    console.log('❌ NOT FOUND with internal ID');
  }

  // Test with EXTERNAL ID (should NOT work for FK relationship)
  console.log(`\n🔍 Querying with EXTERNAL ID: ${externalId}`);
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
      eq(tutorialSections.navigationNodeId, PYTHON_NAV_NODE),
      isNull(tutorialSections.deletedAt)
    ));

  if (sectionsExternal.length > 0) {
    console.log('⚠️  FOUND with external ID (UNEXPECTED - FK constraint should prevent this):');
    sectionsExternal.forEach(s => console.log(`   - Section ${s.id}, brand: ${s.brandId}, status: ${s.status}`));
  } else {
    console.log('✓ NOT FOUND with external ID (expected - external ID is not the FK)');
  }

  console.log('\n' + '='.repeat(80));
  console.log('QUERY 2: tutorial_navigation_progress (ILS Tracking)');
  console.log('='.repeat(80));
  console.log('Expected: Uses EXTERNAL ID (MainDB subtopics.id)');
  console.log('No FK constraint - stores MainDB reference as UUID');

  const testUserId = '00000000-0000-0000-0000-000000000001';

  // Test with INTERNAL ID
  console.log(`\n🔍 Querying with INTERNAL ID: ${internalId}`);
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
    navProgressInternal.forEach(p => console.log(`   - Progress ${p.id}, navNode: ${p.navigationNodeId}`));
  } else {
    console.log('❌ NOT FOUND with internal ID');
  }

  // Test with EXTERNAL ID
  console.log(`\n🔍 Querying with EXTERNAL ID: ${externalId}`);
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
    navProgressExternal.forEach(p => console.log(`   - Progress ${p.id}, navNode: ${p.navigationNodeId}`));
  } else {
    console.log('❌ NOT FOUND with external ID');
  }

  console.log('\n' + '='.repeat(80));
  console.log('QUERY 3: tutorial_progress (Legacy Tracking)');
  console.log('='.repeat(80));
  console.log('Expected: Uses EXTERNAL ID (MainDB subtopics.id)');
  console.log('No FK constraint - stores MainDB reference as UUID');

  // Test with INTERNAL ID
  console.log(`\n🔍 Querying with INTERNAL ID: ${internalId}`);
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
    progressInternal.forEach(p => console.log(`   - Progress ${p.id}, status: ${p.status}`));
  } else {
    console.log('❌ NOT FOUND with internal ID');
  }

  // Test with EXTERNAL ID
  console.log(`\n🔍 Querying with EXTERNAL ID: ${externalId}`);
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
    progressExternal.forEach(p => console.log(`   - Progress ${p.id}, status: ${p.status}`));
  } else {
    console.log('❌ NOT FOUND with external ID');
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`
Internal ID: ${internalId}
External ID: ${externalId}

Expected Pattern:
  tutorial_sections.subtopic_id       → Uses INTERNAL ID (FK to tutorial_subtopics.id)
  tutorial_navigation_progress.subtopic_id → Uses EXTERNAL ID (MainDB reference)
  tutorial_progress.subtopic_id       → Uses EXTERNAL ID (MainDB reference)

Current Frontend:
  hierarchy.subtopic.id = ${internalId} (INTERNAL)
  hierarchy.subtopic.externalId = ${externalId} (EXTERNAL)

Issue:
  If frontend sends hierarchy.subtopic.id to tracking APIs,
  it will query with INTERNAL ID where EXTERNAL ID is expected.
  This causes 401/404 errors.

Solution:
  Frontend must send hierarchy.subtopic.externalId to tracking APIs.
  `);

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
