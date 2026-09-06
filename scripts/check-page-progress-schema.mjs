#!/usr/bin/env node
/**
 * Check actual schema of tutorial_navigation_progress table
 * READ-ONLY
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    // Get column information
    const schemaResult = await tutorialPool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tutorial_navigation_progress'
      ORDER BY ordinal_position
    `);

    console.log('Schema: tutorial_navigation_progress');
    console.log('─────────────────────────────────────────────────────────────');
    for (const col of schemaResult.rows) {
      console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    }

    // Get all records with available columns
    const dataResult = await tutorialPool.query(`
      SELECT *
      FROM tutorial_navigation_progress
      WHERE deleted_at IS NULL
      ORDER BY updated_at DESC NULLS LAST
    `);

    console.log(`\nRecords: ${dataResult.rows.length}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    const now = new Date();
    for (const row of dataResult.rows) {
      const updatedAt = new Date(row.updated_at);
      const minutesAgo = Math.floor((now - updatedAt) / 1000 / 60);
      const isRecent = minutesAgo < 10;
      
      console.log(`${isRecent ? '🆕 ' : ''}User: ${row.user_id}`);
      console.log(`  Navigation Node: ${row.navigation_node_id}`);
      console.log(`  Subtopic: ${row.subtopic_id || 'NULL'}`);
      console.log(`  Visits: ${row.visit_count}`);
      console.log(`  Created: ${row.created_at}`);
      console.log(`  Updated: ${row.updated_at} (${minutesAgo} min ago) ${isRecent ? '🔥' : ''}`);
      console.log('');
    }

    // Show all column values for most recent record
    if (dataResult.rows.length > 0) {
      console.log('Most Recent Record (all fields):');
      console.log('─────────────────────────────────────────────────────────────');
      const recent = dataResult.rows[0];
      for (const [key, value] of Object.entries(recent)) {
        console.log(`  ${key}: ${value}`);
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    process.exit(1);
  } finally {
    await tutorialPool.end();
  }
}

main();
