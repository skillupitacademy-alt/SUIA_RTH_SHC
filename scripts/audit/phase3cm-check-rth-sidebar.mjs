#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local') });

const { Client } = pg;

const mainDbUrl = process.env.DATABASE_URL;
const mainDb = new Client({ connectionString: mainDbUrl });
await mainDb.connect();

console.log('Checking if Java tutorial sidebar exists for RealTutorialHub...\n');

const javaTopicId = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

const result = await mainDb.query(
  `SELECT brand_id, topic_id, status
   FROM tutorial_sidebar_trees_v2
   WHERE topic_id = $1`,
  [javaTopicId]
);

console.log('Found', result.rows.length, 'sidebar(s) for Java topic:\n');

result.rows.forEach(row => {
  console.log(`  Brand: ${row.brand_id}`);
  console.log(`  Topic ID: ${row.topic_id}`);
  console.log(`  Status: ${row.status}`);
  console.log('');
});

if (result.rows.some(r => r.brand_id === 'realtutorialhub' && r.status === 'published')) {
  console.log('✅ RTH has published Java sidebar - can test RTH');
} else if (result.rows.some(r => r.brand_id === 'shared' && r.status === 'published')) {
  console.log('✅ Shared sidebar exists - RTH will use shared sidebar');
} else {
  console.log('⚠️  No published sidebar for RTH - test may not be applicable');
}

await mainDb.end();
