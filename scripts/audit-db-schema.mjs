#!/usr/bin/env node
/**
 * READ-ONLY Database Schema Audit
 * 
 * Purpose: Query actual database to see what columns exist in:
 * - tutorial_sections
 * - block_learning_state
 * - tutorial_navigation_progress
 * 
 * This ensures our audit scripts match the real schema.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const tutorialDb = process.env.DATABASE_URL_TUTORIAL;

if (!tutorialDb) {
  console.error('ERROR: DATABASE_URL_TUTORIAL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: tutorialDb });

async function auditSchema() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DATABASE SCHEMA AUDIT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const tables = [
    'tutorial_sections',
    'block_learning_state',
    'tutorial_navigation_progress'
  ];

  for (const tableName of tables) {
    console.log(`📋 TABLE: ${tableName}`);
    console.log('-'.repeat(80));
    
    try {
      // Check if table exists
      const tableExists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [tableName]);
      
      if (!tableExists.rows[0].exists) {
        console.log(`❌ Table does NOT exist\n`);
        continue;
      }
      
      console.log(`✅ Table exists`);
      
      // Get column information
      const columns = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      console.log(`   Columns (${columns.rows.length}):\n`);
      columns.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`   - ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${nullable}${def}`);
      });
      
      // Get row count
      const count = await pool.query(`SELECT COUNT(*) as total FROM ${tableName}`);
      console.log(`\n   Row count: ${count.rows[0].total}`);
      
      // Sample one row if exists
      if (parseInt(count.rows[0].total) > 0) {
        const sample = await pool.query(`SELECT * FROM ${tableName} LIMIT 1`);
        console.log(`\n   Sample row columns:`);
        Object.keys(sample.rows[0]).forEach(key => {
          const value = sample.rows[0][key];
          const preview = typeof value === 'object' ? JSON.stringify(value).substring(0, 50) : String(value).substring(0, 50);
          console.log(`   - ${key.padEnd(30)} ${preview}`);
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('\n');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ Schema audit complete');
  console.log('═══════════════════════════════════════════════════════════════');
}

auditSchema()
  .then(() => {
    pool.end();
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error);
    pool.end();
    process.exit(1);
  });
