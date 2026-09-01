import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const SUBTOPIC_ID = '7a7a0647-2207-485d-8e93-fed68c3155bd';
const NAVIGATION_NODE_ID = 'what-is-java';
const REQUEST_BRAND = 'skillup';

console.log('Checking brand visibility...\n');
console.log('Query conditions:');
console.log(`  subtopic_id: ${SUBTOPIC_ID}`);
console.log(`  navigation_node_id: ${NAVIGATION_NODE_ID}`);
console.log(`  requested brand: ${REQUEST_BRAND}`);
console.log('');

// Exact query from delivery service
const result = await tutorialDb.query(`
  SELECT 
    id,
    brand_id,
    brand_visibility,
    status,
    deleted_at
  FROM tutorial_sections
  WHERE subtopic_id = $1
    AND navigation_node_id = $2
    AND deleted_at IS NULL
    AND status IN ('approved', 'deployed')
    AND (
      brand_id = 'shared'
      OR brand_id = $3
      OR brand_visibility = 'shared_visible'
    )
  LIMIT 1
`, [SUBTOPIC_ID, NAVIGATION_NODE_ID, REQUEST_BRAND]);

console.log(`Found ${result.rows.length} records\n`);

if (result.rows.length > 0) {
  const row = result.rows[0];
  console.log('✅ Record FOUND with brand filter:');
  console.log(`   ID: ${row.id}`);
  console.log(`   brand_id: ${row.brand_id}`);
  console.log(`   brand_visibility: ${row.brand_visibility}`);
  console.log(`   status: ${row.status}`);
  console.log('');
  console.log('The delivery service SHOULD find this record!');
} else {
  console.log('❌ NO RECORD FOUND');
  console.log('This explains the 404.');
}

await tutorialDb.end();
