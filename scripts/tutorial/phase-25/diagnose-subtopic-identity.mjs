#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 2.5-F: SUBTOPIC IDENTITY DIAGNOSTIC
 * ============================================================
 *
 * PURPOSE
 * -------
 * Investigate the subtopic ID mismatch between:
 * - Composer/Navigation: 12efacf1-b5ad-4b43-9fe4-17ba1cf249e4
 * - Tutorial Section:    414f63eb-cccf-4bd1-bcc0-b52df69ce499
 *
 * Both claim to be "What is Java?" but are different UUIDs.
 *
 * INVESTIGATION
 * -------------
 * 1. Find both subtopic rows in curriculum database
 * 2. Find navigation nodes for both
 * 3. Find tutorial sections for both
 * 4. Determine which is authoritative
 * 5. Identify source of mismatch
 *
 * ============================================================
 */

import { config } from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '../../..');

config({
  path: path.join(PROJECT_ROOT, '.env.local'),
});

const { Client } = pg;

const SUBTOPIC_A = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'; // From Composer
const SUBTOPIC_B = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'; // From tutorial_sections
const NAVIGATION_NODE = 'whatisjava';
const SECTION_ID = '5326eeb6-c4c8-4218-9687-2b46f94a9bb4';

function printHeader(title) {
  console.log('');
  console.log('='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

function printField(label, value) {
  console.log(`${label.padEnd(30)} ${value ?? 'NULL'}`);
}

async function main() {
  printHeader('PHASE 2.5-F: SUBTOPIC IDENTITY DIAGNOSTIC');

  console.log('');
  console.log('INVESTIGATING TWO SUBTOPIC UUIDs:');
  console.log('');
  printField('SUBTOPIC A (Composer):', SUBTOPIC_A);
  printField('SUBTOPIC B (Tutorial DB):', SUBTOPIC_B);
  printField('Navigation Node:', NAVIGATION_NODE);
  printField('Section ID:', SECTION_ID);

  // Connect to curriculum database (main database)
  const curriculumClient = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  // Connect to tutorial database
  const tutorialClient = new Client({
    connectionString: process.env.DATABASE_URL_TUTORIAL,
  });

  try {
    await curriculumClient.connect();
    await tutorialClient.connect();

    // ============================================================
    // STEP 1: Find both subtopic rows in curriculum
    // ============================================================
    printHeader('STEP 1: CURRICULUM SUBTOPIC ROWS');

    const subtopicQuery = `
      SELECT
        s.id,
        s.name,
        s.topic_id,
        t.name AS topic_name,
        sub.name AS subject_name,
        d.name AS domain_name
      FROM subtopics s
      LEFT JOIN topics t ON s.topic_id = t.id
      LEFT JOIN subjects sub ON t.subject_id = sub.id
      LEFT JOIN domains d ON sub.domain_id = d.id
      WHERE s.id = ANY($1)
        AND s.deleted_at IS NULL
      ORDER BY s.name
    `;

    const subtopicsResult = await curriculumClient.query(subtopicQuery, [
      [SUBTOPIC_A, SUBTOPIC_B],
    ]);

    console.log('');
    console.log(`Found ${subtopicsResult.rows.length} subtopic(s):`);
    console.log('');

    for (const row of subtopicsResult.rows) {
      console.log(`Subtopic: ${row.name}`);
      printField('  ID:', row.id);
      printField('  Topic:', `${row.topic_name}`);
      printField('  Subject:', row.subject_name);
      printField('  Domain:', row.domain_name);
      console.log('');
    }

    // ============================================================
    // STEP 2: Find navigation nodes for both subtopics
    // ============================================================
    printHeader('STEP 2: NAVIGATION NODES');

    const navQuery = `
      SELECT
        id,
        name,
        subtopic_id,
        type,
        order_index
      FROM tutorial_navigation_nodes
      WHERE subtopic_id = ANY($1)
        AND brand_id = 'shared'
        AND deleted_at IS NULL
      ORDER BY subtopic_id, order_index
    `;

    const navResult = await tutorialClient.query(navQuery, [
      [SUBTOPIC_A, SUBTOPIC_B],
    ]);

    console.log('');
    console.log(`Found ${navResult.rows.length} navigation node(s):`);
    console.log('');

    for (const row of navResult.rows) {
      console.log(`Navigation Node: ${row.name}`);
      printField('  ID:', row.id);
      printField('  Subtopic ID:', row.subtopic_id);
      printField('  Type:', row.type);
      printField('  Order:', row.order_index);
      
      if (row.id === NAVIGATION_NODE) {
        console.log('  ✅ THIS IS THE TARGET NAVIGATION NODE');
      }
      console.log('');
    }

    // ============================================================
    // STEP 3: Find tutorial sections for both subtopics
    // ============================================================
    printHeader('STEP 3: TUTORIAL SECTIONS');

    const sectionQuery = `
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        version,
        published_at,
        jsonb_array_length(
          content::jsonb -> 'blocks'
        ) AS block_count,
        content::jsonb -> 'blocks' -> 0 ->> 'type' AS first_block_type,
        content::jsonb -> 'blocks' -> 0 ->> 'version' AS first_block_version
      FROM tutorial_sections
      WHERE subtopic_id = ANY($1)
        AND brand_id = 'shared'
        AND deleted_at IS NULL
      ORDER BY subtopic_id, navigation_node_id
    `;

    const sectionResult = await tutorialClient.query(sectionQuery, [
      [SUBTOPIC_A, SUBTOPIC_B],
    ]);

    console.log('');
    console.log(`Found ${sectionResult.rows.length} tutorial section(s):`);
    console.log('');

    for (const row of sectionResult.rows) {
      console.log(`Section: ${row.id}`);
      printField('  Subtopic ID:', row.subtopic_id);
      printField('  Navigation Node:', row.navigation_node_id);
      printField('  Status:', row.status);
      printField('  Version:', row.version);
      printField('  Published:', row.published_at);
      printField('  Block Count:', row.block_count);
      printField('  First Block:', `${row.first_block_type} ${row.first_block_version}`);
      
      if (row.id === SECTION_ID) {
        console.log('  ✅ THIS IS THE TARGET SECTION');
      }
      console.log('');
    }

    // ============================================================
    // STEP 4: Analyze the target section specifically
    // ============================================================
    printHeader('STEP 4: TARGET SECTION ANALYSIS');

    const targetQuery = `
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        version,
        published_at
      FROM tutorial_sections
      WHERE id = $1
    `;

    const targetResult = await tutorialClient.query(targetQuery, [SECTION_ID]);

    if (targetResult.rows.length === 0) {
      console.error('');
      console.error('❌ TARGET SECTION NOT FOUND');
      process.exitCode = 1;
      return;
    }

    const target = targetResult.rows[0];

    console.log('');
    console.log('Target Section:');
    printField('  Section ID:', target.id);
    printField('  Subtopic ID:', target.subtopic_id);
    printField('  Navigation Node:', target.navigation_node_id);
    printField('  Status:', target.status);

    // ============================================================
    // STEP 5: Determine authoritative subtopic
    // ============================================================
    printHeader('STEP 5: IDENTITY ANALYSIS');

    console.log('');
    console.log('QUESTION: Which subtopic is authoritative?');
    console.log('');

    const subtopicA = subtopicsResult.rows.find((r) => r.id === SUBTOPIC_A);
    const subtopicB = subtopicsResult.rows.find((r) => r.id === SUBTOPIC_B);

    const navForA = navResult.rows.filter((r) => r.subtopic_id === SUBTOPIC_A);
    const navForB = navResult.rows.filter((r) => r.subtopic_id === SUBTOPIC_B);

    const sectionsForA = sectionResult.rows.filter(
      (r) => r.subtopic_id === SUBTOPIC_A
    );
    const sectionsForB = sectionResult.rows.filter(
      (r) => r.subtopic_id === SUBTOPIC_B
    );

    const targetNavNode = navResult.rows.find((r) => r.id === NAVIGATION_NODE);

    console.log(`SUBTOPIC A (${SUBTOPIC_A}):`);
    printField('  Exists in curriculum:', subtopicA ? 'YES' : 'NO');
    printField('  Navigation nodes:', navForA.length);
    printField('  Tutorial sections:', sectionsForA.length);
    printField(
      '  Has target nav node:',
      targetNavNode?.subtopic_id === SUBTOPIC_A ? 'YES' : 'NO'
    );
    printField(
      '  Has target section:',
      target.subtopic_id === SUBTOPIC_A ? 'YES' : 'NO'
    );

    console.log('');
    console.log(`SUBTOPIC B (${SUBTOPIC_B}):`);
    printField('  Exists in curriculum:', subtopicB ? 'YES' : 'NO');
    printField('  Navigation nodes:', navForB.length);
    printField('  Tutorial sections:', sectionsForB.length);
    printField(
      '  Has target nav node:',
      targetNavNode?.subtopic_id === SUBTOPIC_B ? 'YES' : 'NO'
    );
    printField(
      '  Has target section:',
      target.subtopic_id === SUBTOPIC_B ? 'YES' : 'NO'
    );

    // ============================================================
    // STEP 6: Final diagnosis
    // ============================================================
    printHeader('STEP 6: DIAGNOSIS');

    console.log('');

    if (!targetNavNode) {
      console.error('❌ CRITICAL: Navigation node "whatisjava" not found!');
      process.exitCode = 1;
      return;
    }

    const navSubtopicId = targetNavNode.subtopic_id;
    const sectionSubtopicId = target.subtopic_id;

    if (navSubtopicId === sectionSubtopicId) {
      console.log('✅ Navigation node and tutorial section MATCH');
      printField('  Shared subtopic:', navSubtopicId);
    } else {
      console.log('❌ IDENTITY MISMATCH DETECTED');
      console.log('');
      printField('  Navigation node subtopic:', navSubtopicId);
      printField('  Tutorial section subtopic:', sectionSubtopicId);
      console.log('');
      console.log('ROOT CAUSE:');
      console.log(
        'The navigation node and tutorial section point to different subtopics.'
      );
      console.log('');
      console.log('FIX OPTIONS:');
      console.log(
        '1. Update tutorial_sections.subtopic_id to match navigation node'
      );
      console.log(
        '2. Update navigation node subtopic_id to match tutorial section'
      );
      console.log('3. Investigate why two subtopic rows exist for "What is Java?"');
      console.log('');
      console.log('RECOMMENDATION:');
      console.log(
        'The navigation node is the source of truth for page routing.'
      );
      console.log(
        'Update tutorial_sections.subtopic_id to match the navigation node.'
      );

      process.exitCode = 1;
    }
  } catch (error) {
    console.error('');
    console.error('❌ DIAGNOSTIC FAILED');
    console.error('');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await curriculumClient.end();
    await tutorialClient.end();
  }
}

main();
