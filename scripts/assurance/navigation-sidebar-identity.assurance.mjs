#!/usr/bin/env node

/**
 * Phase 2 — Sidebar Navigation Identity Assurance
 *
 * READ-ONLY.
 *
 * Purpose:
 *   Prove which identifiers tutorial_sidebar_trees_v2 actually uses.
 *
 * CRITICAL:
 *   Do not modify database data.
 *   Do not create navigation_nodes.
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

const MAIN_SUBTOPIC_ID =
  '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

const BRAND_ID = 'shared';

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
  console.log('='.repeat(72));
  console.log('PHASE 2 — SIDEBAR NAVIGATION IDENTITY ASSURANCE');
  console.log('='.repeat(72));
  console.log('');

  try {
    // ------------------------------------------------------------
    // 1. Resolve authoritative main-database hierarchy
    // ------------------------------------------------------------

    info('Step 1: Resolve authoritative main-database hierarchy');
    console.log('');

    const hierarchyResult = await mainPool.query(
      `
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
      WHERE st.id = $1
        AND d.deleted_at IS NULL
        AND s.deleted_at IS NULL
        AND t.deleted_at IS NULL
        AND st.deleted_at IS NULL
      LIMIT 1
      `,
      [MAIN_SUBTOPIC_ID]
    );

    if (hierarchyResult.rows.length !== 1) {
      fail(
        `Expected exactly one main-database subtopic, found ${hierarchyResult.rows.length}`
      );
      return;
    }

    const hierarchy = hierarchyResult.rows[0];

    pass('Main-database hierarchy resolved');

    console.log('');
    console.log('Main database IDs:');
    console.log(`  domainId:    ${hierarchy.domain_id}`);
    console.log(`  subjectId:   ${hierarchy.subject_id}`);
    console.log(`  topicId:     ${hierarchy.topic_id}`);
    console.log(`  subtopicId:  ${hierarchy.subtopic_id}`);
    console.log('');

    // ------------------------------------------------------------
    // 2. Resolve tutorial-subtopic replica
    // ------------------------------------------------------------

    info('Step 2: Resolve tutorial_subtopics replica');
    console.log('');

    const tutorialSubtopicResult = await tutorialPool.query(
      `
      SELECT
        id,
        external_id,
        topic_id,
        name,
        slug
      FROM tutorial_subtopics
      WHERE external_id = $1
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [MAIN_SUBTOPIC_ID]
    );

    if (tutorialSubtopicResult.rows.length !== 1) {
      fail(
        `Expected exactly one tutorial_subtopics replica, found ${tutorialSubtopicResult.rows.length}`
      );
      return;
    }

    const tutorialSubtopic = tutorialSubtopicResult.rows[0];

    pass('Tutorial subtopic replica resolved');

    console.log('');
    console.log('Tutorial replica:');
    console.log(`  internal id:  ${tutorialSubtopic.id}`);
    console.log(`  external_id:  ${tutorialSubtopic.external_id}`);
    console.log(`  topic_id:     ${tutorialSubtopic.topic_id}`);
    console.log(`  name:         ${tutorialSubtopic.name}`);
    console.log('');

    // ------------------------------------------------------------
    // 3. Query sidebar tree using MAIN IDs
    // ------------------------------------------------------------

    info('Step 3: Query sidebar tree using authoritative main IDs');
    console.log('');

    const mainIdTreeResult = await tutorialPool.query(
      `
      SELECT
        id,
        brand_id,
        domain_id,
        subject_id,
        topic_id,
        active_subtopic_id,
        status,
        version,
        updated_at,
        tree
      FROM tutorial_sidebar_trees_v2
      WHERE brand_id = $1
        AND topic_id = $2
        AND active_subtopic_id = $3
      ORDER BY version DESC, updated_at DESC
      LIMIT 1
      `,
      [
        BRAND_ID,
        hierarchy.topic_id,
        hierarchy.subtopic_id,
      ]
    );

    console.log(
      `Rows using MAIN topic/subtopic IDs: ${mainIdTreeResult.rows.length}`
    );

    if (mainIdTreeResult.rows.length !== 1) {
      fail(
        'Sidebar tree was not found using main topic_id + main subtopic_id'
      );
    } else {
      pass(
        'Sidebar tree resolves using main topic_id + main subtopic_id'
      );

      const row = mainIdTreeResult.rows[0];

      console.log('');
      console.log('Sidebar tree identity:');
      console.log(`  tree id:             ${row.id}`);
      console.log(`  brand_id:            ${row.brand_id}`);
      console.log(`  topic_id:            ${row.topic_id}`);
      console.log(`  active_subtopic_id:  ${row.active_subtopic_id}`);
      console.log(`  status:              ${row.status}`);
      console.log(`  version:             ${row.version}`);
      console.log('');

      // ----------------------------------------------------------
      // 4. Inspect actual page nodes
      // ----------------------------------------------------------

      const nodes = [];

      function walk(value) {
        if (Array.isArray(value)) {
          for (const item of value) {
            walk(item);
          }
          return;
        }

        if (!value || typeof value !== 'object') {
          return;
        }

        if (
          value.type === 'page' &&
          typeof value.id === 'string' &&
          typeof value.name === 'string'
        ) {
          nodes.push({
            id: value.id,
            name: value.name,
            slug:
              typeof value.slug === 'string'
                ? value.slug
                : '',
          });
        }

        if (Array.isArray(value.children)) {
          walk(value.children);
        }

        for (const [key, child] of Object.entries(value)) {
          if (key !== 'children') {
            walk(child);
          }
        }
      }

      walk(row.tree);

      console.log(`Navigation page nodes found: ${nodes.length}`);

      if (nodes.length === 0) {
        fail('Sidebar tree contains no page nodes');
      } else {
        pass(`Sidebar tree contains ${nodes.length} page nodes`);

        console.log('');
        console.log('First 10 navigation nodes:');

        nodes.slice(0, 10).forEach((node, index) => {
          console.log(
            `  ${index + 1}. ${node.name} | id=${node.id} | slug=${node.slug}`
          );
        });
      }
    }

    // ------------------------------------------------------------
    // 5. Query sidebar tree using TUTORIAL internal IDs
    // ------------------------------------------------------------

    info('');
    info('Step 5: Prove tutorial-local IDs are NOT sidebar-tree identity');
    console.log('');

    const internalIdTreeResult = await tutorialPool.query(
      `
      SELECT id
      FROM tutorial_sidebar_trees_v2
      WHERE brand_id = $1
        AND topic_id = $2
        AND active_subtopic_id = $3
      LIMIT 1
      `,
      [
        BRAND_ID,
        tutorialSubtopic.topic_id,
        tutorialSubtopic.id,
      ]
    );

    console.log(
      `Rows using tutorial internal topic/subtopic IDs: ${internalIdTreeResult.rows.length}`
    );

    if (internalIdTreeResult.rows.length === 0) {
      pass(
        'Tutorial-local IDs are not used by the existing sidebar tree'
      );
    } else {
      fail(
        'Unexpected sidebar tree found using tutorial-local IDs; identity model needs further investigation'
      );
    }

    console.log('');
    console.log('='.repeat(72));
    console.log('');

    if (failures.length === 0) {
      console.log('✅ SIDEBAR NAVIGATION IDENTITY ASSURANCE PASS');
      console.log('');
      console.log('Authoritative finding:');
      console.log(
        '  tutorial_sidebar_trees_v2 uses main/quiz topic_id and subtopic_id values'
      );
      console.log('');
      console.log(
        'Required API mapping:'
      );
      console.log(
        '  subtopicId (main ID)'
      );
      console.log(
        '      ↓'
      );
      console.log(
        '  resolve main topicId'
      );
      console.log(
        '      ↓'
      );
      console.log(
        '  tutorial_sidebar_trees_v2.topic_id = main topicId'
      );
      console.log(
        '  tutorial_sidebar_trees_v2.active_subtopic_id = main subtopicId'
      );
      console.log('');
      console.log('Do NOT use tutorial_subtopics.id for sidebar lookup.');
      console.log('');

      process.exitCode = 0;
    } else {
      console.error('❌ SIDEBAR NAVIGATION IDENTITY ASSURANCE FAILED');
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
