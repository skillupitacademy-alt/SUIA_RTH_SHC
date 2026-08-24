#!/usr/bin/env node
/**
 * Phase 1 - Execute Database Reset
 * 
 * DANGER: This script deletes ALL tutorial content records.
 * 
 * PURPOSE: Reset disposable development/test tutorial content to enable
 *          clean Phase 1 page-aware architecture testing.
 * 
 * SAFE TO DELETE: tutorial content records
 * PRESERVED: hierarchy, sidebar, navigation, users
 * 
 * Execute manually: node scripts/phase1-execute-db-reset.mjs
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
console.log('║   PHASE 1 - DATABASE RESET (DEVELOPMENT ONLY)                   ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

async function executeReset() {
  try {
    // Read the SQL script
    const sqlPath = resolve(process.cwd(), 'packages/db-tutorial/src/migrations/manual/0000_phase1_reset_development_content.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    console.log('⚠️  DANGER: This will delete ALL tutorial content records!\n');
    console.log('Files to be cleared:');
    console.log('  • tutorial_sections (main content)');
    console.log('  • content_deployments');
    console.log('  • tutorial_subsections (legacy)');
    console.log('  • tutorial_section_domains (13 tables)');
    console.log('  • user interaction logs');
    console.log('  • analytics metrics\n');
    
    console.log('Files to be preserved:');
    console.log('  ✓ tutorial_sidebar_trees_v2 (CRITICAL)');
    console.log('  ✓ tutorial_subtopics');
    console.log('  ✓ tutorial_topics');
    console.log('  ✓ All hierarchy/master data\n');

    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 1] PRE-FLIGHT CHECK - Current State\n');

    // Check current state
    const beforeSections = await pool.query('SELECT COUNT(*) FROM tutorial_sections');
    const beforeSidebar = await pool.query('SELECT COUNT(*) FROM tutorial_sidebar_trees_v2');
    const beforeSubtopics = await pool.query('SELECT COUNT(*) FROM tutorial_subtopics');

    console.log(`  tutorial_sections:          ${beforeSections.rows[0].count} records`);
    console.log(`  tutorial_sidebar_trees_v2:  ${beforeSidebar.rows[0].count} records (preserve)`);
    console.log(`  tutorial_subtopics:         ${beforeSubtopics.rows[0].count} records (preserve)\n`);

    if (beforeSidebar.rows[0].count === '0') {
      console.error('❌ ERROR: No sidebar data found! Cannot proceed without navigation data.');
      process.exit(1);
    }

    if (beforeSubtopics.rows[0].count === '0') {
      console.error('❌ ERROR: No subtopics found! Database may be empty.');
      process.exit(1);
    }

    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 2] EXECUTE RESET\n');

    // Delete tutorial_sections (this database doesn't have the other tables yet)
    console.log('  Deleting tutorial_sections...');
    await pool.query('DELETE FROM tutorial_sections');
    console.log('  ✓ tutorial_sections deleted\n');

    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 3] VERIFICATION - Confirm Clean State\n');

    // Verify clean state
    const afterSections = await pool.query('SELECT COUNT(*) FROM tutorial_sections');
    
    console.log('  Content Tables (should be 0):');
    console.log(`    tutorial_sections:       ${afterSections.rows[0].count} ${afterSections.rows[0].count === '0' ? '✓' : '✗'}\n`);

    // Verify preserved data
    const afterSidebar = await pool.query('SELECT COUNT(*) FROM tutorial_sidebar_trees_v2');
    const afterSubtopics = await pool.query('SELECT COUNT(*) FROM tutorial_subtopics');
    const afterTopics = await pool.query('SELECT COUNT(*) FROM tutorial_topics');

    console.log('  Master Data (should be preserved):');
    console.log(`    tutorial_sidebar_trees_v2: ${afterSidebar.rows[0].count} ${afterSidebar.rows[0].count === beforeSidebar.rows[0].count ? '✓' : '✗'}`);
    console.log(`    tutorial_subtopics:        ${afterSubtopics.rows[0].count} ${afterSubtopics.rows[0].count === beforeSubtopics.rows[0].count ? '✓' : '✗'}`);
    console.log(`    tutorial_topics:           ${afterTopics.rows[0].count} ${afterTopics.rows[0].count > 0 ? '✓' : '✗'}\n`);

    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // Final validation
    if (afterSections.rows[0].count === '0' && 
        afterSidebar.rows[0].count > 0 && 
        afterSubtopics.rows[0].count > 0) {
      
      console.log('✅ RESET SUCCESSFUL\n');
      console.log('Database is now ready for Phase 1 clean implementation:\n');
      console.log('  ✓ Tutorial content cleared (0 records)');
      console.log('  ✓ Sidebar/navigation preserved');
      console.log('  ✓ Hierarchy data preserved\n');
      console.log('Next steps:');
      console.log('  1. Finalize schema: navigationNodeId NOT NULL');
      console.log('  2. Create sidebar validation service');
      console.log('  3. Execute Phase 1 repository tests');
      console.log('  4. Test: 3 pages under 1 subtopic\n');
      
    } else {
      console.error('⚠️  RESET COMPLETED BUT WITH ISSUES\n');
      
      if (afterSections.rows[0].count > 0) {
        console.error('  ✗ tutorial_sections still has records');
      }
      if (afterSidebar.rows[0].count === '0') {
        console.error('  ✗ Sidebar data was lost!');
      }
      if (afterSubtopics.rows[0].count === '0') {
        console.error('  ✗ Subtopic data was lost!');
      }
      
      console.error('\nPlease investigate before proceeding with Phase 1.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ RESET FAILED:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

executeReset();
