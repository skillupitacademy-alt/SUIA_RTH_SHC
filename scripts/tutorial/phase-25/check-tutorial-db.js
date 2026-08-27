'use strict';

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL
});

async function checkDatabase() {
  try {
    console.log('');
    console.log('TUTORIAL DATABASE STATUS');
    console.log('');
    
    // Count all sections
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM tutorial_sections WHERE deleted_at IS NULL
    `);
    console.log('Total sections:', totalResult.rows[0].total);
    
    // Check status distribution
    const statusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tutorial_sections
      WHERE deleted_at IS NULL
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('');
    console.log('Status distribution:');
    statusResult.rows.forEach(r => {
      console.log(`  ${r.status}: ${r.count}`);
    });
    
    // Check content availability
    const contentResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE content IS NOT NULL) as with_content,
        COUNT(*) FILTER (WHERE content IS NULL) as without_content
      FROM tutorial_sections
      WHERE deleted_at IS NULL
    `);
    console.log('');
    console.log('Content availability:');
    console.log(`  With content: ${contentResult.rows[0].with_content}`);
    console.log(`  Without content: ${contentResult.rows[0].without_content}`);
    
    // Sample sections
    const sampleResult = await pool.query(`
      SELECT 
        ts.id, 
        ts.navigation_node_id,
        ts.subtopic_id,
        ts.status,
        ts.content IS NOT NULL as has_content,
        CASE 
          WHEN ts.content IS NOT NULL THEN jsonb_array_length(ts.content->'blocks')
          ELSE 0
        END as block_count
      FROM tutorial_sections ts
      WHERE ts.deleted_at IS NULL
      ORDER BY ts.updated_at DESC
      LIMIT 10
    `);
    
    console.log('');
    console.log('Sample sections (most recent):');
    sampleResult.rows.forEach(r => {
      console.log(`  - Node: ${r.navigation_node_id}`);
      console.log(`    Status: ${r.status}, Blocks: ${r.block_count}`);
    });
    
    console.log('');
    
    await pool.end();
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

checkDatabase();
