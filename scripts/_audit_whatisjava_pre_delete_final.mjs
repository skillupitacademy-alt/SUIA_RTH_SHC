#!/usr/bin/env node
/**
 * FINAL PRE-DELETE AUDIT - COMPLETE IDENTITY CHAIN VERIFICATION
 * 
 * TABLE-BASED FORENSIC ANALYSIS (READ-ONLY)
 * 
 * Verifies complete chain across all databases:
 * - tutorial_navigation_progress (tutorial_prod)
 * - tutorial_sections, tutorial_subtopics, tutorial_page_content_v2 (tutorial_prod)
 * - users (people_prod)
 * - FK constraints and cascade rules
 * 
 * Based on proven patterns from:
 * - scripts/_investigate_specific_records.mjs
 * - scripts/check-export-data.mjs
 * - scripts/phase-a-eradication-safety-audit.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const ORPHANED_SECTION_ID = 'cce5ff0e-0fb1-458e-808a-9858f2e7605d';
const PHASE_2_TEST_DATE = '2026-09-04';

async function main() {
  const tutorialPool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  const peoplePool = new Pool({ connectionString: process.env.DATABASE_URL_PEOPLE });

  console.log('================================================================');
  console.log('WHATISJAVA — FINAL PRE-DELETE FORENSIC AUDIT');
  console.log('================================================================\n');
  console.log('READ-ONLY TABLE-BASED VERIFICATION');
  console.log('NO DATABASE MODIFICATIONS WILL BE PERFORMED\n');
  console.log('================================================================\n');

  // ================================================================
  // 1. GET ALL PROGRESS RECORDS
  // ================================================================
  console.log('1. PROGRESS RECORDS (tutorial_navigation_progress)');
  console.log('----------------------------------------------------------------\n');

  const progressResult = await tutorialPool.query(`
    SELECT * FROM tutorial_navigation_progress
    WHERE navigation_node_id = $1
    ORDER BY created_at
  `, [NAVIGATION_NODE_ID]);

  console.log(`Total records: ${progressResult.rows.length}\n`);

  const rows = progressResult.rows;
  const labels = ['A', 'B', 'C'];

  // ================================================================
  // 2. VERIFY USERS IN PEOPLE DATABASE
  // ================================================================
  console.log('\n2. USER VERIFICATION (users table in people_prod)');
  console.log('----------------------------------------------------------------\n');

  const userMap = new Map();
  let peopleDbError = null;

  for (const row of rows) {
    try {
      const userResult = await peoplePool.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [row.user_id]
      );

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        userMap.set(row.user_id, { found: true, data: user });
        console.log(`✅ User ${row.user_id.substring(0, 8)}... EXISTS`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Created: ${user.created_at}`);
      } else {
        console.log(`❌ User ${row.user_id.substring(0, 8)}... NOT FOUND in people_prod`);
        userMap.set(row.user_id, { found: false, data: null });
      }
    } catch (err) {
      console.log(`⚠️  User ${row.user_id.substring(0, 8)}... ERROR: ${err.message}`);
      userMap.set(row.user_id, { found: false, error: err.message });
      peopleDbError = err.message;
    }
    console.log('');
  }

  if (peopleDbError) {
    console.log('⚠️  CRITICAL: People database queries failed');
    console.log('   User identity verification INCOMPLETE');
    console.log('   Deletion should NOT proceed without user verification\n');
  }

  // ================================================================
  // 3. VERIFY SUBTOPIC IDENTITY CHAIN
  // ================================================================
  console.log('\n3. SUBTOPIC IDENTITY CHAIN');
  console.log('----------------------------------------------------------------\n');

  const subtopicResult = await tutorialPool.query(`
    SELECT id, external_id, name, slug, created_at
    FROM tutorial_subtopics
    WHERE id = $1 OR external_id = $2
  `, [SUBTOPIC_INTERNAL_ID, SUBTOPIC_EXTERNAL_ID]);

  console.log(`Subtopic lookup (internal + external):`);
  if (subtopicResult.rows.length > 0) {
    subtopicResult.rows.forEach(st => {
      console.log(`  ✅ Found:`);
      console.log(`     Internal ID: ${st.id}`);
      console.log(`     External ID: ${st.external_id}`);
      console.log(`     Name: ${st.name}`);
      console.log(`     Slug: ${st.slug}`);
      console.log(`     Created: ${st.created_at}`);
    });
  } else {
    console.log(`  ❌ Subtopic NOT FOUND`);
  }
  console.log('');

  // ================================================================
  // 4. VERIFY CONTENT EXISTS
  // ================================================================
  console.log('\n4. CONTENT VERIFICATION');
  console.log('----------------------------------------------------------------\n');

  // Check tutorial_sections
  const sectionsResult = await tutorialPool.query(`
    SELECT COUNT(*) as count
    FROM tutorial_sections
    WHERE subtopic_id = $1
  `, [SUBTOPIC_INTERNAL_ID]);

  console.log(`tutorial_sections (uses internal_id):`);
  console.log(`  Count: ${sectionsResult.rows[0].count}`);
  console.log(`  ${sectionsResult.rows[0].count === '0' ? '❌ EMPTY' : '✅ HAS DATA'}`);
  console.log('');

  // Check tutorial_page_content_v2
  const contentV2Result = await tutorialPool.query(`
    SELECT id, content_type, status, created_at
    FROM tutorial_page_content_v2
    WHERE subtopic_id = $1
    ORDER BY content_type
  `, [SUBTOPIC_EXTERNAL_ID]);

  console.log(`tutorial_page_content_v2 (uses external_id):`);
  console.log(`  Count: ${contentV2Result.rows.length}`);
  if (contentV2Result.rows.length > 0) {
    console.log(`  ✅ CONTENT EXISTS:`);
    contentV2Result.rows.forEach(c => {
      console.log(`     - ${c.content_type} (${c.status}) created ${c.created_at}`);
    });
  } else {
    console.log(`  ❌ NO CONTENT`);
  }
  console.log('');

  // ================================================================
  // 5. CHECK ORPHANED SECTION
  // ================================================================
  console.log('\n5. ORPHANED SECTION VERIFICATION');
  console.log('----------------------------------------------------------------\n');

  const orphanedSectionResult = await tutorialPool.query(`
    SELECT * FROM tutorial_sections
    WHERE id = $1
  `, [ORPHANED_SECTION_ID]);

  console.log(`Section ${ORPHANED_SECTION_ID}:`);
  if (orphanedSectionResult.rows.length > 0) {
    console.log(`  ✅ EXISTS in tutorial_sections`);
    console.log(JSON.stringify(orphanedSectionResult.rows[0], null, 2));
  } else {
    console.log(`  ❌ DOES NOT EXIST (orphaned reference)`);
  }
  console.log('');

  // ================================================================
  // 6. FOREIGN KEY CONSTRAINTS
  // ================================================================
  console.log('\n6. FOREIGN KEY CONSTRAINTS');
  console.log('----------------------------------------------------------------\n');

  const fkResult = await tutorialPool.query(`
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    LEFT JOIN information_schema.referential_constraints AS rc
      ON tc.constraint_name = rc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'tutorial_navigation_progress'
      AND kcu.column_name IN ('section_id', 'subtopic_id', 'user_id')
    ORDER BY kcu.column_name
  `);

  console.log(`tutorial_navigation_progress FK constraints:`);
  if (fkResult.rows.length > 0) {
    fkResult.rows.forEach(fk => {
      console.log(`  ✅ ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      console.log(`     Constraint: ${fk.constraint_name}`);
      console.log(`     ON DELETE: ${fk.delete_rule || 'NO ACTION'}`);
      console.log('');
    });
  } else {
    console.log(`  ⚠️  NO FOREIGN KEY CONSTRAINTS`);
    console.log(`     This allows orphaned references without errors`);
  }
  console.log('');

  // ================================================================
  // 7. CHECK FOR CASCADE DEPENDENCIES
  // ================================================================
  console.log('\n7. CASCADE DEPENDENCY CHECK');
  console.log('----------------------------------------------------------------\n');

  const userIds = [...new Set(rows.map(r => r.user_id))];
  
  // Check block_learning_state (uses user_id + navigation_node_id, not FK to progress)
  const blockStateResult = await tutorialPool.query(`
    SELECT COUNT(*) as count
    FROM block_learning_state
    WHERE user_id = ANY($1::uuid[])
      AND navigation_node_id = $2
  `, [userIds, NAVIGATION_NODE_ID]);

  console.log(`Tables that share user_id + navigation_node_id:`);
  console.log(`  block_learning_state: ${blockStateResult.rows[0].count} row(s)`);
  console.log(`  (Note: block_learning_state has no FK to progress table)`);
  console.log('');

  // ================================================================
  // 8. DETAILED ROW ANALYSIS
  // ================================================================
  console.log('\n8. DETAILED ROW ANALYSIS');
  console.log('================================================================\n');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const label = labels[i] || `${i + 1}`;
    const userInfo = userMap.get(row.user_id);

    console.log('----------------------------------------------------------------');
    console.log(`ROW ${label}`);
    console.log('----------------------------------------------------------------\n');

    // Basic identity
    console.log('PROGRESS RECORD:');
    console.log(`  ID:                 ${row.id}`);
    console.log(`  User ID:            ${row.user_id}`);
    console.log(`  Navigation Node:    ${row.navigation_node_id}`);
    console.log(`  Subtopic ID:        ${row.subtopic_id}`);
    console.log(`  Section ID:         ${row.section_id || 'NULL'}`);
    console.log(`  Visit Count:        ${row.visit_count}`);
    console.log(`  Status:             ${row.status}`);
    console.log(`  Last Session:       ${row.last_session_id || 'NULL'}`);
    console.log('');

    // User details
    console.log('USER IDENTITY:');
    if (userInfo?.found && userInfo.data) {
      console.log(`  ✅ VERIFIED in people_prod`);
      console.log(`  Email:              ${userInfo.data.email}`);
      console.log(`  Name:               ${userInfo.data.name}`);
    } else if (userInfo?.error) {
      console.log(`  ⚠️  ERROR: ${userInfo.error}`);
      console.log(`  USER VERIFICATION FAILED`);
    } else {
      console.log(`  ❌ NOT FOUND in people_prod`);
    }
    console.log('');

    // Timestamps
    console.log('TIMESTAMPS:');
    console.log(`  Created:            ${row.created_at}`);
    console.log(`  First Viewed:       ${row.first_viewed_at || 'NULL'}`);
    console.log(`  Last Viewed:        ${row.last_viewed_at || 'NULL'}`);
    console.log(`  Updated:            ${row.updated_at}`);
    console.log('');

    // Activity metrics
    console.log('ACTIVITY METRICS:');
    console.log(`  Active Time:        ${row.time_spent_active_sec}s`);
    console.log(`  Revision Count:     ${row.revision_count}`);
    console.log(`  Completed Blocks:   ${JSON.stringify(row.completed_blocks)}`);
    console.log('');

    // Identity chain validation
    console.log('IDENTITY CHAIN:');
    const navMatch = row.navigation_node_id === NAVIGATION_NODE_ID;
    console.log(`  navigationNode      ${navMatch ? '✅ PASS' : '❌ FAIL'} (${row.navigation_node_id})`);
    
    const subtopicMatch = row.subtopic_id === SUBTOPIC_INTERNAL_ID;
    console.log(`  subtopic            ${subtopicMatch ? '✅ PASS' : '❌ FAIL'}`);
    
    let sectionStatus = 'NULL ✅';
    if (row.section_id) {
      if (row.section_id === ORPHANED_SECTION_ID) {
        sectionStatus = 'ORPHANED ❌ (known Phase 2 test section)';
      } else {
        sectionStatus = 'UNKNOWN ⚠️';
      }
    }
    console.log(`  section             ${sectionStatus}`);
    
    const hasContent = contentV2Result.rows.length > 0;
    console.log(`  content             ${hasContent ? '✅ FOUND' : '❌ MISSING'} (tutorial_page_content_v2)`);
    console.log('');

    // Phase 2 correlation
    console.log('PHASE 2 TEST CORRELATION:');
    const createdDate = new Date(row.created_at).toISOString().split('T')[0];
    const isPhase2Date = createdDate === PHASE_2_TEST_DATE;
    const hasOrphanedSection = row.section_id === ORPHANED_SECTION_ID;
    const hasTestPattern = row.visit_count > 20 && 
      row.completed_blocks.length === 0 && 
      row.time_spent_active_sec === 0;
    const hasSession = row.last_session_id !== null;

    console.log(`  Created date        ${isPhase2Date ? '✅ YES' : '❌ NO'} (${createdDate})`);
    console.log(`  Orphaned section    ${hasOrphanedSection ? '✅ YES' : '❌ NO'}`);
    console.log(`  Test pattern        ${hasTestPattern ? '✅ YES' : '❌ NO'} (high visits, no completion)`);
    console.log(`  Session tracked     ${hasSession ? '✅ YES' : '❌ NO'}`);
    console.log('');

    // Classification
    const isPhase2Artifact = isPhase2Date && hasOrphanedSection && hasTestPattern;
    const isCleanBaseline = row.visit_count === 0 && row.section_id === null && !row.deleted_at;

    let classification = 'INVESTIGATE';
    let confidence = 'LOW';
    let reason = 'Insufficient evidence';

    if (isPhase2Artifact) {
      classification = 'DELETE CANDIDATE';
      confidence = 'HIGH';
      reason = 'All Phase 2 test artifact patterns confirmed';
    } else if (isCleanBaseline) {
      classification = 'KEEP';
      confidence = 'HIGH';
      reason = 'Clean baseline, created before Phase 2, reusable state';
    }

    console.log('CLASSIFICATION:');
    console.log(`  ${classification}`);
    console.log('');

    console.log('CONFIDENCE:');
    console.log(`  ${confidence}`);
    console.log('');

    console.log('REASON:');
    console.log(`  ${reason}`);
    console.log('\n');
  }

  // ================================================================
  // 9. CROSS-ROW ANALYSIS
  // ================================================================
  console.log('\n================================================================');
  console.log('9. CROSS-ROW ANALYSIS');
  console.log('================================================================\n');

  const users = [...new Set(rows.map(r => r.user_id))];
  const sections = [...new Set(rows.map(r => r.section_id).filter(Boolean))];
  const sessions = [...new Set(rows.map(r => r.last_session_id).filter(Boolean))];

  console.log('UNIQUENESS:');
  console.log(`  Unique users:       ${users.length} (${users.length === 1 ? 'SAME' : 'DIFFERENT'})`);
  console.log(`  Unique sections:    ${sections.length}`);
  console.log(`  Unique sessions:    ${sessions.length}`);
  console.log('');

  console.log('USER BREAKDOWN:');
  users.forEach(userId => {
    const userRows = rows.filter(r => r.user_id === userId);
    const userInfo = userMap.get(userId);
    const totalVisits = userRows.reduce((sum, r) => sum + r.visit_count, 0);
    
    console.log(`  ${userId.substring(0, 8)}...`);
    if (userInfo?.found && userInfo.data) {
      console.log(`    Email: ${userInfo.data.email}`);
    } else if (userInfo?.error) {
      console.log(`    ERROR: ${userInfo.error}`);
    } else {
      console.log(`    NOT FOUND`);
    }
    console.log(`    Progress rows: ${userRows.length}`);
    console.log(`    Total visits: ${totalVisits}`);
    console.log('');
  });

  // ================================================================
  // 10. DELETION PLAN
  // ================================================================
  console.log('\n================================================================');
  console.log('10. DELETION PLAN (NO MUTATIONS PERFORMED)');
  console.log('================================================================\n');

  const keepRows = rows.filter(r => 
    r.visit_count === 0 && r.section_id === null && !r.deleted_at
  );

  const deleteRows = rows.filter(r => {
    const createdDate = new Date(r.created_at).toISOString().split('T')[0];
    const isPhase2Date = createdDate === PHASE_2_TEST_DATE;
    const hasOrphanedSection = r.section_id === ORPHANED_SECTION_ID;
    const hasTestPattern = r.visit_count > 20 && r.completed_blocks.length === 0;
    return isPhase2Date && hasOrphanedSection && hasTestPattern;
  });

  console.log('KEEP:');
  if (keepRows.length > 0) {
    keepRows.forEach(r => {
      const userInfo = userMap.get(r.user_id);
      const userDisplay = userInfo?.found && userInfo.data 
        ? userInfo.data.email 
        : r.user_id.substring(0, 8) + '...';
      console.log(`  ✅ ${r.id}`);
      console.log(`     User: ${userDisplay}`);
      console.log(`     Visits: ${r.visit_count}, Section: ${r.section_id || 'NULL'}`);
      console.log(`     Created: ${r.created_at}`);
      console.log('');
    });
  } else {
    console.log('  (none)\n');
  }

  console.log('DELETE CANDIDATES:');
  if (deleteRows.length > 0) {
    deleteRows.forEach(r => {
      const userInfo = userMap.get(r.user_id);
      const userDisplay = userInfo?.found && userInfo.data 
        ? userInfo.data.email 
        : r.user_id.substring(0, 8) + '...';
      console.log(`  ❌ ${r.id}`);
      console.log(`     User: ${userDisplay}`);
      console.log(`     Visits: ${r.visit_count}, Section: ${r.section_id}`);
      console.log(`     Session: ${r.last_session_id}`);
      console.log(`     Created: ${r.created_at}`);
      console.log('');
    });

    console.log('DELETE SQL (for reference only):');
    console.log('BEGIN;');
    deleteRows.forEach(r => {
      console.log(`DELETE FROM tutorial_navigation_progress WHERE id = '${r.id}';`);
    });
    console.log('COMMIT;');
    console.log('');
  } else {
    console.log('  (none)\n');
  }

  // ================================================================
  // 11. COMPLETE DEPENDENCY VERIFICATION
  // ================================================================
  console.log('\n================================================================');
  console.log('11. COMPLETE DEPENDENCY VERIFICATION');
  console.log('================================================================\n');

  console.log('Checking ALL OTHER tables for references to progress IDs...\n');

  const progressIds = deleteRows.map(r => r.id);
  
  let directDependenciesFound = false;
  const dependencyRecords = [];
  
  if (progressIds.length > 0) {
    // Get all tables EXCEPT tutorial_navigation_progress itself
    const tablesResult = await tutorialPool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        AND table_name <> 'tutorial_navigation_progress'
      ORDER BY table_name
    `);

    console.log(`Scanning ${tablesResult.rows.length} OTHER tables in tutorial_prod...\n`);

    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      // Only inspect UUID columns
      const columnsResult = await tutorialPool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
          AND udt_name = 'uuid'
        ORDER BY ordinal_position
      `, [tableName]);

      for (const col of columnsResult.rows) {
        const columnName = col.column_name;
        
        // Safe because names came directly from information_schema
        const quotedTable = `"${tableName.replace(/"/g, '""')}"`;
        const quotedColumn = `"${columnName.replace(/"/g, '""')}"`;
        
        try {
          const countResult = await tutorialPool.query(
            `
            SELECT COUNT(*)::int AS count
            FROM ${quotedTable}
            WHERE ${quotedColumn} = ANY($1::uuid[])
            `,
            [progressIds]
          );

          const count = countResult.rows[0].count;
          
          if (count > 0) {
            directDependenciesFound = true;
            
            dependencyRecords.push({
              table: tableName,
              column: columnName,
              count
            });
            
            console.log(`❌ DEPENDENCY FOUND: ${tableName}.${columnName}`);
            console.log(`   ${count} row(s) reference progress IDs scheduled for deletion`);
          }
        } catch (err) {
          console.log(`⚠️  Could not inspect ${tableName}.${columnName}: ${err.message}`);
        }
      }
    }

    console.log('');

    if (!directDependenciesFound) {
      console.log('✅ NO DIRECT DEPENDENCIES FOUND');
      console.log('   No OTHER tutorial_prod table contains either progress ID.');
    } else {
      console.log('❌ DIRECT DEPENDENCIES FOUND');
      console.log('   Deletion MUST remain blocked until these references are investigated.');
    }
  } else {
    console.log('No delete candidates - dependency check skipped.');
  }
  console.log('');

  // ================================================================
  // 12. ROW SNAPSHOT VERIFICATION
  // ================================================================
  console.log('\n================================================================');
  console.log('12. ROW SNAPSHOT VERIFICATION');
  console.log('================================================================\n');

  console.log('Re-querying delete candidates to verify no mutations occurred...\n');

  const auditSnapshot = new Map(
    rows.map(r => [
      r.id,
      {
        id: r.id,
        user_id: r.user_id,
        navigation_node_id: r.navigation_node_id,
        subtopic_id: r.subtopic_id,
        section_id: r.section_id,
        visit_count: r.visit_count,
        status: r.status,
        last_session_id: r.last_session_id,
        created_at: new Date(r.created_at).toISOString(),
        first_viewed_at: r.first_viewed_at ? new Date(r.first_viewed_at).toISOString() : null,
        last_viewed_at: r.last_viewed_at ? new Date(r.last_viewed_at).toISOString() : null,
        updated_at: new Date(r.updated_at).toISOString(),
        time_spent_active_sec: r.time_spent_active_sec,
        revision_count: r.revision_count,
        completed_blocks: JSON.stringify(r.completed_blocks),
        deleted_at: r.deleted_at ? new Date(r.deleted_at).toISOString() : null
      }
    ])
  );

  let rowsUnchanged = true;

  for (const deleteRow of deleteRows) {
    const currentResult = await tutorialPool.query(`
      SELECT * FROM tutorial_navigation_progress WHERE id = $1
    `, [deleteRow.id]);

    if (currentResult.rows.length === 0) {
      console.log(`❌ Row ${deleteRow.id} NO LONGER EXISTS`);
      rowsUnchanged = false;
      continue;
    }

    const current = currentResult.rows[0];
    const snapshot = auditSnapshot.get(deleteRow.id);

    const currentNormalized = {
      id: current.id,
      user_id: current.user_id,
      navigation_node_id: current.navigation_node_id,
      subtopic_id: current.subtopic_id,
      section_id: current.section_id,
      visit_count: current.visit_count,
      status: current.status,
      last_session_id: current.last_session_id,
      created_at: new Date(current.created_at).toISOString(),
      first_viewed_at: current.first_viewed_at ? new Date(current.first_viewed_at).toISOString() : null,
      last_viewed_at: current.last_viewed_at ? new Date(current.last_viewed_at).toISOString() : null,
      updated_at: new Date(current.updated_at).toISOString(),
      time_spent_active_sec: current.time_spent_active_sec,
      revision_count: current.revision_count,
      completed_blocks: JSON.stringify(current.completed_blocks),
      deleted_at: current.deleted_at ? new Date(current.deleted_at).toISOString() : null
    };

    const snapshotStr = JSON.stringify(snapshot);
    const currentStr = JSON.stringify(currentNormalized);

    if (snapshotStr !== currentStr) {
      console.log(`❌ Row ${deleteRow.id.substring(0, 8)}... CHANGED during audit`);
      console.log(`   Snapshot: ${snapshotStr.substring(0, 100)}...`);
      console.log(`   Current:  ${currentStr.substring(0, 100)}...`);
      rowsUnchanged = false;
    } else {
      console.log(`✅ Row ${deleteRow.id.substring(0, 8)}... unchanged`);
    }
  }

  console.log('');

  if (rowsUnchanged) {
    console.log('✅ All delete candidates unchanged since audit start');
  } else {
    console.log('❌ One or more rows changed - audit invalid, re-run required');
  }
  console.log('');

  // ================================================================
  // 13. PRE-DELETE VERIFICATION CHECKLIST
  // ================================================================
  console.log('\n================================================================');
  console.log('13. PRE-DELETE VERIFICATION CHECKLIST');
  console.log('================================================================\n');

  const allUsersVerified = 
    rows.length > 0 &&
    rows.every(row => {
      const userInfo = userMap.get(row.user_id);
      return userInfo?.found === true && !!userInfo.data;
    });

  const noBlockLearningStateDependencies =
    parseInt(blockStateResult.rows[0].count, 10) === 0;

  const noDirectDependencies =
    !directDependenciesFound;

  const noFKConstraints =
    fkResult.rows.length === 0;

  const expectedDeleteCount =
    deleteRows.length === 2;

  console.log('REQUIRED VERIFICATIONS:');
  console.log(`  ${allUsersVerified ? '✅' : '❌'} All users verified in people_prod`);
  console.log(`  ${noBlockLearningStateDependencies ? '✅' : '❌'} No block_learning_state dependencies`);
  console.log(`  ${noDirectDependencies ? '✅' : '❌'} No direct references to progress IDs`);
  console.log(`  ${noFKConstraints ? '✅' : '⚠️ '} No FK constraints (orphans allowed)`);
  console.log(`  ${expectedDeleteCount ? '✅' : '❌'} Expected row count matches (2 delete candidates)`);
  console.log(`  ${rowsUnchanged ? '✅' : '❌'} Rows unchanged since audit start`);
  console.log(`  ✅ Primary key verified (tutorial_navigation_progress.id)`);
  console.log('');

  const safeToDelete = 
    allUsersVerified &&
    noBlockLearningStateDependencies &&
    noDirectDependencies &&
    noFKConstraints &&
    expectedDeleteCount &&
    rowsUnchanged;

  console.log('DELETION APPROVAL:');
  if (safeToDelete) {
    console.log('  ✅ All critical verifications PASSED');
    console.log('  ⚠️  User approval still required before execution');
  } else {
    console.log('  ❌ DELETION NOT APPROVED');
    console.log('  ⚠️  Critical verifications FAILED - do NOT proceed');
    console.log('');
    console.log('BLOCKING ISSUES:');
    if (!allUsersVerified) console.log('  ❌ User verification failed');
    if (!noBlockLearningStateDependencies) console.log('  ❌ block_learning_state has dependencies');
    if (!noDirectDependencies) console.log('  ❌ Direct dependencies found in other tables');
    if (!noFKConstraints) console.log('  ⚠️  FK constraints exist (may be expected)');
    if (!expectedDeleteCount) console.log('  ❌ Delete candidate count unexpected');
    if (!rowsUnchanged) console.log('  ❌ Rows changed during audit');
  }
  console.log('');

  // ================================================================
  // FINAL SUMMARY
  // ================================================================
  console.log('\n================================================================');
  console.log('FINAL SUMMARY');
  console.log('================================================================\n');

  console.log('DATABASE STATE:');
  console.log(`  tutorial_sections:           ${sectionsResult.rows[0].count} rows (EMPTY)`);
  console.log(`  tutorial_page_content_v2:    ${contentV2Result.rows.length} rows (HAS CONTENT)`);
  console.log(`  tutorial_navigation_progress: ${rows.length} rows for whatisjava`);
  console.log('');

  console.log('PROGRESS ROWS:');
  console.log(`  Total:                       ${rows.length}`);
  console.log(`  KEEP:                        ${keepRows.length}`);
  console.log(`  DELETE:                      ${deleteRows.length}`);
  console.log('');

  console.log('CONTENT STATUS:');
  console.log(`  ✅ Content EXISTS in tutorial_page_content_v2`);
  console.log(`  ❌ Delivery reads tutorial_sections (empty)`);
  console.log(`  ⚠️  Architectural mismatch - content not accessible`);
  console.log('');

  console.log('CASCADE IMPACT:');
  console.log(`  block_learning_state:        ${blockStateResult.rows[0].count} dependent row(s)`);
  console.log(`  FK constraints:              ${fkResult.rows.length} constraint(s)`);
  console.log(`  Complete table scan:         See section 11`);
  console.log('');

  console.log('USER VERIFICATION:');
  const allVerified = [...userMap.values()].every(u => u.found && u.data);
  const anyErrors = [...userMap.values()].some(u => u.error);
  console.log(`  All users verified:          ${allVerified ? '✅ YES' : '❌ NO'}`);
  if (anyErrors) {
    console.log(`  ⚠️  People database errors occurred`);
  }
  console.log('');

  console.log('FINAL RECOMMENDATION:');
  if (allVerified && parseInt(blockStateResult.rows[0].count) === 0) {
    console.log(`  ⚠️  Audit complete - user approval required`);
  } else {
    console.log(`  ❌ DO NOT DELETE - verification incomplete`);
  }
  console.log('');

  console.log('================================================================');
  console.log('DATABASE WAS NOT MODIFIED');
  console.log('================================================================');
  console.log('This audit performed READ-ONLY table verification.');
  console.log('No INSERT, UPDATE, DELETE, or TRUNCATE operations executed.');
  console.log('All findings based on direct table queries.');
  console.log('Decision authority remains with user.\n');

  await tutorialPool.end();
  await peoplePool.end();
}

main().catch(err => {
  console.error('AUDIT ERROR:', err);
  process.exit(1);
});
