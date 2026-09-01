#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local') });

const { Client } = pg;

const mainDbUrl = process.env.DATABASE_URL;
if (!mainDbUrl) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const mainDb = new Client({ connectionString: mainDbUrl });
await mainDb.connect();

console.log('PHASE 3C-M: Curriculum Java Subtopics');
console.log('═'.repeat(70));

// Java topic external ID from MainDB
const javaTopicMainId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

console.log('\nQuerying subtopics WHERE topic_id =', javaTopicMainId);

const result = await mainDb.query(
  `SELECT id, topic_id, name, deleted_at 
   FROM subtopics 
   WHERE topic_id = $1 
   AND deleted_at IS NULL
   ORDER BY name`,
  [javaTopicMainId]
);

console.log('\nFound:', result.rows.length, 'curriculum subtopics');

if (result.rows.length === 0) {
  console.log('\n❌ NO CURRICULUM SUBTOPICS FOR JAVA');
} else {
  console.log('\n✅ Curriculum subtopics:');
  result.rows.forEach((row, i) => {
    console.log(`\n${i + 1}. ${row.name}`);
    console.log(`   id: ${row.id}`);
    console.log(`   topic_id: ${row.topic_id}`);
  });
}

await mainDb.end();
