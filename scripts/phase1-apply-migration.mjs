#!/usr/bin/env node
/**
 * Phase 1 - Apply Migration
 * 
 * Applies the navigation_node_id schema changes to the database
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║   PHASE 1 - APPLY DATABASE MIGRATION                            ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

async function applyMigration() {
  try {
    // Verify clean state first
    console.log('[PRE-CHECK] Verify database is clean\n');
    
    const sectionsCount = await pool.query('SELECT COUNT(*) FROM tutorial_sections');
    console.log(`  tutorial_sections: ${sectionsCount.rows[0].count} records`);
    
    if (sectionsCount.rows[0].count !== '0') {
      console.error('\n⚠️  WARNING: tutorial_sections is not empty!');
      console.error(`  Found ${sectionsCount.rows[0].count} records`);
      console.error('  Migration will fail if records exist without navigation_node_id');
      console.error('\nProceed? (The migration SQL expects an empty table)\n');
    } else {
      console.log('  ✓ Database is clean\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 1] Load migration SQL\n');
    
    const migrationPath = resolve(
      process.cwd(),
      'packages/db-tutorial/src/migrations/manual/0001_phase1_add_navigation_node_id.sql'
    );
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    
    console.log(`  Migration file: 0001_phase1_add_navigation_node_id.sql`);
    console.log(`  Size: ${migrationSql.length} characters\n`);
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 2] Execute migration\n');
    
    const startTime = Date.now();
    const result = await pool.query(migrationSql);
    const duration = Date.now() - startTime;
    
    console.log(`  ✓ Migration executed in ${duration}ms\n`);
    
    // Check for NOTICE messages (from RAISE NOTICE in migration)
    if (result.rows && result.rows.length > 0) {
      console.log('Migration output:');
      result.rows.forEach(row => console.log(` `, row));
    }
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 3] Verify schema changes\n');
    
    // Verify column exists
    const columnCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sections'
      AND column_name = 'navigation_node_id'
    `);
    
    if (columnCheck.rows.length === 0) {
      throw new Error('navigation_node_id column not found after migration!');
    }
    
    const col = columnCheck.rows[0];
    console.log(`  Column: ${col.column_name}`);
    console.log(`  Type: ${col.data_type}`);
    console.log(`  Nullable: ${col.is_nullable}`);
    
    if (col.is_nullable === 'YES') {
      console.error('\n  ✗ Column is nullable (should be NOT NULL)');
      throw new Error('Migration did not make column NOT NULL');
    } else {
      console.log('  ✓ Column is NOT NULL\n');
    }
    
    // Verify unique index
    const indexCheck = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'tutorial_sections'
      AND indexname = 'uq_tutorial_v2_identity_active'
    `);
    
    if (indexCheck.rows.length === 0) {
      throw new Error('uq_tutorial_v2_identity_active index not found after migration!');
    }
    
    console.log(`  Index: ${indexCheck.rows[0].indexname}`);
    console.log(`  Definition: ${indexCheck.rows[0].indexdef.substring(0, 100)}...\n`);
    console.log('  ✓ Unique index created\n');
    
    // Verify delivery index
    const deliveryIndexCheck = await pool.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'tutorial_sections'
      AND indexname = 'idx_tutorial_v2_delivery'
    `);
    
    if (deliveryIndexCheck.rows.length > 0) {
      console.log(`  Index: ${deliveryIndexCheck.rows[0].indexname}`);
      console.log('  ✓ Delivery index updated\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('✅ PHASE 1 MIGRATION SUCCESSFUL\n');
    console.log('Schema changes applied:');
    console.log('  ✓ navigation_node_id column added (NOT NULL)');
    console.log('  ✓ Identity constraint: (subtopicId, navigationNodeId, brandId)');
    console.log('  ✓ Delivery index optimized for page-aware queries\n');
    console.log('Next steps:');
    console.log('  1. Create sidebar validation service');
    console.log('  2. Update Phase 1 tests');
    console.log('  3. Test: 3 pages under 1 subtopic\n');
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('\nError details:', error);
    console.error('\nThe database may be in an inconsistent state.');
    console.error('Review the error and consider manual rollback if needed.\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
