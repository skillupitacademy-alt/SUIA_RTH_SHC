#!/usr/bin/env node
/**
 * Find a valid synced subtopic for UUID regression tests
 * Queries the tutorial database to find subtopics with external_id
 * that can be used as UUID_TEST_SUBTOPIC_ID
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from workspace root
config({ path: join(__dirname, '..', '.env.local') });

const sql = neon(process.env.DATABASE_URL_TUTORIAL);

async function findValidSubtopics() {
  console.log('Searching for valid synced subtopics in tutorial database...\n');
  
  try {
    const result = await sql`
      SELECT id, external_id, name, slug
      FROM tutorial_subtopics
      WHERE external_id IS NOT NULL
        AND deleted_at IS NULL
      ORDER BY name
      LIMIT 20
    `;
    
    if (result.length === 0) {
      console.log('❌ No synced subtopics found in tutorial database.');
      console.log('   Run hierarchy sync first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${result.length} synced subtopic(s):\n`);
    
    result.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
      console.log(`   external_id: ${row.external_id}`);
      console.log(`   slug: ${row.slug}`);
      console.log(`   internal_id: ${row.id}\n`);
    });
    
    // Recommend the second one (first is likely used by main tests)
    if (result.length >= 2) {
      console.log('\n════════════════════════════════════════════════════════════');
      console.log('RECOMMENDED FOR UUID_TEST_SUBTOPIC_ID:');
      console.log('════════════════════════════════════════════════════════════\n');
      console.log(`$env:UUID_TEST_SUBTOPIC_ID="${result[1].external_id}"`);
      console.log(`\nSubtopic: ${result[1].name} (${result[1].slug})\n`);
    }
    
  } catch (error) {
    console.error('❌ Error querying tutorial database:', error.message);
    process.exit(1);
  }
}

findValidSubtopics();
