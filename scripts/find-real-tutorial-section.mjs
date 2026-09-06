#!/usr/bin/env node
import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  
  try {
    await client.connect();
    console.log('Connected to tutorial database\n');
    
    // Find ANY published tutorial section with navigation_node_id for RTH brand
    const result = await client.query(`
      SELECT 
        ts.id as section_id,
        ts.navigation_node_id,
        ts.subtopic_id,
        ts.brand_id,
        ts.status,
        sub.name as subtopic_name,
        sub.slug as subtopic_slug
      FROM tutorial_sections ts
      JOIN tutorial_subtopics sub ON sub.id = ts.subtopic_id
      WHERE ts.navigation_node_id IS NOT NULL
        AND ts.deleted_at IS NULL
        AND ts.brand_id = 'skillup'
        AND ts.status IN ('deployed', 'approved')
      ORDER BY ts.published_at DESC NULLS LAST
      LIMIT 5
    `);
    
    console.log('Published tutorial sections found:', result.rows.length, '\n');
    
    if (result.rows.length > 0) {
      console.log('Available sections for testing:\n');
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.subtopic_name}`);
        console.log(`   navigation_node_id: ${row.navigation_node_id}`);
        console.log(`   subtopic_id: ${row.subtopic_id}`);
        console.log(`   brand: ${row.brand_id}`);
        console.log(`   status: ${row.status}`);
        console.log();
      });
      
      console.log('USE THIS DATA FOR GATE 4K:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ No published sections with navigation_node_id found for realtutorialhub brand');
    }
    
  } finally {
    await client.end();
  }
}

main();
