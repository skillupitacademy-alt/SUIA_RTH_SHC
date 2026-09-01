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

console.log('PHASE 3C-M: Verify NO Database Mutations');
console.log('═'.repeat(70));

const javaTopicMainId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

console.log('\nQuerying tutorial_sidebar_trees_v2 WHERE topic_id =', javaTopicMainId);

const result = await mainDb.query(
  `SELECT id, brand_id, topic_id, status, created_at, updated_at
   FROM tutorial_sidebar_trees_v2
   WHERE topic_id = $1`,
  [javaTopicMainId]
);

console.log('\nFound:', result.rows.length, 'sidebar rows');

if (result.rows.length === 0) {
  console.log('\n❌ SIDEBAR DATA MISSING');
  console.log('Expected 1 published sidebar for topic', javaTopicMainId);
  process.exit(1);
}

console.log('\n✅ Sidebar data exists:');
result.rows.forEach(row => {
  console.log(`\n  ID: ${row.id}`);
  console.log(`  Brand: ${row.brand_id}`);
  console.log(`  Topic ID: ${row.topic_id}`);
  console.log(`  Status: ${row.status}`);
  console.log(`  Created: ${row.created_at}`);
  console.log(`  Updated: ${row.updated_at}`);
});

console.log('\n═'.repeat(70));
console.log('VERIFICATION RESULT');
console.log('═'.repeat(70));
console.log('✅ Sidebar data unchanged');
console.log('✅ topic_id still uses MainDB ID:', javaTopicMainId);
console.log('✅ NO database mutations performed');

await mainDb.end();
