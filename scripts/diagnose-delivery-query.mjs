/**
 * Diagnose what the delivery service would query
 */
import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const SUBTOPIC_SLUG = 'whatisjava';
const NAVIGATION_NODE_ID = 'what-is-java';
const BRAND_ID = 'shared';

console.log('═══════════════════════════════════════════════════════════');
console.log('DELIVERY QUERY DIAGNOSIS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('URL Parameters:');
console.log(`  subtopicSlug:      ${SUBTOPIC_SLUG}`);
console.log(`  navigationNodeId:  ${NAVIGATION_NODE_ID}`);
console.log(`  brandId:           ${BRAND_ID}`);
console.log('');

// Step 1: Resolve subtopic by slug
console.log('Step 1: Resolve tutorial_subtopics by slug...');
const subtopic = await tutorialDb.query(`
  SELECT id, name, external_id, slug
  FROM tutorial_subtopics
  WHERE slug = $1
`, [SUBTOPIC_SLUG]);

if (subtopic.rows.length === 0) {
  console.log('❌ Subtopic not found!');
  await tutorialDb.end();
  process.exit(1);
}

console.log('✅ Subtopic found:');
console.log(`   ID: ${subtopic.rows[0].id}`);
console.log(`   Name: ${subtopic.rows[0].name}`);
console.log(`   Slug: ${subtopic.rows[0].slug}`);
console.log('');

const subtopicId = subtopic.rows[0].id;

// Step 2: Query tutorial_sections
console.log('Step 2: Query tutorial_sections...');
const sections = await tutorialDb.query(`
  SELECT 
    id,
    subtopic_id,
    navigation_node_id,
    brand_id,
    status,
    deleted_at
  FROM tutorial_sections
  WHERE subtopic_id = $1
    AND navigation_node_id = $2
    AND brand_id = $3
    AND deleted_at IS NULL
`, [subtopicId, NAVIGATION_NODE_ID, BRAND_ID]);

console.log(`Found ${sections.rows.length} records`);
console.log('');

if (sections.rows.length > 0) {
  sections.rows.forEach((row, idx) => {
    console.log(`Record ${idx + 1}:`);
    console.log(`  ID: ${row.id}`);
    console.log(`  subtopic_id: ${row.subtopic_id}`);
    console.log(`  navigation_node_id: ${row.navigation_node_id}`);
    console.log(`  brand_id: ${row.brand_id}`);
    console.log(`  status: ${row.status}`);
    console.log(`  deleted_at: ${row.deleted_at}`);
    console.log('');
  });
  
  console.log('✅ DELIVERY SHOULD WORK!');
} else {
  console.log('❌ NO ACTIVE RECORDS FOUND');
  console.log('');
  console.log('This explains the 404.');
}

await tutorialDb.end();
