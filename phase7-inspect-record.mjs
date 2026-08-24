import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('PHASE 7 - Inspect tutorial_sections record\n');

const result = await tutorialDb.query(`
  SELECT 
    id,
    subtopic_id,
    navigation_node_id,
    brand_id,
    order_index,
    version,
    language,
    status,
    generated_by_ai,
    regeneration_count,
    brand_visibility,
    created_at,
    updated_at,
    published_at,
    deleted_at,
    content
  FROM tutorial_sections 
  WHERE id = '1d5fde09-e2c0-48f5-844d-c557b91f55ef'
`);

if (result.rows.length === 0) {
  console.log('❌ No record found');
  await tutorialDb.end();
  process.exit(1);
}

const row = result.rows[0];

console.log('Tutorial Section Record:');
console.log('  id:', row.id);
console.log('  subtopic_id:', row.subtopic_id);
console.log('  navigation_node_id:', row.navigation_node_id);
console.log('  brand_id:', row.brand_id);
console.log('  order_index:', row.order_index);
console.log('  version:', row.version);
console.log('  language:', row.language);
console.log('  status:', row.status);
console.log('  generated_by_ai:', row.generated_by_ai);
console.log('  regeneration_count:', row.regeneration_count);
console.log('  brand_visibility:', row.brand_visibility);
console.log('  created_at:', row.created_at);
console.log('  updated_at:', row.updated_at);
console.log('  published_at:', row.published_at);
console.log('  deleted_at:', row.deleted_at);
console.log('');

const content = row.content;
console.log('Content structure:');
console.log('  schemaVersion:', content.schemaVersion);
console.log('  blocks (array):', Array.isArray(content.blocks));
console.log('  blocks length:', content.blocks?.length);
console.log('  metadata:', JSON.stringify(content.metadata || null));
console.log('');

console.log('Schema expectation:');
console.log('  schemaVersion: must be literal 1');
console.log('  blocks: must be array of TutorialBlock');
console.log('  metadata: optional');
console.log('');

if (content.schemaVersion !== 1) {
  console.log('❌ MISMATCH: schemaVersion is', content.schemaVersion, 'but schema expects literal 1');
}

if (content.schemaVersion === undefined) {
  console.log('❌ CRITICAL: schemaVersion is undefined - this explains "expected: 1, received: undefined"');
}

await tutorialDb.end();
