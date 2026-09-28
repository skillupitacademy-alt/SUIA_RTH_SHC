#!/usr/bin/env node

/**
 * Find Completion-Related Tables
 * 
 * Purpose: Discover what tables track block completion state
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    console.log('\n=== Finding Completion-Related Tables ===\n');

    // List all tables in the database
    console.log('1. Querying all tables in tutorial_prod database...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log(`   Found ${tablesResult.rows.length} tables:\n`);
    
    const completionTables = [];
    tablesResult.rows.forEach((row) => {
      console.log(`   - ${row.table_name}`);
      if (row.table_name.includes('completion') || row.table_name.includes('complete')) {
        completionTables.push(row.table_name);
      }
    });

    if (completionTables.length > 0) {
      console.log(`\n2. Found ${completionTables.length} completion-related table(s):`);
      
      for (const tableName of completionTables) {
        console.log(`\n   Table: ${tableName}`);
        console.log(`   Columns:`);
        
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        columnsResult.rows.forEach((col) => {
          console.log(`     - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });

        // Query for D1 block
        console.log(`\n   Querying for D1 block in ${tableName}...`);
        try {
          const dataResult = await pool.query(`
            SELECT * FROM ${tableName}
            WHERE block_id = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749'
            LIMIT 5
          `);

          if (dataResult.rows.length === 0) {
            console.log(`     No D1 records found`);
          } else {
            console.log(`     Found ${dataResult.rows.length} record(s):`);
            dataResult.rows.forEach((row, idx) => {
              console.log(`\n     [${idx}]:`, JSON.stringify(row, null, 2));
            });
          }
        } catch (error) {
          console.log(`     ⚠️  Error querying: ${error.message}`);
        }
      }
    } else {
      console.log('\n2. No tables with "completion" or "complete" in name found');
    }

    // Also check if block_learning_state has any D1 records with completed_at set
    console.log('\n3. Checking block_learning_state for completed D1 records...');
    const completedResult = await pool.query(`
      SELECT 
        user_id,
        navigation_node_id,
        block_id,
        block_version,
        active_time_sec,
        completed_at,
        visit_count
      FROM block_learning_state
      WHERE block_id = '8680bd00-ecfe-4da7-a78f-9b6a0b6a1749'
        AND completed_at IS NOT NULL
    `);

    if (completedResult.rows.length === 0) {
      console.log('   No completed D1 records in block_learning_state');
    } else {
      console.log(`   Found ${completedResult.rows.length} completed record(s):`);
      completedResult.rows.forEach((row, idx) => {
        console.log(`\n   [${idx}]:`, row);
      });
    }

    console.log('\n=== Search Complete ===\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
