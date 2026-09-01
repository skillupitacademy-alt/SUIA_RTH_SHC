#!/usr/bin/env node
/**
 * READ-ONLY AUDIT: Check production database for Java sidebar
 */
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
  
  console.log('=== DATABASE AUDIT ===');
  console.log('Database:', connString.match(/neon\.tech\/([^?]+)/)?.[1] || 'unknown');
  console.log();
  
  // The exact query used by the code
  const javaTopicId = 'fb47747d-ac1c-4091-bd8e-a8a7d7378e07';
  
  console.log('Query 1: Shared sidebars for Java topic');
  const shared = await client.query(`
    SELECT id, brand_id, topic_id, status, created_at
    FROM tutorial_sidebar_trees_v2
    WHERE brand_id = 'shared'
    AND topic_id = $1
    AND status = 'published'
    LIMIT 1
  `, [javaTopicId]);
  
  console.log(`  Result: ${shared.rows.length} rows`);
  if (shared.rows.length > 0) {
    console.log('  ✓ FOUND shared sidebar');
    console.log(`    ID: ${shared.rows[0].id}`);
    console.log(`    Created: ${shared.rows[0].created_at}`);
  } else {
    console.log('  ✗ No shared sidebar');
  }
  console.log();
  
  console.log('Query 2: SkillUp brand sidebars for Java topic');
  const skillup = await client.query(`
    SELECT id, brand_id, topic_id, status, created_at
    FROM tutorial_sidebar_trees_v2
    WHERE brand_id = 'skillup'
    AND topic_id = $1
    AND status = 'published'
    LIMIT 1
  `, [javaTopicId]);
  
  console.log(`  Result: ${skillup.rows.length} rows`);
  if (skillup.rows.length > 0) {
    console.log('  ✓ FOUND skillup sidebar');
    console.log(`    ID: ${skillup.rows[0].id}`);
    console.log(`    Created: ${skillup.rows[0].created_at}`);
  } else {
    console.log('  ✗ No skillup sidebar');
  }
  console.log();
  
  // Check ALL sidebars to understand the data
  console.log('Query 3: ALL published sidebars in database');
  const all = await client.query(`
    SELECT s.brand_id, s.status, t.name as topic_name, t.id as topic_id
    FROM tutorial_sidebar_trees_v2 s
    JOIN tutorial_topics t ON t.id = s.topic_id
    WHERE s.status = 'published'
  `);
  
  console.log(`  Result: ${all.rows.length} published sidebars`);
  all.rows.forEach(row => {
    console.log(`    - ${row.topic_name} (${row.brand_id})`);
    if (row.topic_id === javaTopicId) {
      console.log('      ⚠️  THIS IS THE JAVA TOPIC!');
    }
  });
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await client.end();
}
