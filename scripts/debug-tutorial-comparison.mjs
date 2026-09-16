/**
 * Tutorial Runtime Comparison Script
 * 
 * Compare whatisjava (working) vs whatispython (failing)
 * through the complete ILS + LSNB + RSSB pipeline
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
const PYTHON_SLUG = 'complete-python-5b1cfc3d';
const JAVA_NAV_NODE = 'whatisjava';
const PYTHON_NAV_NODE = 'whatispython';

async function compareSubtopic(slug, label) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${label.toUpperCase()}: ${slug}`);
  console.log('='.repeat(80));

  // 1. Subtopic record
  const [subtopic] = await db
    .select()
    .from(tutorialSubtopics)
    .where(and(
      eq(tutorialSubtopics.slug, slug),
      isNull(tutorialSubtopics.deletedAt)
    ))
    .limit(1);

  if (!subtopic) {
    console.log('❌ SUBTOPIC NOT FOUND');
    return null;
  }

  console.log('\n📋 SUBTOPIC RECORD:');
  console.log({
    id: subtopic.id,
    externalId: subtopic.externalId,
    name: subtopic.name,
    slug: subtopic.slug,
    topicId: subtopic.topicId,
  });

  return subtopic;
}

async function compareSections(subtopicId, navigationNodeId, label) {
  console.log(`\n📦 SECTION RECORDS for ${label}:`);
  
  // Query sections for this subtopic + navigation node
  const sections = await db
    .select()
    .from(tutorialSections)
    .where(and(
      eq(tutorialSections.subtopicId, subtopicId),
      eq(tutorialSections.navigationNodeId, navigationNodeId),
      isNull(tutorialSections.deletedAt)
    ));

  if (sections.length === 0) {
    console.log('❌ NO SECTIONS FOUND');
    return null;
  }

  for (const section of sections) {
    console.log({
      sectionId: section.id,
      subtopicId: section.subtopicId,
      navigationNodeId: section.navigationNodeId,
      brandId: section.brandId,
      status: section.status,
      hasContent: !!section.content,
      blockCount: section.content?.blocks?.length || 0,
    });
  }

  return sections[0];
}

async function compareProgressRecords(externalId, userId, label) {
  console.log(`\n📊 PROGRESS RECORDS for ${label}:`);
  
  // Query tutorial_progress (legacy)
  const [progressRecord] = await db
    .select()
    .from(tutorialProgress)
    .where(and(
      eq(tutorialProgress.userId, userId),
      eq(tutorialProgress.subtopicId, externalId),
      isNull(tutorialProgress.deletedAt)
    ))
    .limit(1);

  console.log('Legacy tutorial_progress:');
  if (progressRecord) {
    console.log({
      id: progressRecord.id,
      userId: progressRecord.userId,
      subtopicId: progressRecord.subtopicId,
      status: progressRecord.status,
      blocksCompleted: progressRecord.blocksCompleted,
    });
  } else {
    console.log('  (none)');
  }

  // Query tutorial_navigation_progress (ILS)
  const navProgress = await db
    .select()
    .from(tutorialNavigationProgress)
    .where(and(
      eq(tutorialNavigationProgress.userId, userId),
      eq(tutorialNavigationProgress.subtopicId, externalId),
      isNull(tutorialNavigationProgress.deletedAt)
    ));

  console.log('\nILS tutorial_navigation_progress:');
  if (navProgress.length > 0) {
    for (const record of navProgress) {
      console.log({
        id: record.id,
        userId: record.userId,
        navigationNodeId: record.navigationNodeId,
        subtopicId: record.subtopicId,
        sectionId: record.sectionId,
        status: record.status,
        visitCount: record.visitCount,
        completedBlocks: record.completedBlocks?.length || 0,
      });
    }
  } else {
    console.log('  (none)');
  }
}

async function compareIdentifiers(javaSubtopic, pythonSubtopic) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('IDENTIFIER COMPARISON');
  console.log('='.repeat(80));

  console.log('\n| Field              | Java                                   | Python                                 |');
  console.log('|--------------------|----------------------------------------|----------------------------------------|');
  console.log(`| Internal ID        | ${javaSubtopic.id} | ${pythonSubtopic.id} |`);
  console.log(`| External ID        | ${javaSubtopic.externalId} | ${pythonSubtopic.externalId} |`);
  console.log(`| Slug               | ${javaSubtopic.slug.padEnd(38)} | ${pythonSubtopic.slug.padEnd(38)} |`);
  console.log(`| IDs Match?         | ${javaSubtopic.id === javaSubtopic.externalId ? 'YES ✓' : 'NO ✗'.padEnd(38)} | ${pythonSubtopic.id === pythonSubtopic.externalId ? 'YES ✓' : 'NO ✗'.padEnd(38)} |`);
}

async function main() {
  console.log('TUTORIAL RUNTIME COMPARISON: Java (working) vs Python (failing)');
  console.log('Purpose: Identify RSSB-stage differences\n');

  // Compare Java
  const javaSubtopic = await compareSubtopic(JAVA_SLUG, 'Java');
  if (javaSubtopic) {
    await compareSections(javaSubtopic.id, JAVA_NAV_NODE, 'Java');
    // Use a test user ID - adjust based on your test data
    const testUserId = '00000000-0000-0000-0000-000000000001';
    await compareProgressRecords(javaSubtopic.externalId, testUserId, 'Java');
  }

  // Compare Python
  const pythonSubtopic = await compareSubtopic(PYTHON_SLUG, 'Python');
  if (pythonSubtopic) {
    await compareSections(pythonSubtopic.id, PYTHON_NAV_NODE, 'Python');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    await compareProgressRecords(pythonSubtopic.externalId, testUserId, 'Python');
  }

  // Final comparison
  if (javaSubtopic && pythonSubtopic) {
    await compareIdentifiers(javaSubtopic, pythonSubtopic);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(80));
  console.log('\nNext steps:');
  console.log('1. Compare section records (missing Python section?)');
  console.log('2. Compare ID relationships (internal vs external)');
  console.log('3. Check which ID the ILS/RSSB contract expects');
  console.log('4. Trace actual HTTP requests for both tutorials');
  
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
