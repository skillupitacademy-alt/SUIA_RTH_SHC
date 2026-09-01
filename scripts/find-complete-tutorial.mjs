#!/usr/bin/env node
import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

const { Client } = pkg;
config({ path: '.env.local', override: true });

let connString = process.env.DATABASE_URL_TUTORIAL;
if (connString && connString.startsWith('"') && connString.endsWith('"')) {
  connString = connString.slice(1, -1);
}

const client = new Client({ connectionString: connString });

try {
  await client.connect();
  
  console.log('Finding tutorials with published sidebars...\n');
  
  // Get all published sidebars
  const sidebars = await client.query(`
    SELECT DISTINCT topic_id, brand_id, status
    FROM tutorial_sidebar_trees_v2
    WHERE status = 'published'
  `);
  
  console.log(`Found ${sidebars.rows.length} published sidebars\n`);
  
  if (sidebars.rows.length === 0) {
    console.log('❌ NO PUBLISHED SIDEBARS IN DATABASE!');
    console.log('\nThis explains why Tutorial V2 cannot deliver ANY content.');
    console.log('\nThe tutorial_sidebar_trees_v2 table is either:');
    console.log('  1. Empty');
    console.log('  2. Contains only draft/unpublished sidebars');
    console.log('  3. Not the correct table for block-based tutorials');
    
    // Check if table exists and has any data
    const count = await client.query(`SELECT COUNT(*) FROM tutorial_sidebar_trees_v2`);
    console.log(`\nTotal rows in tutorial_sidebar_trees_v2: ${count.rows[0].count}`);
    
    if (parseInt(count.rows[0].count) > 0) {
      const sample = await client.query(`
        SELECT brand_id, topic_id, status
        FROM tutorial_sidebar_trees_v2
        LIMIT 5
      `);
      console.log('\nSample rows:');
      sample.rows.forEach(r => {
        console.log(`  Brand: ${r.brand_id}, Status: ${r.status}`);
      });
    }
  } else {
    sidebars.rows.forEach(row => {
      console.log(`  Topic: ${row.topic_id}, Brand: ${row.brand_id}`);
    });
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
