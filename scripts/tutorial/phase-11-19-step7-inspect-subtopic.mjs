/**
 * PHASE 11.19 STEP 7 — Inspect TutorialDB Subtopic Row
 * Investigation only - no modifications
 */

import { db, tutorialSubtopics } from '@quiz/db-tutorial';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('══════════════════════════════════════════════════════════════════════');
  console.log('PHASE 11.19 STEP 7 — TutorialDB Subtopic Row Inspection');
  console.log('══════════════════════════════════════════════════════════════════════\n');

  const externalId = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
  console.log(`Querying TutorialDB for subtopic with external_id: ${externalId}\n`);

  const rows = await db
    .select()
    .from(tutorialSubtopics)
    .where(eq(tutorialSubtopics.externalId, externalId));

  if (rows.length === 0) {
    console.log('❌ No subtopic found with that external_id');
    return;
  }

  const row = rows[0];
  console.log('✅ Found TutorialDB subtopic:\n');
  console.log('Row data:');
  console.log(`  id:              ${row.id}`);
  console.log(`  external_id:     ${row.externalId}`);
  console.log(`  topic_id:        ${row.topicId}`);
  console.log(`  name:            ${row.name}`);
  console.log(`  slug:            ${row.slug}`);
  console.log(`  difficulty_levels: ${JSON.stringify(row.difficultyLevels)}`);
  console.log(`  deleted_at:      ${row.deletedAt}`);
  console.log(`  created_at:      ${row.createdAt}`);
  console.log(`  updated_at:      ${row.updatedAt}`);

  console.log('\n──────────────────────────────────────────────────────────────────────');
  console.log('KEY OBSERVATION:');
  console.log(`  TutorialDB slug:   "${row.slug}"`);
  console.log(`  Delivery expects:  "whatisjava"`);
  console.log(`  Match:             ${row.slug === 'whatisjava' ? '✅ YES' : '❌ NO'}`);
  console.log('══════════════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
