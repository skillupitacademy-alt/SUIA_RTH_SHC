import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('═══════════════════════════════════════════════════════════');
console.log('EXISTING tutorial_sections RECORDS FOR what-is-java');
console.log('═══════════════════════════════════════════════════════════\n');

const result = await tutorialDb.query(`
  SELECT 
    id,
    subtopic_id,
    navigation_node_id,
    brand_id,
    status,
    order_index,
    created_at,
    deleted_at
  FROM tutorial_sections
  WHERE navigation_node_id = 'what-is-java'
  ORDER BY order_index
`);

console.log(`Found ${result.rows.length} records:\n`);

result.rows.forEach((row, idx) => {
  console.log(`Record ${idx + 1}:`);
  console.log(`  subtopic_id:        ${row.subtopic_id}`);
  console.log(`  navigation_node_id: ${row.navigation_node_id}`);
  console.log(`  brand_id:           ${row.brand_id}`);
  console.log(`  status:             ${row.status}`);
  console.log(`  order_index:        ${row.order_index}`);
  console.log(`  deleted_at:         ${row.deleted_at}`);
  console.log('');
});

// Now check what subtopic_id the MainDB hierarchy actually has
const mainDb = new Pool({ connectionString: process.env.DATABASE_URL });

const subtopic = await mainDb.query(`
  SELECT id, name, slug
  FROM subtopics
  WHERE name = 'What is Java?'
    AND deleted_at IS NULL
`);

console.log('═══════════════════════════════════════════════════════════');
console.log('MAINDB SUBTOPIC');
console.log('═══════════════════════════════════════════════════════════\n');

if (subtopic.rows.length > 0) {
  console.log(`Subtopic ID: ${subtopic.rows[0].id}`);
  console.log(`Name:        ${subtopic.rows[0].name}`);
  console.log(`Slug:        ${subtopic.rows[0].slug}`);
} else {
  console.log('❌ Subtopic not found in MainDB');
}

await tutorialDb.end();
await mainDb.end();
