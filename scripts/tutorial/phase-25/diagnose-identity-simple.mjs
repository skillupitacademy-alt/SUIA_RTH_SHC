#!/usr/bin/env node

/**
 * PHASE 2.5-F: SIMPLE IDENTITY DIAGNOSTIC
 * 
 * Check if the tutorial_sections.subtopic_id exists in curriculum
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

const SECTION_ID = '5326eeb6-c4c8-4218-9687-2b46f94a9bb4';

async function main() {
  console.log('');
  console.log('='.repeat(70));
  console.log('PHASE 2.5-F: IDENTITY MISMATCH DIAGNOSIS');
  console.log('='.repeat(70));
  console.log('');

  const curriculumDb = new Client({ connectionString: process.env.DATABASE_URL });
  const tutorialDb = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  try {
    await curriculumDb.connect();
    await tutorialDb.connect();

    // Get tutorial section
    const sectionResult = await tutorialDb.query(
      `SELECT id, subtopic_id, navigation_node_id, brand_id, status
       FROM tutorial_sections
       WHERE id = $1`,
      [SECTION_ID]
    );

    if (sectionResult.rows.length === 0) {
      console.error('❌ Tutorial section not found!');
      process.exit(1);
    }

    const section = sectionResult.rows[0];
    console.log('TUTORIAL SECTION:');
    console.log(`  ID:              ${section.id}`);
    console.log(`  subtopic_id:     ${section.subtopic_id}`);
    console.log(`  navigation_node: ${section.navigation_node_id}`);
    console.log(`  status:          ${section.status}`);
    console.log('');

    // Check if this subtopic exists in curriculum
    const curriculumCheck = await curriculumDb.query(
      `SELECT id, name FROM subtopics WHERE id = $1 AND deleted_at IS NULL`,
      [section.subtopic_id]
    );

    console.log('CURRICULUM CHECK:');
    if (curriculumCheck.rows.length === 0) {
      console.log(`  ❌ Subtopic ${section.subtopic_id} NOT FOUND in curriculum!`);
      console.log('');
      
      // Find what IS in curriculum for "What is Java?"
      const correctSubtopic = await curriculumDb.query(
        `SELECT s.id, s.name, t.name as topic_name
         FROM subtopics s
         JOIN topics t ON s.topic_id = t.id
         WHERE LOWER(s.name) LIKE '%what is java%'
           AND s.deleted_at IS NULL`
      );

      if (correctSubtopic.rows.length > 0) {
        console.log('  ✅ Found correct "What is Java?" in curriculum:');
        correctSubtopic.rows.forEach(row => {
          console.log(`     ID:    ${row.id}`);
          console.log(`     Name:  ${row.name}`);
          console.log(`     Topic: ${row.topic_name}`);
        });
      }
    } else {
      console.log(`  ✅ Subtopic exists: ${curriculumCheck.rows[0].name}`);
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(70));
    
    if (curriculumCheck.rows.length === 0) {
      console.log('');
      console.log('❌ ROOT CAUSE: tutorial_sections.subtopic_id points to');
      console.log('   a subtopic that does NOT exist in the curriculum database.');
      console.log('');
      console.log('FIX: Update tutorial_sections.subtopic_id to match the');
      console.log('     correct curriculum subtopic ID.');
      console.log('');
      process.exitCode = 1;
    } else {
      console.log('');
      console.log('✅ Subtopic ID is valid.');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('❌ DIAGNOSTIC FAILED:');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await curriculumDb.end();
    await tutorialDb.end();
  }
}

main();
