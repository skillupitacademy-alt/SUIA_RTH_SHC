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
    
    const result = await client.query(`
      SELECT 
        id as section_id,
        navigation_node_id,
        subtopic_id,
        brand_id,
        status
      FROM tutorial_sections
      WHERE navigation_node_id = 'whatisjava'
        AND deleted_at IS NULL
      ORDER BY brand_id
      LIMIT 20
    `);
    
    console.log('Sections found for navigation_node_id = whatisjava:', result.rows.length, '\n');
    console.log(JSON.stringify(result.rows, null, 2));
    
  } finally {
    await client.end();
  }
}

main();
