import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

console.log('Checking sidebar status for Java topic...\n');

const result = await tutorialDb.query(`
  SELECT brand_id, topic_id, status, created_at, updated_at
  FROM tutorial_sidebar_trees_v2
  WHERE topic_id = $1
`, [TOPIC_ID]);

console.log(`Found ${result.rows.length} sidebar tree(s):\n`);

result.rows.forEach((row, idx) => {
  console.log(`${idx + 1}. brand_id: ${row.brand_id}`);
  console.log(`   topic_id: ${row.topic_id}`);
  console.log(`   status: ${row.status}`);
  console.log(`   created: ${row.created_at}`);
  console.log(`   updated: ${row.updated_at}`);
  console.log('');
});

// Check what status the delivery expects
console.log('Delivery service queries:');
console.log('  WHERE status = \'published\'');
console.log('');

const published = result.rows.filter(r => r.status === 'published');
console.log(`Sidebars with status='published': ${published.length}`);

if (published.length === 0) {
  console.log('');
  console.log('❌ NO PUBLISHED SIDEBARS!');
  console.log('This explains the 404.');
  console.log('');
  console.log('The sidebar exists but has the wrong status.');
}

await tutorialDb.end();
