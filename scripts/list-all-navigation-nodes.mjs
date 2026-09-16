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
    
    // Get ALL navigation nodes
    const result = await client.query(`
      SELECT 
        navigation_node_id,
        COUNT(*) as section_count,
        STRING_AGG(DISTINCT brand_id::text, ', ') as brands,
        STRING_AGG(DISTINCT status::text, ', ') as statuses
      FROM tutorial_sections
      WHERE deleted_at IS NULL
      GROUP BY navigation_node_id
      ORDER BY navigation_node_id
    `);
    
    console.log(`Total distinct navigation nodes: ${result.rows.length}\n`);
    console.log('Navigation Nodes:\n');
    result.rows.forEach(row => {
      console.log(`  "${row.navigation_node_id}"`);
      console.log(`    Sections: ${row.section_count}`);
      console.log(`    Brands: ${row.brands}`);
      console.log(`    Status: ${row.statuses}`);
      console.log('');
    });
    
  } finally {
    await client.end();
  }
}

main();
