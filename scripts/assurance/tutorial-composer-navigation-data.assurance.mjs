#!/usr/bin/env node

/**
 * Phase 2 — Navigation Data Diagnostic
 * 
 * READ-ONLY diagnostic to understand how navigation nodes are stored
 * in tutorial_sidebar_trees_v2.tree JSONB.
 * 
 * CRITICAL: Do NOT create a navigation_nodes table.
 * Navigation data already exists in sidebar tree JSON.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const mainPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const tutorialPool = new Pool({
  connectionString: process.env.DATABASE_URL_TUTORIAL,
});

const failures = [];

function pass(message) {
  console.log(`✅ [PASS] ${message}`);
}

function fail(message) {
  console.error(`❌ [FAIL] ${message}`);
  failures.push(message);
}

function info(message) {
  console.log(`[INFO] ${message}`);
}

async function main() {
  console.log('');
  console.log('='.repeat(70));
  console.log('PHASE 2 — NAVIGATION DATA DIAGNOSTIC');
  console.log('='.repeat(70));
  console.log('');

  try {
    // ------------------------------------------------------------
    // STEP 1 — Resolve authoritative quiz DB hierarchy
    // ------------------------------------------------------------
    info('Step 1: Resolving Full Stack Development hierarchy');
    console.log('');

    const hierarchyResult = await mainPool.query(`
      SELECT
        d.id AS domain_id,
        d.name AS domain_name,
        s.id AS subject_id,
        s.name AS subject_name,
        t.id AS topic_id,
        t.name AS topic_name,
        st.id AS subtopic_id,
        st.name AS subtopic_name
      FROM domains d
      JOIN subjects s
        ON s.domain_id = d.id
      JOIN topics t
        ON t.subject_id = s.id
      JOIN subtopics st
        ON st.topic_id = t.id
      WHERE d.name = 'Full Stack Development'
        AND s.name = 'Backend Development'
        AND t.name = 'Java'
        AND st.name = 'What is Java?'
        AND d.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND st.deleted_at IS NULL
      LIMIT 1
    `);

    if (hierarchyResult.rows.length === 0) {
      fail('Expected Java hierarchy was not found');
      return;
    }

    const hierarchy = hierarchyResult.rows[0];

    pass('Full Stack Development hierarchy resolved');

    console.log('');
    console.log('Hierarchy:');
    console.log(`  Domain:    ${hierarchy.domain_name}`);
    console.log(`  Subject:   ${hierarchy.subject_name}`);
    console.log(`  Topic:     ${hierarchy.topic_name}`);
    console.log(`  Subtopic:  ${hierarchy.subtopic_name}`);
    console.log('');
    console.log('IDs:');
    console.log(`  subtopicId: ${hierarchy.subtopic_id}`);
    console.log(`  topicId:    ${hierarchy.topic_id}`);
    console.log('');

    // ------------------------------------------------------------
    // STEP 2 — Verify tutorial_sidebar_trees_v2 exists
    // ------------------------------------------------------------
    info('Step 2: Checking tutorial_sidebar_trees_v2 table');
    console.log('');

    const tableResult = await tutorialPool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'tutorial_sidebar_trees_v2'
      ) AS exists
    `);

    if (!tableResult.rows[0].exists) {
      fail('tutorial_sidebar_trees_v2 does not exist in tutorial database');
      return;
    }

    pass('tutorial_sidebar_trees_v2 exists');
    console.log('');

    // ------------------------------------------------------------
    // STEP 3 — Find sidebar tree for exact hierarchy
    // ------------------------------------------------------------
    info('Step 3: Finding sidebar tree for Java/What is Java?');
    console.log('');

    const treeResult = await tutorialPool.query(`
      SELECT
        id,
        brand_id,
        domain_id,
        subject_id,
        topic_id,
        active_subtopic_id,
        tree,
        status,
        version,
        updated_at
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = $1
        AND active_subtopic_id = $2
        AND brand_id = 'shared'
      ORDER BY version DESC, updated_at DESC
      LIMIT 1
    `, [
      hierarchy.topic_id,
      hierarchy.subtopic_id,
    ]);

    if (treeResult.rows.length === 0) {
      fail(
        'No tutorial_sidebar_trees_v2 row found for the selected topic/subtopic'
      );
      console.log('');
      console.log('This means navigation data has not been generated for this hierarchy yet.');
      return;
    }

    pass('Sidebar tree resolved');

    const treeRow = treeResult.rows[0];

    console.log('');
    console.log('Sidebar tree metadata:');
    console.log(`  tree id:             ${treeRow.id}`);
    console.log(`  brand:               ${treeRow.brand_id}`);
    console.log(`  topic_id:            ${treeRow.topic_id}`);
    console.log(`  active_subtopic_id:  ${treeRow.active_subtopic_id}`);
    console.log(`  status:              ${treeRow.status}`);
    console.log(`  version:             ${treeRow.version}`);
    console.log(`  updated_at:          ${treeRow.updated_at}`);
    console.log('');

    // ------------------------------------------------------------
    // STEP 4 — Inspect JSON tree
    // ------------------------------------------------------------
    info('Step 4: Inspecting JSONB tree structure');
    console.log('');

    const tree = treeRow.tree;

    if (!tree || typeof tree !== 'object') {
      fail('tutorial_sidebar_trees_v2.tree is empty or invalid');
      return;
    }

    pass('Sidebar tree JSONB is readable');

    console.log('');
    console.log('Top-level tree shape:');
    if (Array.isArray(tree)) {
      console.log(`  Type: Array`);
      console.log(`  Length: ${tree.length}`);
      console.log('  First 3 items:');
      console.log(JSON.stringify(tree.slice(0, 3), null, 2));
    } else {
      console.log(`  Type: Object`);
      console.log(`  Keys: ${Object.keys(tree).join(', ')}`);
      console.log('  Sample:');
      console.log(JSON.stringify(tree, null, 2).substring(0, 500) + '...');
    }
    console.log('');

    // ------------------------------------------------------------
    // STEP 5 — Recursively discover navigation-like nodes
    // ------------------------------------------------------------
    info('Step 5: Discovering navigation node candidates');
    console.log('');

    const candidates = [];

    function walk(value, path = '$') {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          walk(item, `${path}[${index}]`);
        });
        return;
      }

      if (!value || typeof value !== 'object') {
        return;
      }

      const id =
        typeof value.id === 'string'
          ? value.id
          : null;

      const name =
        typeof value.name === 'string'
          ? value.name
          : null;

      const type =
        typeof value.type === 'string'
          ? value.type
          : null;

      const slug =
        typeof value.slug === 'string'
          ? value.slug
          : null;

      if (id && (name || type || slug)) {
        candidates.push({
          id,
          name,
          type,
          slug,
          path,
          keys: Object.keys(value),
        });
      }

      for (const [key, child] of Object.entries(value)) {
        walk(child, `${path}.${key}`);
      }
    }

    walk(tree);

    console.log(`Candidate navigation objects found: ${candidates.length}`);
    console.log('');

    if (candidates.length === 0) {
      fail(
        'No navigation-like objects could be discovered in tutorial_sidebar_trees_v2.tree'
      );
      console.log('');
      console.log('This indicates the sidebar tree may need to be regenerated or the JSON structure is unexpected.');
      return;
    }

    pass('Navigation objects exist inside sidebar tree JSON');
    console.log('');

    console.log('First 10 candidates:');
    candidates.slice(0, 10).forEach((candidate, index) => {
      console.log('');
      console.log(`Candidate ${index + 1}:`);
      console.log(`  id:   ${candidate.id}`);
      console.log(`  name: ${candidate.name || '(none)'}`);
      console.log(`  type: ${candidate.type || '(none)'}`);
      console.log(`  slug: ${candidate.slug || '(none)'}`);
      console.log(`  path: ${candidate.path}`);
      console.log(`  keys: ${candidate.keys.join(', ')}`);
    });

    console.log('');
    console.log('='.repeat(70));
    console.log('');

    if (failures.length === 0) {
      console.log('✅ NAVIGATION DATA DIAGNOSTIC PASS');
      console.log('');
      console.log('Key findings:');
      console.log('  1. Navigation nodes ARE stored in tutorial_sidebar_trees_v2.tree');
      console.log('  2. Do NOT create a navigation_nodes database table');
      console.log(`  3. Found ${candidates.length} candidate navigation objects in JSON`);
      console.log('');
      console.log('Next step:');
      console.log('  Audit /api/tutorial-left-sidebar/navigation-nodes route');
      console.log('  to ensure it correctly extracts nodes from the sidebar tree JSONB');
      console.log('');
      process.exitCode = 0;
    } else {
      console.error('❌ NAVIGATION DATA DIAGNOSTIC FAILED');
      console.error('');
      failures.forEach((failure) => {
        console.error(`  - ${failure}`);
      });
      console.error('');
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('');
    console.error('❌ Fatal diagnostic error');
    console.error(error.message);
    if (error.stack) {
      console.error('');
      console.error(error.stack);
    }
    process.exitCode = 1;
  } finally {
    await mainPool.end();
    await tutorialPool.end();
  }
}

main();
