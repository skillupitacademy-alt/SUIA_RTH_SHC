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
  
  const topicId = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07'; // Java
  
  console.log('Checking for published sidebars for Java topic...\n');
  
  const result = await client.query(`
    SELECT id, brand_id, topic_id, status, created_at
    FROM tutorial_sidebar_trees_v2
    WHERE topic_id = $1
    ORDER BY brand_id, status
  `, [topicId]);
  
  console.log(`Found ${result.rows.length} sidebar(s):\n`);
  result.rows.forEach(row => {
    console.log(`  Brand: ${row.brand_id}, Status: ${row.status}`);
  });
  
  if (result.rows.length === 0) {
    console.log('\n❌ NO SIDEBARS FOUND for Java topic!');
    console.log('This is why Tutorial V2 returns 404.');
    console.log('\nThe tutorial content exists, but no sidebar is published.');
  }
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
