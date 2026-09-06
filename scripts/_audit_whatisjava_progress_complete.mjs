#!/usr/bin/env node
/**
 * COMPLETE FORENSIC AUDIT - READ ONLY
 * 
 * Full identity verification for all whatisjava progress rows
 * NO DATABASE MODIFICATIONS
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const ORPHANED_SECTION_ID = 'cce5ff0e-0fb1-458e-808a-9858f2e7605d';

async function main() {
  await client.connect();

  console.log('================================================================');
  console.log('WHATISJAVA — COMPLETE PROGRESS RECORD AUDIT');
  console.log('================================================================\n');
  console.log('READ-ONLY ANALYSIS — NO DATABASE MODIFICATIONS\n');

  // Get all progress rows
  const result = await client.query(`
    SELECT * FROM tutorial_navigation_progress
    WHERE navigation_node_id = $1
    ORDER BY created_at
  `, [NAVIGATION_NODE_ID]);

  console.log(`TOTAL ROWS: ${result.rows.length}\n`);

  // Get constraints
  const constraints = await client.query(`
    SELECT constraint_name, constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = 'tutorial_navigation_progress'
      AND constraint_type IN ('UNIQUE', 'PRIMARY KEY')
  `);

  console.log('CONSTRAINTS:');
  constraints.rows.forEach(c => {
    console.log(`  ${c.constraint_type}: ${c.constraint_name}`);
  });
  console.log('\n');

  // Audit each row
  const rows = result.rows;
  const labels = ['A', 'B', 'C'];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const label = labels[i] || `${i+1}`;
    
    console.log('================================================================');
    console.log(`ROW ${label}`);
    console.log('================================================================\n');

    console.log('BASIC IDENTITY:');
    console.log(`  Progress ID:        ${row.id}`);
    console.log(`  User ID:            ${row.user_id}`);
    console.log(`  Brand:              (not in table - need to verify)`);
    console.log(`  Navigation Node:    ${row.navigation_node_id}`);
    console.log(`  Subtopic ID:        ${row.subtopic_id}`);
    console.log(`  Section ID:         ${row.section_id || 'NULL'}`);
    console.log('');

    console.log('METRICS:');
    console.log(`  Visit Count:        ${row.visit_count}`);
    console.log(`  Status:             ${row.status}`);
    console.log(`  Revision Count:     ${row.revision_count}`);
    console.log(`  Active Time (sec):  ${row.time_spent_active_sec}`);
    console.log(`  Completed Blocks:   ${JSON.stringify(row.completed_blocks)}`);
    console.log(`  Last Session ID:    ${row.last_session_id || 'NULL'}`);
    console.log('');

    console.log('TIMESTAMPS:');
    console.log(`  Created:            ${row.created_at}`);
    console.log(`  Updated:            ${row.updated_at}`);
    console.log(`  First Viewed:       ${row.first_viewed_at || 'NULL'}`);
    console.log(`  Last Viewed:        ${row.last_viewed_at || 'NULL'}`);
    console.log(`  Completed:          ${row.completed_at || 'NULL'}`);
    console.log(`  Deleted:            ${row.deleted_at || 'NULL'}`);
    console.log('');

    // Identity chain verification
    console.log('IDENTITY CHAIN:');
    
    const navMatch = row.navigation_node_id === NAVIGATION_NODE_ID;
    console.log(`  navigationNode → ${navMatch ? 'PASS ✅' : 'FAIL ❌'} (${row.navigation_node_id})`);
    
    const subtopicMatch = row.subtopic_id === SUBTOPIC_INTERNAL_ID;
    console.log(`  subtopic       → ${subtopicMatch ? 'PASS ✅' : 'FAIL ❌'}`);
    if (!subtopicMatch) {
      console.log(`    Expected: ${SUBTOPIC_INTERNAL_ID}`);
      console.log(`    Got:      ${row.subtopic_id}`);
    }
    
    let sectionStatus = 'NULL';
    if (row.section_id) {
      const sectionCheck = await client.query('SELECT id FROM tutorial_sections WHERE id = $1', [row.section_id]);
      sectionStatus = sectionCheck.rows.length > 0 ? 'EXISTS ✅' : 'ORPHANED ❌';
      if (row.section_id === ORPHANED_SECTION_ID) {
        sectionStatus += ' (known Phase 2 test section)';
      }
    }
    console.log(`  section        → ${sectionStatus}`);
    
    const contentCheck = await client.query(
      'SELECT COUNT(*) as count FROM tutorial_page_content_v2 WHERE subtopic_id = $1',
      [SUBTOPIC_EXTERNAL_ID]
    );
    const hasContent = parseInt(contentCheck.rows[0].count) > 0;
    console.log(`  content        → ${hasContent ? 'FOUND ✅' : 'MISSING ❌'} (tutorial_page_content_v2)`);
    console.log('');

    // Phase 2 correlation
    console.log('PHASE 2 CORRELATION:');
    
    const isPhase2Date = row.created_at && 
      new Date(row.created_at).toISOString().startsWith('2026-09-04');
    console.log(`  test timestamp → ${isPhase2Date ? 'YES (Sept 4, 2026)' : 'NO'}`);
    
    const hasOrphanedSection = row.section_id === ORPHANED_SECTION_ID;
    console.log(`  orphaned sect  → ${hasOrphanedSection ? 'YES (cce5ff0e...)' : 'NO'}`);
    
    const hasTestPattern = row.visit_count > 20 && 
      row.completed_blocks.length === 0 && 
      row.time_spent_active_sec === 0;
    console.log(`  test pattern   → ${hasTestPattern ? 'YES (high visits, no completion)' : 'NO'}`);
    
    const knownArtifact = isPhase2Date && hasOrphanedSection && hasTestPattern;
    console.log(`  known artifact → ${knownArtifact ? 'YES ⚠️' : 'NO'}`);
    console.log('');

    // Classification
    console.log('CLASSIFICATION:');
    
    let classification = 'INVESTIGATE';
    let confidence = 'LOW';
    let reason = 'Insufficient evidence';
    
    if (knownArtifact) {
      classification = 'DELETE CANDIDATE';
      confidence = 'HIGH';
      reason = 'All Phase 2 test patterns match';
    } else if (row.visit_count === 0 && row.section_id === null && !row.deleted_at) {
      classification = 'KEEP';
      confidence = 'MEDIUM';
      reason = 'Clean baseline row, reusable state';
    } else if (!isPhase2Date) {
      classification = 'INVESTIGATE';
      confidence = 'MEDIUM';
      reason = 'Created outside Phase 2 window';
    }
    
    console.log(`  ${classification}`);
    console.log('');

    console.log('CONFIDENCE:');
    console.log(`  ${confidence}`);
    console.log('');

    console.log('REASON:');
    console.log(`  ${reason}`);
    console.log('\n');
  }

  // Cross-row analysis
  console.log('================================================================');
  console.log('CROSS-ROW AUDIT');
  console.log('================================================================\n');

  const users = [...new Set(rows.map(r => r.user_id))];
  const subtopics = [...new Set(rows.map(r => r.subtopic_id))];
  const sections = [...new Set(rows.map(r => r.section_id).filter(Boolean))];
  
  console.log(`Same user:                ${users.length === 1 ? 'YES (all same user)' : `NO (${users.length} different users)`}`);
  console.log(`Same navigation node:     YES (all whatisjava)`);
  console.log(`Same subtopic:            ${subtopics.length === 1 ? 'YES' : `NO (${subtopics.length} different)`}`);
  console.log(`Duplicate active records: ${rows.filter(r => !r.deleted_at).length} active rows`);
  console.log(`Shared section ID:        ${sections.length === 1 && sections[0] ? 'YES' : 'NO'}`);
  console.log(`Orphaned section refs:    ${rows.filter(r => r.section_id === ORPHANED_SECTION_ID).length} row(s)`);
  console.log(`Phase 2 test records:     ${rows.filter(r => new Date(r.created_at).toISOString().startsWith('2026-09-04')).length} row(s)`);
  console.log('');

  // User breakdown
  console.log('USER BREAKDOWN:');
  users.forEach(userId => {
    const userRows = rows.filter(r => r.user_id === userId);
    console.log(`  User ${userId.substring(0, 8)}...:`);
    console.log(`    Rows: ${userRows.length}`);
    console.log(`    Total visits: ${userRows.reduce((sum, r) => sum + r.visit_count, 0)}`);
  });
  console.log('\n');

  // Deletion plan
  console.log('================================================================');
  console.log('DELETION PLAN — NO MUTATION PERFORMED');
  console.log('================================================================\n');

  const keepRows = rows.filter(r => 
    r.visit_count === 0 && r.section_id === null && !r.deleted_at
  );

  const deleteRows = rows.filter(r => {
    const isPhase2Date = new Date(r.created_at).toISOString().startsWith('2026-09-04');
    const hasOrphanedSection = r.section_id === ORPHANED_SECTION_ID;
    const hasTestPattern = r.visit_count > 20 && r.completed_blocks.length === 0;
    return isPhase2Date && hasOrphanedSection && hasTestPattern;
  });

  const investigateRows = rows.filter(r => 
    !keepRows.includes(r) && !deleteRows.includes(r)
  );

  console.log('KEEP:');
  if (keepRows.length > 0) {
    keepRows.forEach(r => {
      console.log(`  ✅ ${r.id}`);
      console.log(`     User: ${r.user_id.substring(0, 8)}...`);
      console.log(`     Visits: ${r.visit_count}, Section: ${r.section_id || 'NULL'}`);
    });
  } else {
    console.log('  (none)');
  }
  console.log('');

  console.log('DELETE CANDIDATES:');
  if (deleteRows.length > 0) {
    deleteRows.forEach(r => {
      console.log(`  ❌ ${r.id}`);
      console.log(`     User: ${r.user_id.substring(0, 8)}...`);
      console.log(`     Visits: ${r.visit_count}, Section: ${r.section_id}`);
      console.log(`     Created: ${r.created_at}`);
    });
  } else {
    console.log('  (none)');
  }
  console.log('');

  console.log('INVESTIGATE:');
  if (investigateRows.length > 0) {
    investigateRows.forEach(r => {
      console.log(`  ⚠️  ${r.id}`);
      console.log(`     User: ${r.user_id.substring(0, 8)}...`);
      console.log(`     Visits: ${r.visit_count}`);
    });
  } else {
    console.log('  (none)');
  }
  console.log('\n');

  console.log('================================================================');
  console.log('DATABASE WAS NOT MODIFIED');
  console.log('================================================================');
  console.log('This audit performed READ-ONLY analysis.');
  console.log('No INSERT, UPDATE, DELETE, or TRUNCATE operations executed.');
  console.log('Decision authority remains with user.\n');

  await client.end();
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
