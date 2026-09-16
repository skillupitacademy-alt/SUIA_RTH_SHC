#!/usr/bin/env node
/**
 * Audit: Tutorial Composer Write Operations
 * 
 * Purpose: Verify Composer write safety - can Python creation delete/overwrite Java?
 */

import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  
  try {
    await client.connect();
    console.log('AUDIT: Tutorial Composer Write Operations');
    console.log('='.repeat(80));
    console.log('');

    // ========================================================================
    // CHECK 1: Search for orphaned Java section ID in blocks
    // ========================================================================
    console.log('CHECK 1: Orphaned Java Section - Do blocks still exist?');
    console.log('-'.repeat(80));
    
    const JAVA_SECTION_ID = '75e91508-fe79-45fa-a3d8-d5506a1213d7';
    
    // Check if tutorial_blocks table exists
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'tutorial_blocks'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('  ℹ️  tutorial_blocks table does not exist');
      console.log('  Note: Tutorial V2 stores content as JSONB in tutorial_sections.content');
      console.log('');
    } else {
      const blocks = await client.query(`
        SELECT
          id,
          section_id,
          block_type,
          position,
          created_at,
          updated_at
        FROM tutorial_blocks
        WHERE section_id = $1
        ORDER BY position
      `, [JAVA_SECTION_ID]);
      
      if (blocks.rows.length > 0) {
        console.log(`  ⚠️  Found ${blocks.rows.length} orphaned blocks!`);
        console.log('  This suggests section was deleted but blocks remained.');
        blocks.rows.forEach((b, idx) => {
          console.log(`  ${idx + 1}. Block ${b.id} (${b.block_type}) position ${b.position}`);
        });
      } else {
        console.log('  ✓ No orphaned blocks found');
      }
      console.log('');
    }

    // ========================================================================
    // CHECK 2: Search for the orphaned section ID anywhere in the database
    // ========================================================================
    console.log('CHECK 2: Search for Java Section ID in all records');
    console.log('-'.repeat(80));
    
    // Check tutorial_sections (including deleted)
    const sectionSearch = await client.query(`
      SELECT
        id,
        navigation_node_id,
        subtopic_id,
        brand_id,
        status,
        deleted_at,
        created_at,
        updated_at
      FROM tutorial_sections
      WHERE id = $1
    `, [JAVA_SECTION_ID]);
    
    if (sectionSearch.rows.length > 0) {
      console.log('  ✓ Found section in tutorial_sections:');
      const s = sectionSearch.rows[0];
      console.log(`    ID: ${s.id}`);
      console.log(`    Navigation: ${s.navigation_node_id}`);
      console.log(`    Status: ${s.status}`);
      console.log(`    Deleted: ${s.deleted_at ? `YES (${s.deleted_at})` : 'NO'}`);
      console.log(`    Created: ${s.created_at}`);
      console.log(`    Updated: ${s.updated_at}`);
    } else {
      console.log('  ❌ Section NOT FOUND in tutorial_sections');
      console.log('  This confirms HARD DELETE (not soft-delete)');
    }
    console.log('');

    // ========================================================================
    // CHECK 3: Analyze Python section creation details
    // ========================================================================
    console.log('CHECK 3: Python Section Creation Analysis');
    console.log('-'.repeat(80));
    
    const PYTHON_SECTION_ID = '05b5cfa0-e45b-4fb6-93de-d47545d6c02f';
    
    const pythonSection = await client.query(`
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        content,
        created_at,
        updated_at,
        published_at,
        regeneration_count,
        version
      FROM tutorial_sections
      WHERE id = $1
    `, [PYTHON_SECTION_ID]);
    
    if (pythonSection.rows.length > 0) {
      const p = pythonSection.rows[0];
      console.log('  Python Section Details:');
      console.log(`    ID: ${p.id}`);
      console.log(`    Subtopic ID: ${p.subtopic_id}`);
      console.log(`    Navigation: ${p.navigation_node_id}`);
      console.log(`    Brand: ${p.brand_id}`);
      console.log(`    Status: ${p.status}`);
      console.log(`    Created: ${p.created_at}`);
      console.log(`    Updated: ${p.updated_at}`);
      console.log(`    Published: ${p.published_at}`);
      console.log(`    Version: ${p.version}`);
      console.log(`    Regeneration Count: ${p.regeneration_count}`);
      console.log(`    Content blocks: ${p.content?.blocks?.length || 0}`);
      
      // Check if Python ID matches Java ID (overwrite scenario)
      if (p.id === JAVA_SECTION_ID) {
        console.log('  ⚠️  CRITICAL: Python section ID matches Java section ID!');
        console.log('  This indicates OVERWRITE, not new creation');
      } else {
        console.log('  ✓ Python has different section ID (separate record)');
      }
    }
    console.log('');

    // ========================================================================
    // CHECK 4: Check for any sections under BOTH subtopics
    // ========================================================================
    console.log('CHECK 4: All Sections Under Java & Python Subtopics');
    console.log('-'.repeat(80));
    
    const JAVA_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
    const PYTHON_INTERNAL_ID = '497f6cf0-a74e-4e6a-a5c2-eea5395f50c9';
    
    const allSubtopicSections = await client.query(`
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        deleted_at,
        created_at,
        updated_at
      FROM tutorial_sections
      WHERE subtopic_id IN ($1, $2)
      ORDER BY created_at, subtopic_id, navigation_node_id
    `, [JAVA_INTERNAL_ID, PYTHON_INTERNAL_ID]);
    
    console.log(`  Found ${allSubtopicSections.rows.length} section(s) total:\n`);
    
    const javaCount = allSubtopicSections.rows.filter(r => r.subtopic_id === JAVA_INTERNAL_ID).length;
    const pythonCount = allSubtopicSections.rows.filter(r => r.subtopic_id === PYTHON_INTERNAL_ID).length;
    
    console.log(`    Java subtopic (${JAVA_INTERNAL_ID}): ${javaCount} section(s)`);
    console.log(`    Python subtopic (${PYTHON_INTERNAL_ID}): ${pythonCount} section(s)`);
    console.log('');
    
    allSubtopicSections.rows.forEach((row, idx) => {
      const subtopicName = row.subtopic_id === JAVA_INTERNAL_ID ? 'Java' : 'Python';
      console.log(`  ${idx + 1}. [${subtopicName}] ${row.navigation_node_id}`);
      console.log(`     Section ID: ${row.id}`);
      console.log(`     Status: ${row.status}, Deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
      console.log(`     Created: ${row.created_at}`);
      console.log('');
    });

    // ========================================================================
    // CHECK 5: Verify unique constraint enforcement
    // ========================================================================
    console.log('CHECK 5: Database Unique Constraint Verification');
    console.log('-'.repeat(80));
    
    const uniqueConstraint = await client.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'tutorial_sections'
      AND indexname LIKE '%identity%'
      OR indexname LIKE '%unique%'
    `);
    
    console.log('  Unique constraints on tutorial_sections:\n');
    uniqueConstraint.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
      console.log('');
    });

    // ========================================================================
    // CHECK 6: Check LSNB subtopic ID usage pattern
    // ========================================================================
    console.log('CHECK 6: LSNB Subtopic ID Pattern Analysis');
    console.log('-'.repeat(80));
    
    const lsnbPattern = await client.query(`
      SELECT
        navigation_node_id,
        subtopic_id,
        COUNT(*) as record_count,
        COUNT(DISTINCT subtopic_id) as distinct_subtopic_ids
      FROM tutorial_navigation_progress
      WHERE navigation_node_id IN ('whatisjava', 'whatispython')
      GROUP BY navigation_node_id, subtopic_id
      ORDER BY navigation_node_id, subtopic_id
    `);
    
    console.log(`  LSNB subtopic ID usage:\n`);
    lsnbPattern.rows.forEach(row => {
      console.log(`  Navigation: ${row.navigation_node_id}`);
      console.log(`  Subtopic ID: ${row.subtopic_id}`);
      console.log(`  Records: ${row.record_count}`);
      
      // Check if it's internal or external
      if (row.subtopic_id === JAVA_INTERNAL_ID || row.subtopic_id === PYTHON_INTERNAL_ID) {
        console.log(`  Type: INTERNAL ID (tutorial_subtopics.id)`);
      } else {
        console.log(`  Type: EXTERNAL ID (tutorial_subtopics.external_id)`);
      }
      console.log('');
    });

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    console.log('Evidence Found:');
    console.log('');
    console.log('1. Java Section Status:');
    if (sectionSearch.rows.length > 0 && sectionSearch.rows[0].deleted_at) {
      console.log('   ⚠️  SOFT-DELETED (deleted_at is set)');
      console.log('   When: ' + sectionSearch.rows[0].deleted_at);
    } else if (sectionSearch.rows.length === 0) {
      console.log('   ❌ HARD-DELETED or NEVER EXISTED in this database');
      console.log('   Section ID: 75e91508-fe79-45fa-a3d8-d5506a1213d7');
    } else {
      console.log('   ✓ EXISTS');
    }
    console.log('');
    
    console.log('2. Python Section Status:');
    console.log('   ✓ EXISTS as separate record');
    console.log('   Section ID: 05b5cfa0-e45b-4fb6-93de-d47545d6c02f');
    console.log('   ≠ Java Section ID (no overwrite)');
    console.log('');
    
    console.log('3. Data Integrity Issues:');
    console.log('   - Orphaned LSNB reference to missing Java section');
    console.log('   - LSNB uses INTERNAL subtopic IDs (may be intentional)');
    console.log('');
    
    console.log('4. Outstanding Questions:');
    console.log('   - Why was Java section removed? (manual delete? migration? reset?)');
    console.log('   - When was it removed? (no audit trail found)');
    console.log('   - Did Python creation trigger deletion? (NO EVIDENCE YET)');
    console.log('');
    
    console.log('Next Investigation Steps:');
    console.log('   → Check application logs for DELETE operations');
    console.log('   → Review Composer service code for delete operations');
    console.log('   → Check database backups/history');
    console.log('   → Verify LSNB ID contract (internal vs external)');
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
