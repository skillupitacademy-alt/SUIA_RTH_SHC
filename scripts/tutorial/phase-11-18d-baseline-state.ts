#!/usr/bin/env tsx
/**
 * PHASE 11.18D: Baseline TutorialDB State Capture
 * READ ONLY - Capture state before Publish retry
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
config({ path: resolve(process.cwd(), '.env.local') });

import { sql } from 'drizzle-orm';
import { db as tutorialDb } from '@quiz/db-tutorial';

async function main() {
  console.log('PHASE 11.18D — BASELINE TUTORIALDB STATE');
  console.log('READ ONLY - NO DATABASE MODIFICATIONS');
  console.log('='.repeat(70));
  console.log('');

  const counts = await Promise.all([
    tutorialDb.execute(sql`SELECT COUNT(*) as count FROM tutorial_domains`),
    tutorialDb.execute(sql`SELECT COUNT(*) as count FROM tutorial_subjects`),
    tutorialDb.execute(sql`SELECT COUNT(*) as count FROM tutorial_topics`),
    tutorialDb.execute(sql`SELECT COUNT(*) as count FROM tutorial_subtopics`),
    tutorialDb.execute(sql`SELECT COUNT(*) as count FROM tutorial_sidebar_trees_v2`),
    tutorialDb.execute(sql`SELECT COUNT(*) as count FROM tutorial_sections`),
  ]);

  const tables = [
    'tutorial_domains',
    'tutorial_subjects',
    'tutorial_topics',
    'tutorial_subtopics',
    'tutorial_sidebar_trees_v2',
    'tutorial_sections',
  ];

  console.log('BASELINE ROW COUNTS:');
  console.log('');
  tables.forEach((table, index) => {
    const count = (counts[index].rows[0] as any).count;
    console.log(`  ${table.padEnd(35)} ${count}`);
  });

  console.log('');
  console.log('='.repeat(70));
  console.log('SIDEBAR ROW DETAILS:');
  console.log('='.repeat(70));
  console.log('');

  const sidebar = await tutorialDb.execute(sql`
    SELECT 
      id,
      brand_id,
      topic_id,
      status,
      version,
      published_at,
      updated_at,
      created_at
    FROM tutorial_sidebar_trees_v2
    LIMIT 1
  `);

  if (sidebar.rows.length > 0) {
    const row = sidebar.rows[0] as any;
    console.log(`  id:           ${row.id}`);
    console.log(`  brand_id:     ${row.brand_id}`);
    console.log(`  topic_id:     ${row.topic_id}`);
    console.log(`  status:       ${row.status}`);
    console.log(`  version:      ${row.version}`);
    console.log(`  published_at: ${row.published_at || 'NULL'}`);
    console.log(`  updated_at:   ${row.updated_at}`);
    console.log(`  created_at:   ${row.created_at}`);
  } else {
    console.log('  No sidebar rows found');
  }

  console.log('');
  console.log('='.repeat(70));
  console.log('EXPECTED BASELINE (from previous investigation):');
  console.log('='.repeat(70));
  console.log('');
  console.log('  tutorial_domains              0');
  console.log('  tutorial_subjects             0');
  console.log('  tutorial_topics               0');
  console.log('  tutorial_subtopics            0');
  console.log('  tutorial_sidebar_trees_v2     1');
  console.log('  tutorial_sections             0');
  console.log('');
  console.log('  Sidebar status:    draft');
  console.log('  Sidebar version:   1');
  console.log('  Sidebar published: NULL');
  console.log('');
  console.log('='.repeat(70));
  console.log('✅ Baseline captured. Ready for Phase 11.18D enhanced logging.');
  console.log('='.repeat(70));
}

main().catch(error => {
  console.error('');
  console.error('BASELINE CAPTURE FAILED');
  console.error(error);
  process.exit(1);
});
