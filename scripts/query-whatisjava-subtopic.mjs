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
      SELECT id, slug, name, topic_id
      FROM tutorial_subtopics 
      WHERE slug LIKE '%what-is-java%' 
         OR slug = 'whatisjava'
      ORDER BY slug
      LIMIT 10
    `);
    
    console.log('Subtopics found:', result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));
    
  } finally {
    await client.end();
  }
}

main();
