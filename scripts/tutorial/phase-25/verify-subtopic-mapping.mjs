#!/usr/bin/env node

/**
 * ============================================================
 * PHASE 2.5-F: VERIFY CROSS-DATABASE SUBTOPIC MAPPING
 * ============================================================
 *
 * PURPOSE
 * -------
 * Verify whether 414f63eb... is a legitimate Tutorial DB
 * subtopic that correctly maps to curriculum subtopic 12efacf1...
 * via the external_id relationship.
 *
 * ARCHITECTURE
 * ------------
 * Curriculum DB:
 *   subtopics.id = 12efacf1... (curriculum identity)
 *         ↓
 * Tutorial DB:
 *   tutorial_subtopics.external_id = 12efacf1...
 *   tutorial_subtopics.id = 414f63eb... (tutorial identity)
 *         ↓
 *   tutorial_sections.subtopic_id = 414f63eb...
 *
 * If this mapping exists, the current state is CORRECT.
 * If it doesn't exist, the seed bypassed the mapping.
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

config({ path: path.join(PROJECT_ROOT, '.env.local') });

const { Client } = pg;

const CURRICULUM_SUBTOPIC_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const TUTORIAL_SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
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
  printHeader('PHASE 2.5-F: CROSS-DATABASE SUBTOPIC MAPPING VERIFICATION');

  console.log('');
  console.log('TESTING HYPOTHESIS:');
  console.log('The two subtopic IDs are SUPPOSED to be different because');
  console.log('one is curriculum identity and one is tutorial identity,');
  console.log('linked via tutorial_subtopics.external_id mapping.');
  console.log('');
  printField('Curriculum subtopic:', CURRICULUM_SUBTOPIC_ID);
  printField('Tutorial subtopic:', TUTORIAL_SUBTOPIC_ID);

  const curriculumDb = new Client({ connectionString: process.env.DATABASE_URL });
  const tutorialDb = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    await curriculumDb.connect();
    await tutorialDb.connect();

    // ============================================================
    // STEP 1: Verify curriculum subtopic exists
    // ============================================================
    printHeader('STEP 1: CURRICULUM SUBTOPIC');

    const curriculumResult = await curriculumDb.query(
      `SELECT id, name, topic_id
       FROM subtopics
       WHERE id = $1 AND deleted_at IS NULL`,
      [CURRICULUM_SUBTOPIC_ID]
    );

    if (curriculumResult.rows.length === 0) {
      console.error('');
      console.error('❌ Curriculum subtopic not found!');
      process.exitCode = 1;
      return;
    }

    const curriculumSubtopic = curriculumResult.rows[0];
    console.log('');
    printField('ID:', curriculumSubtopic.id);
    printField('Name:', curriculumSubtopic.name);
    printField('Topic ID:', curriculumSubtopic.topic_id);
    console.log('  ✅ Exists in curriculum');

    // ============================================================
    // STEP 2: Check if tutorial_subtopics table exists and has mapping
    // ============================================================
    printHeader('STEP 2: TUTORIAL_SUBTOPICS MAPPING TABLE');

    const tableCheck = await tutorialDb.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'tutorial_subtopics'
      ) as exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('');
      console.log('⚠️  tutorial_subtopics table does NOT exist');
      console.log('');
      console.log('This means there is NO cross-database mapping layer.');
      console.log('The architecture expects tutorial_sections.subtopic_id');
      console.log('to directly reference curriculum subtopics.id');
      console.log('');
      console.log('CONCLUSION: tutorial_sections.subtopic_id should be');
      console.log('            12efacf1... (curriculum ID)');
      console.log('            NOT 414f63eb... (unknown ID)');
      process.exitCode = 1;
      return;
    }

    console.log('');
    console.log('✅ tutorial_subtopics table exists');

    // ============================================================
    // STEP 3: Check for external_id mapping
    // ============================================================
    printHeader('STEP 3: CHECK EXTERNAL_ID MAPPING');

    const mappingResult = await tutorialDb.query(
      `SELECT id, external_id, name, slug
       FROM tutorial_subtopics
       WHERE external_id = $1 AND deleted_at IS NULL`,
      [CURRICULUM_SUBTOPIC_ID]
    );

    if (mappingResult.rows.length === 0) {
      console.log('');
      console.log('❌ NO mapping found for curriculum subtopic');
      console.log('');
      console.log(`   external_id = ${CURRICULUM_SUBTOPIC_ID}`);
      console.log('   does NOT exist in tutorial_subtopics');
      console.log('');
      console.log('DIAGNOSIS: The tutorial_subtopics table exists but');
      console.log('           the curriculum subtopic has not been synced.');
      console.log('');
      console.log('FIX: Either:');
      console.log('     1. Sync curriculum subtopic to tutorial_subtopics');
      console.log('     2. Update section to use an existing tutorial_subtopics.id');
      process.exitCode = 1;
      return;
    }

    const tutorialSubtopic = mappingResult.rows[0];
    console.log('');
    console.log('✅ Found mapping:');
    printField('  Tutorial subtopic ID:', tutorialSubtopic.id);
    printField('  External ID (curriculum):', tutorialSubtopic.external_id);
    printField('  Name:', tutorialSubtopic.name);
    printField('  Slug:', tutorialSubtopic.slug);

    // ============================================================
    // STEP 4: Verify tutorial section
    // ============================================================
    printHeader('STEP 4: VERIFY TUTORIAL SECTION');

    const sectionResult = await tutorialDb.query(
      `SELECT id, subtopic_id, navigation_node_id, status
       FROM tutorial_sections
       WHERE id = $1`,
      [SECTION_ID]
    );

    if (sectionResult.rows.length === 0) {
      console.error('');
      console.error('❌ Tutorial section not found!');
      process.exitCode = 1;
      return;
    }

    const section = sectionResult.rows[0];
    console.log('');
    printField('Section ID:', section.id);
    printField('subtopic_id:', section.subtopic_id);
    printField('navigation_node:', section.navigation_node_id);
    printField('status:', section.status);

    // ============================================================
    // STEP 5: VALIDATE MAPPING
    // ============================================================
    printHeader('STEP 5: MAPPING VALIDATION');

    console.log('');
    console.log('EXPECTED RELATIONSHIP:');
    console.log('');
    console.log(`  Curriculum subtopic:     ${CURRICULUM_SUBTOPIC_ID}`);
    console.log('           ↓ external_id');
    console.log(`  Tutorial subtopic:       ${tutorialSubtopic.id}`);
    console.log('           ↓ subtopic_id');
    console.log(`  Tutorial section:        ${section.subtopic_id}`);
    console.log('');

    if (section.subtopic_id === tutorialSubtopic.id) {
      console.log('✅ MAPPING IS CORRECT!');
      console.log('');
      console.log('The tutorial_sections.subtopic_id correctly references');
      console.log('the tutorial_subtopics.id, which maps to the curriculum');
      console.log('subtopic via external_id.');
      console.log('');
      console.log('CONCLUSION: The IDs are SUPPOSED to be different.');
      console.log('            This is the correct cross-database mapping.');
    } else {
      console.log('❌ MAPPING IS BROKEN!');
      console.log('');
      printField('  Section points to:', section.subtopic_id);
      printField('  Should point to:', tutorialSubtopic.id);
      console.log('');
      console.log('DIAGNOSIS: tutorial_sections.subtopic_id does not match');
      console.log('           the correct tutorial_subtopics.id');
      process.exitCode = 1;
      return;
    }

    // ============================================================
    // STEP 6: Check what 414f63eb... actually is
    // ============================================================
    printHeader('STEP 6: INVESTIGATE ACTUAL SECTION SUBTOPIC_ID');

    const actualSubtopicResult = await tutorialDb.query(
      `SELECT id, external_id, name, slug
       FROM tutorial_subtopics
       WHERE id = $1 AND deleted_at IS NULL`,
      [section.subtopic_id]
    );

    if (actualSubtopicResult.rows.length === 0) {
      console.log('');
      console.log(`❌ Subtopic ${section.subtopic_id} NOT FOUND`);
      console.log('   in tutorial_subtopics!');
      console.log('');
      console.log('DIAGNOSIS: tutorial_sections.subtopic_id points to');
      console.log('           a tutorial_subtopics row that does not exist.');
      console.log('');
      console.log('ROOT CAUSE: The seed/creation bypassed the mapping table');
      console.log('            or used a deleted/invalid tutorial_subtopics.id');
      process.exitCode = 1;
    } else {
      const actualSubtopic = actualSubtopicResult.rows[0];
      console.log('');
      console.log(`Section subtopic_id ${section.subtopic_id}:`);
      printField('  Name:', actualSubtopic.name);
      printField('  External ID:', actualSubtopic.external_id);
      printField('  Slug:', actualSubtopic.slug);
      console.log('');
      
      if (actualSubtopic.external_id !== CURRICULUM_SUBTOPIC_ID) {
        console.log('❌ WRONG MAPPING!');
        console.log('');
        console.log('The section points to a tutorial_subtopics row that');
        console.log('maps to a DIFFERENT curriculum subtopic.');
        console.log('');
        printField('  Section external_id:', actualSubtopic.external_id);
        printField('  Expected external_id:', CURRICULUM_SUBTOPIC_ID);
        process.exitCode = 1;
      } else {
        console.log('✅ Correct mapping found!');
      }
    }

  } catch (error) {
    console.error('');
    console.error('❌ VERIFICATION FAILED:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await curriculumDb.end();
    await tutorialDb.end();
  }
}

main();
