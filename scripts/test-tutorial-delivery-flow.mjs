#!/usr/bin/env node
/**
 * Test Tutorial Delivery Flow
 * 
 * This script traces the EXACT flow that happens when a user accesses:
 * /tutorial-v2/full-stack-development/backend-development/java/whatisjava
 */

import 'dotenv/config';
import pkg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });

const { Client } = pkg;

function compactSlug(value) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  console.log('\n' + '═'.repeat(70));
  console.log('TUTORIAL DELIVERY FLOW ANALYSIS');
  console.log('═'.repeat(70));
  console.log('\nURL: /tutorial-v2/full-stack-development/backend-development/java/whatisjava\n');

  const mainDb = new Client({ connectionString: process.env.DATABASE_URL });
  await mainDb.connect();

  const tutorialDb = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  await tutorialDb.connect();

  try {
    // ===================================================================
    // STEP 1: Simulate resolveHierarchy() - What MainDB returns
    // ===================================================================
    console.log('STEP 1: Hierarchy Resolution (MainDB)');
    console.log('─'.repeat(70));
    
    const subtopicResult = await mainDb.query(
      `SELECT s.id, s.name, t.name as topic_name
       FROM subtopics s
       JOIN topics t ON t.id = s.topic_id
       WHERE s.deleted_at IS NULL
       ORDER BY s.id`
    );

    const matchedSubtopic = subtopicResult.rows.find(row => 
      compactSlug(row.name) === 'whatisjava'
    );

    if (!matchedSubtopic) {
      console.log('❌ FAILED: No subtopic matches "whatisjava" in MainDB\n');
      return;
    }

    console.log('✅ Hierarchy resolved:');
    console.log(`   Subtopic: ${matchedSubtopic.name}`);
    console.log(`   Topic: ${matchedSubtopic.topic_name}`);
    console.log(`   MainDB Subtopic ID: ${matchedSubtopic.id}`);
    console.log(`   Compact Slug: ${compactSlug(matchedSubtopic.name)}`);
    console.log('');

    const mainDbSubtopicId = matchedSubtopic.id;

    // ===================================================================
    // STEP 2: What getTutorialById() receives
    // ===================================================================
    console.log('STEP 2: getTutorialById() Called');
    console.log('─'.repeat(70));
    console.log(`   Input subtopicId: ${mainDbSubtopicId}`);
    console.log(`   Input brandId: skillup`);
    console.log('');

    // ===================================================================
    // STEP 3: Current Implementation - Direct Query
    // ===================================================================
    console.log('STEP 3: Current Implementation (WHAT CODE DOES NOW)');
    console.log('─'.repeat(70));
    console.log(`   Queries: tutorial_sections WHERE subtopicId = '${mainDbSubtopicId}'`);
    console.log('');

    const currentQueryResult = await tutorialDb.query(
      `SELECT 
        ts.id,
        ts.subtopic_id,
        ts.brand_id,
        ts.status,
        ts.published_at,
        jsonb_array_length(ts.content::jsonb -> 'blocks') as blocks_count
       FROM tutorial_sections ts
       WHERE ts.subtopic_id = $1
         AND ts.deleted_at IS NULL
         AND ts.status IN ('approved', 'deployed')
       LIMIT 1`,
      [mainDbSubtopicId]
    );

    if (currentQueryResult.rows.length === 0) {
      console.log('   ❌ RESULT: NO tutorial found');
      console.log('   This is why the page shows 404!\n');
    } else {
      console.log('   ✅ RESULT: Tutorial found');
      console.log(`   Tutorial ID: ${currentQueryResult.rows[0].id}`);
      console.log(`   Blocks: ${currentQueryResult.rows[0].blocks_count}\n`);
    }

    // ===================================================================
    // STEP 4: Check TutorialDB Subtopic Mapping
    // ===================================================================
    console.log('STEP 4: TutorialDB Subtopic Mapping');
    console.log('─'.repeat(70));
    
    const tutorialDbSubtopicResult = await tutorialDb.query(
      `SELECT id, name, slug, external_id 
       FROM tutorial_subtopics 
       WHERE external_id = $1`,
      [mainDbSubtopicId]
    );

    let correctedQueryResult = { rows: [] };

    if (tutorialDbSubtopicResult.rows.length === 0) {
      console.log('   ❌ No TutorialDB subtopic found with external_id matching MainDB ID\n');
    } else {
      const tutorialDbSubtopic = tutorialDbSubtopicResult.rows[0];
      console.log('   ✅ TutorialDB subtopic found:');
      console.log(`   TutorialDB ID: ${tutorialDbSubtopic.id}`);
      console.log(`   External ID: ${tutorialDbSubtopic.external_id}`);
      console.log(`   Name: ${tutorialDbSubtopic.name}`);
      console.log(`   Slug: ${tutorialDbSubtopic.slug}`);
      console.log('');

      // ===================================================================
      // STEP 5: Corrected Query - Using TutorialDB Internal ID
      // ===================================================================
      console.log('STEP 5: CORRECTED Implementation (WHAT IT SHOULD DO)');
      console.log('─'.repeat(70));
      console.log(`   Should query: tutorial_sections WHERE subtopicId = '${tutorialDbSubtopic.id}'`);
      console.log('');

      correctedQueryResult = await tutorialDb.query(
        `SELECT 
          ts.id,
          ts.subtopic_id,
          ts.brand_id,
          ts.status,
          ts.published_at,
          jsonb_array_length(ts.content::jsonb -> 'blocks') as blocks_count,
          ts.content::jsonb -> 'blocks' -> 0 -> 'content' -> 'page' ->> 'title' as first_block_title
         FROM tutorial_sections ts
         WHERE ts.subtopic_id = $1
           AND ts.deleted_at IS NULL
           AND ts.status IN ('approved', 'deployed')
           AND (ts.brand_id = 'shared' OR ts.brand_id = 'skillup')
         LIMIT 1`,
        [tutorialDbSubtopic.id]
      );

      if (correctedQueryResult.rows.length === 0) {
        console.log('   ❌ RESULT: Still no tutorial found\n');
      } else {
        const tutorial = correctedQueryResult.rows[0];
        console.log('   ✅ RESULT: Tutorial FOUND!');
        console.log(`   Tutorial ID: ${tutorial.id}`);
        console.log(`   Subtopic ID (in tutorial_sections): ${tutorial.subtopic_id}`);
        console.log(`   Brand: ${tutorial.brand_id}`);
        console.log(`   Status: ${tutorial.status}`);
        console.log(`   Blocks: ${tutorial.blocks_count}`);
        console.log(`   Title: ${tutorial.first_block_title}`);
        console.log(`   Published: ${tutorial.published_at}`);
        console.log('');
      }
    }

    // ===================================================================
    // STEP 6: Verification - Check actual tutorial_sections data
    // ===================================================================
    console.log('STEP 6: Actual tutorial_sections Data');
    console.log('─'.repeat(70));
    
    const allTutorialsResult = await tutorialDb.query(
      `SELECT 
        ts.id,
        ts.subtopic_id,
        ts.brand_id,
        ts.status,
        t.name as subtopic_name,
        t.external_id as subtopic_external_id
       FROM tutorial_sections ts
       JOIN tutorial_subtopics t ON t.id = ts.subtopic_id
       WHERE ts.deleted_at IS NULL
         AND ts.status IN ('approved', 'deployed')
       ORDER BY ts.published_at DESC
       LIMIT 5`
    );

    console.log(`   Found ${allTutorialsResult.rows.length} published tutorial(s):\n`);
    allTutorialsResult.rows.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.subtopic_name}`);
      console.log(`      Tutorial ID: ${t.id}`);
      console.log(`      Subtopic ID (foreign key): ${t.subtopic_id}`);
      console.log(`      Subtopic External ID: ${t.subtopic_external_id}`);
      console.log(`      Brand: ${t.brand_id}`);
      console.log(`      Status: ${t.status}`);
      
      if (t.subtopic_external_id === mainDbSubtopicId) {
        console.log(`      ⭐ THIS IS THE TUTORIAL WE'RE LOOKING FOR!`);
      }
      console.log('');
    });

    // ===================================================================
    // FINAL DIAGNOSIS
    // ===================================================================
    console.log('═'.repeat(70));
    console.log('DIAGNOSIS');
    console.log('═'.repeat(70));
    console.log('');
    
    const currentFound = currentQueryResult.rows.length > 0;
    const correctedFound = tutorialDbSubtopicResult.rows.length > 0 && correctedQueryResult.rows.length > 0;
    
    if (!currentFound && correctedFound) {
      console.log('✅ BUG CONFIRMED:');
      console.log('');
      console.log('Current Code:');
      console.log(`  getTutorialById(mainDbId) → Query WHERE subtopicId = mainDbId`);
      console.log('  ❌ Result: NO tutorial found (returns 404)');
      console.log('');
      console.log('Correct Code Should Be:');
      console.log(`  1. Lookup TutorialDB subtopic WHERE external_id = mainDbId`);
      console.log(`  2. Query WHERE subtopicId = tutorialDbSubtopic.id`);
      console.log('  ✅ Result: Tutorial found (page works!)');
      console.log('');
      console.log('ROOT CAUSE:');
      console.log('  getTutorialById() receives MainDB UUID but queries directly');
      console.log('  against tutorial_sections.subtopicId which contains TutorialDB UUID.');
      console.log('  Missing externalId lookup step.');
      console.log('');
      console.log('FIX LOCATION:');
      console.log('  File: packages/db-tutorial/src/services/tutorial-delivery.service.ts');
      console.log('  Method: getTutorialById() around line 109');
      console.log('');
    } else if (currentFound) {
      console.log('❓ UNEXPECTED: Current query found tutorial');
      console.log('   The bug might be elsewhere in the flow.');
      console.log('');
    } else {
      console.log('❌ Both queries failed - different issue');
      console.log('');
    }

  } finally {
    await mainDb.end();
    await tutorialDb.end();
  }
}

main().catch(console.error);
