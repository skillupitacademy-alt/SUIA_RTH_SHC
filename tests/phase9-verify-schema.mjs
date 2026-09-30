/**
 * PHASE 9: VERIFY SCHEMA COMPLIANCE
 * Verify the new tutorial_sections record has valid schemaVersion
 */

import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const SUBTOPIC_ID = '7a7a0647-2207-485d-8e93-fed68c3155bd';
const NAVIGATION_NODE_ID = 'what-is-java';
const BRAND_ID = 'shared';

console.log('═══════════════════════════════════════════════════════════');
console.log('PHASE 9: VERIFY SCHEMA COMPLIANCE');
console.log('═══════════════════════════════════════════════════════════\n');

try {
  const result = await tutorialDb.query(`
    SELECT 
      id,
      content->'schemaVersion' as schema_version,
      jsonb_array_length(content->'blocks') as blocks_count,
      content->'metadata'->>'title' as title,
      status,
      created_at
    FROM tutorial_sections
    WHERE subtopic_id = $1
      AND navigation_node_id = $2
      AND brand_id = $3
      AND deleted_at IS NULL
  `, [SUBTOPIC_ID, NAVIGATION_NODE_ID, BRAND_ID]);

  if (result.rows.length === 0) {
    console.log('❌ No record found!');
    process.exit(1);
  }

  const record = result.rows[0];
  
  console.log('Record found:');
  console.log(`  ID:              ${record.id}`);
  console.log(`  schemaVersion:   ${record.schema_version} (type: ${typeof record.schema_version})`);
  console.log(`  blocks count:    ${record.blocks_count}`);
  console.log(`  title:           ${record.title}`);
  console.log(`  status:          ${record.status}`);
  console.log(`  created_at:      ${record.created_at}`);
  console.log('');

  // Validation
  if (record.schema_version === 1) {
    console.log('✅ schemaVersion is correct: 1 (number)');
  } else if (record.schema_version === '1') {
    console.log('⚠️  schemaVersion is string "1", expected number 1');
  } else if (record.schema_version === null || record.schema_version === undefined) {
    console.log('❌ schemaVersion is missing!');
    process.exit(1);
  } else {
    console.log(`❌ schemaVersion is wrong: ${record.schema_version}`);
    process.exit(1);
  }

  if (record.blocks_count === 5) {
    console.log('✅ blocks count is correct: 5');
  } else {
    console.log(`⚠️  blocks count: ${record.blocks_count} (expected 5)`);
  }

  if (record.title === 'What is Java?') {
    console.log('✅ metadata.title is correct');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('PHASE 9: ✅ SCHEMA VALID');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('Next: Restart SkillUp Web and run E2E certification');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  await tutorialDb.end();
}
