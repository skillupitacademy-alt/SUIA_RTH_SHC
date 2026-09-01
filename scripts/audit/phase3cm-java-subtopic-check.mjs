#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local') });

const { Client } = pg;

const tutorialDbUrl = process.env.DATABASE_URL_TUTORIAL;
if (!tutorialDbUrl) {
  console.error('❌ DATABASE_URL_TUTORIAL not set');
  process.exit(1);
}

const tutorialDb = new Client({ connectionString: tutorialDbUrl });
await tutorialDb.connect();

console.log('PHASE 3C-M: Java Subtopic Mapping Check');
console.log('═'.repeat(70));

const targetSubtopicId = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';

console.log('\nQuerying tutorial_subtopics for external_id:', targetSubtopicId);

const result = await tutorialDb.query(
  'SELECT * FROM tutorial_subtopics WHERE external_id = $1',
  [targetSubtopicId]
);

console.log('\nResult:', result.rows.length, 'rows');

if (result.rows.length === 0) {
  console.log('\n❌ NO MAPPING FOUND');
  console.log('This explains TUTORIAL_SUBTOPIC_MAPPING_MISSING error');
  
  // Check if there's a tutorial subtopic by slug
  console.log('\nChecking tutorial_subtopics by slug: whatisjava');
  const slugResult = await tutorialDb.query(
    'SELECT * FROM tutorial_subtopics WHERE slug = $1',
    ['whatisjava']
  );
  
  console.log('Found by slug:', slugResult.rows.length, 'rows');
  if (slugResult.rows.length > 0) {
    const row = slugResult.rows[0];
    console.log('\nTutorial subtopic exists:');
    console.log('  id:', row.id);
    console.log('  external_id:', row.external_id);
    console.log('  name:', row.name);
    console.log('  slug:', row.slug);
    console.log('  deleted_at:', row.deleted_at);
  }
} else {
  result.rows.forEach(row => {
    console.log('\n✅ FOUND:');
    console.log('  id:', row.id);
    console.log('  external_id:', row.external_id);
    console.log('  name:', row.name);
    console.log('  slug:', row.slug);
    console.log('  deleted_at:', row.deleted_at);
  });
}

await tutorialDb.end();
