#!/usr/bin/env node

/**
 * Check Java Sidebar Current Status
 * Shows the current state of the Java tutorial sidebar in production
 */

import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const JAVA_TOPIC_ID = '4b21ddc0-123b-41e3-8ea1-280d37f7f035';

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('JAVA SIDEBAR STATUS CHECK');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });

  try {
    const result = await pool.query(
      `SELECT 
        brand_id, 
        status, 
        version, 
        published_at,
        updated_at,
        tree,
        source_format
      FROM tutorial_sidebar_trees_v2 
      WHERE topic_id = $1`,
      [JAVA_TOPIC_ID]
    );

    if (result.rows.length === 0) {
      console.log('❌ No sidebar found for Java topic');
      return;
    }

    const row = result.rows[0];
    console.log('Current Sidebar:');
    console.log(`  Brand: ${row.brand_id}`);
    console.log(`  Status: ${row.status}`);
    console.log(`  Version: ${row.version}`);
    console.log(`  Published: ${row.published_at ? new Date(row.published_at).toISOString() : 'Not published'}`);
    console.log(`  Updated: ${new Date(row.updated_at).toISOString()}`);
    console.log(`  Source Format: ${row.source_format}`);
    console.log('');
    
    console.log('Tree Structure:');
    console.log(`  Topics: ${row.tree.topics.length}`);
    row.tree.topics.forEach((topic, i) => {
      console.log(`  ${i + 1}. ${topic.name} (${topic.type}) - slug: ${topic.slug}`);
      if (topic.url) console.log(`     URL: ${topic.url}`);
      if (topic.children) {
        topic.children.forEach((child, j) => {
          console.log(`     ${i + 1}.${j + 1}. ${child.name} (${child.type}) - slug: ${child.slug}`);
          if (child.url) console.log(`          URL: ${child.url}`);
        });
      }
    });
    console.log('');

    // Check for presentation data (should not exist)
    console.log('Normalized Storage Check:');
    console.log(`  ✓ tree.brand: ${row.tree.brand ? '❌ EXISTS (should not)' : '✅ Not present'}`);
    console.log(`  ✓ tree.theme: ${row.tree.theme ? '❌ EXISTS (should not)' : '✅ Not present'}`);
    console.log(`  ✓ tree.progress: ${row.tree.progress ? '❌ EXISTS (should not)' : '✅ Not present'}`);
    console.log(`  ✓ tree.subject: ${row.tree.subject ? '❌ EXISTS (should not)' : '✅ Not present'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
