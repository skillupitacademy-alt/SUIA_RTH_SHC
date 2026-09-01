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

console.log('PHASE 3C-M: List ALL Tutorial Subtopics for Java Topic');
console.log('═'.repeat(70));

// Java topic ID from TutorialDB (from earlier logs)
const javaTopicId = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07';

console.log('\nQuerying tutorial_subtopics WHERE topic_id =', javaTopicId);

const result = await tutorialDb.query(
  'SELECT id, external_id, topic_id, name, slug, deleted_at FROM tutorial_subtopics WHERE topic_id = $1 ORDER BY name',
  [javaTopicId]
);

console.log('\nFound:', result.rows.length, 'tutorial subtopics');

if (result.rows.length === 0) {
  console.log('\n❌ NO TUTORIAL SUBTOPICS EXIST FOR JAVA');
  console.log('Java topic exists in TutorialDB but has no subtopics');
  console.log('This explains why Phase 3C-J cannot work');
} else {
  console.log('\n✅ Tutorial subtopics:');
  result.rows.forEach((row, i) => {
    console.log(`\n${i + 1}. ${row.name}`);
    console.log(`   id: ${row.id}`);
    console.log(`   external_id: ${row.external_id}`);
    console.log(`   slug: ${row.slug}`);
    console.log(`   deleted_at: ${row.deleted_at}`);
  });
}

await tutorialDb.end();
