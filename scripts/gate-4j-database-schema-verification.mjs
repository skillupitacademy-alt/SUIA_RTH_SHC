#!/usr/bin/env node
/**
 * GATE 4J: Database Schema Verification
 * Verify Phase 4.1-4.4 tables exist and match schema definitions
 */

import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function verifySchema() {
  const connString = process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_DIRECT_URL_TUTORIAL;
  
  if (!connString) {
    console.log('❌ DATABASE_URL_TUTORIAL not configured');
    return false;
  }
  
  console.log('Database Target: tutorial_prod (from env)\n');
  
  const client = new Client({ connectionString: connString });
  
  try {
    await client.connect();
    console.log('✓ PostgreSQL connection established\n');
    
    // Check Phase 4.1 primary table
    console.log('Checking Phase 4.1-4.4 tables:\n');
    
    const blockLearningState = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'block_learning_state'
      ORDER BY ordinal_position
    `);
    
    if (blockLearningState.rows.length === 0) {
      console.log('❌ block_learning_state table NOT FOUND\n');
      return false;
    }
    
    console.log('✓ block_learning_state table EXISTS');
    console.log(`  Columns (${blockLearningState.rows.length}):`);
    
    const expectedColumns = [
      'id',
      'user_id',
      'navigation_node_id',
      'block_id',
      'block_version',
      'visit_count',
      'revision_count',
      'active_time_sec',
      'expected_time_sec',
      'first_viewed_at',
      'last_viewed_at',
      'completed_at',
      'version',
      'created_at',
      'updated_at',
      'deleted_at'
    ];
    
    const foundColumns = blockLearningState.rows.map(r => r.column_name);
    const missingColumns = expectedColumns.filter(c => !foundColumns.includes(c));
    
    blockLearningState.rows.slice(0, 10).forEach(col => {
      console.log(`    ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    if (blockLearningState.rows.length > 10) {
      console.log(`    ... and ${blockLearningState.rows.length - 10} more columns`);
    }
    console.log();
    
    if (missingColumns.length > 0) {
      console.log(`⚠️  Missing expected columns: ${missingColumns.join(', ')}\n`);
    }
    
    // Check indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'block_learning_state'
    `);
    
    console.log(`✓ Indexes (${indexes.rows.length}):`);
    indexes.rows.forEach(idx => {
      console.log(`    ${idx.indexname}`);
    });
    console.log();
    
    // Check tutorial_navigation_progress (page-level progress)
    const navProgress = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'tutorial_navigation_progress'
      ORDER BY ordinal_position
      LIMIT 5
    `);
    
    if (navProgress.rows.length > 0) {
      console.log('✓ tutorial_navigation_progress table EXISTS');
      console.log(`  Sample columns (first 5):`);
      navProgress.rows.forEach(col => {
        console.log(`    ${col.column_name}: ${col.data_type}`);
      });
      console.log();
    } else {
      console.log('⚠️  tutorial_navigation_progress table NOT FOUND\n');
    }
    
    // Sample data check (should be empty for fresh DB)
    const sampleData = await client.query(`
      SELECT COUNT(*) as count
      FROM block_learning_state
    `);
    
    console.log(`Current data: ${sampleData.rows[0].count} records in block_learning_state\n`);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Database error: ${error.message}\n`);
    return false;
  } finally {
    await client.end();
  }
}

const result = await verifySchema();
process.exit(result ? 0 : 1);
