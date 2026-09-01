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
  
  console.log('Checking for Java subtopics and sidebars...\n');
  
  const topicId = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07';
  
  // Check tutorial_subtopics
  const subtopics = await client.query(`
    SELECT id, name, slug, external_id
    FROM tutorial_subtopics
    WHERE topic_id = $1
    AND deleted_at IS NULL
    ORDER BY name
  `, [topicId]);
  
  console.log(`Found ${subtopics.rows.length} tutorial subtopics:\n`);
  subtopics.rows.forEach(row => {
    console.log(`  Name: ${row.name}`);
    console.log(`  Slug: ${row.slug}`);
    console.log(`  ID: ${row.id}`);
    console.log();
  });
  
  // Check sidebars - try different table name patterns
  console.log('Checking sidebar tables...\n');
  
  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%sidebar%'
  `);
  
  console.log('Sidebar tables found:');
  tables.rows.forEach(row => {
    console.log(`  - ${row.table_name}`);
  });
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
