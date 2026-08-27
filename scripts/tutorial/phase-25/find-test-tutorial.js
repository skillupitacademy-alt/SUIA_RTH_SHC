'use strict';

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

// Use established pattern from existing scripts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL
});

async function findTestTutorial() {
  try {
    // Find a published tutorial with content
    const result = await pool.query(`
      SELECT 
        ts.id as section_id,
        ts.navigation_node_id,
        ts.subtopic_id,
        jsonb_array_length(ts.content->'blocks') as block_count
      FROM tutorial_sections ts
      WHERE ts.content IS NOT NULL
        AND jsonb_array_length(ts.content->'blocks') > 0
        AND ts.status IN ('approved', 'deployed')
        AND ts.deleted_at IS NULL
      ORDER BY ts.updated_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      const row = result.rows[0];
      console.log('');
      console.log('FOUND TEST TUTORIAL');
      console.log('');
      console.log('Database Details:');
      console.log('  SECTION_ID=' + row.section_id);
      console.log('  NAVIGATION_NODE_ID=' + row.navigation_node_id);
      console.log('  SUBTOPIC_ID=' + row.subtopic_id);
      console.log('  BLOCK_COUNT=' + row.block_count);
      console.log('');
      console.log('PowerShell Environment Variables:');
      console.log('  $env:PHASE25_SUBTOPIC_ID="' + row.subtopic_id + '"');
      console.log('  $env:PHASE25_NAVIGATION_NODE_ID="' + row.navigation_node_id + '"');
      console.log('  $env:PHASE25_SECTION_ID="' + row.section_id + '"');
      console.log('');
      
      // Find a learner with progress
      const learnerResult = await pool.query(`
        SELECT user_id FROM tutorial_progress LIMIT 1
      `);
      
      if (learnerResult.rows.length > 0) {
        console.log('  $env:PHASE25_LEARNER_ID="' + learnerResult.rows[0].user_id + '"');
        console.log('');
      }
      
      console.log('Note: To test actual learner route, you need:');
      console.log('  1. Valid tutorial URL path (get from running application)');
      console.log('  2. Authenticated session cookie');
      console.log('  3. Set PHASE25_TUTORIAL_PATH manually after finding route');
    } else {
      console.log('');
      console.log('NO TUTORIAL FOUND with published content blocks');
      console.log('');
      console.log('Database query returned 0 rows.');
      console.log('Possible causes:');
      console.log('  - No tutorials published yet');
      console.log('  - All tutorials have status other than approved/deployed');
      console.log('  - Content blocks array is empty');
      console.log('');
    }
    
    await pool.end();
  } catch (error) {
    console.error('');
    console.error('ERROR:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    console.error('');
    console.error('Check:');
    console.error('  - DATABASE_URL_TUTORIAL is set in .env.local');
    console.error('  - Tutorial database is accessible');
    console.error('  - Database tables exist (tutorial_sections, subtopics, etc.)');
    process.exit(1);
  }
}

findTestTutorial();
