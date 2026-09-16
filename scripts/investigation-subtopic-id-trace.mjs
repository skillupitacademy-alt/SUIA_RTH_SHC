#!/usr/bin/env node
/**
 * READ-ONLY INVESTIGATION: Trace Subtopic ID Flow
 * 
 * Purpose: Determine what identifier types exist and how they flow through
 * the tutorialRuntimeResolver → delivery service → database chain
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
    console.log('═'.repeat(80));
    console.log('SUBTOPIC IDENTIFIER INVESTIGATION — READ-ONLY');
    console.log('═'.repeat(80));
    console.log('');
    console.log('Objective: Trace identifier flow from route to database');
    console.log('Scope: Java and Python tutorial_v2 content');
    console.log('');

    // ========================================================================
    // PART 1: Java Subtopic Identifiers
    // ========================================================================
    console.log('─'.repeat(80));
    console.log('[PART 1] Java Subtopic — Identifier Inventory');
    console.log('─'.repeat(80));
    console.log('');
    
    const javaResult = await client.query(`
      SELECT 
        id AS internal_id,
        external_id,
        name,
        slug,
        topic_id,
        created_at,
        deleted_at
      FROM tutorial_subtopics
      WHERE id = '414f63eb-cccf-4bd1-bcc0-b52df69ce499'
         OR external_id = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4'
         OR slug ILIKE '%java%'
      ORDER BY name
    `);
    
    console.log(`Found ${javaResult.rows.length} Java-related subtopic(s):\n`);
    
    javaResult.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.name}`);
      console.log(`    Internal ID:  ${row.internal_id}`);
      console.log(`    External ID:  ${row.external_id}`);
      console.log(`    Slug:         ${row.slug}`);
      console.log(`    Topic ID:     ${row.topic_id}`);
      console.log(`    Deleted:      ${row.deleted_at ? 'YES' : 'NO'}`);
      console.log('');
    });

    // Check if Java has tutorial_sections
    if (javaResult.rows.length > 0) {
      const javaInternalId = javaResult.rows[0].internal_id;
      const javaExternalId = javaResult.rows[0].external_id;
      
      console.log('[Java Section Lookup by Internal ID]');
      const javaSectionByInternal = await client.query(`
        SELECT 
          id AS section_id,
          subtopic_id,
          navigation_node_id,
          status,
          created_at
        FROM tutorial_sections
        WHERE subtopic_id = $1
          AND deleted_at IS NULL
      `, [javaInternalId]);
      
      console.log(`  Query: WHERE subtopic_id = '${javaInternalId}' (internal ID)`);
      console.log(`  Result: ${javaSectionByInternal.rows.length} row(s)`);
      console.log('');
      
      console.log('[Java Section Lookup by External ID]');
      const javaSectionByExternal = await client.query(`
        SELECT 
          id AS section_id,
          subtopic_id,
          navigation_node_id,
          status,
          created_at
        FROM tutorial_sections
        WHERE subtopic_id = $1
          AND deleted_at IS NULL
      `, [javaExternalId]);
      
      console.log(`  Query: WHERE subtopic_id = '${javaExternalId}' (external ID)`);
      console.log(`  Result: ${javaSectionByExternal.rows.length} row(s)`);
      console.log('');
    }

    // ========================================================================
    // PART 2: Python Subtopic Identifiers
    // ========================================================================
    console.log('─'.repeat(80));
    console.log('[PART 2] Python Subtopic — Identifier Inventory');
    console.log('─'.repeat(80));
    console.log('');
    
    const pythonResult = await client.query(`
      SELECT 
        id AS internal_id,
        external_id,
        name,
        slug,
        topic_id,
        created_at,
        deleted_at
      FROM tutorial_subtopics
      WHERE id = '497f6cf0-a74e-4e6a-a5c2-eea5395f50c9'
         OR external_id = '5b1cfc3d-8744-4ae6-903c-ea79aaf648a0'
         OR slug ILIKE '%python%'
      ORDER BY name
      LIMIT 5
    `);
    
    console.log(`Found ${pythonResult.rows.length} Python-related subtopic(s):\n`);
    
    pythonResult.rows.forEach((row, idx) => {
      console.log(`[${idx + 1}] ${row.name}`);
      console.log(`    Internal ID:  ${row.internal_id}`);
      console.log(`    External ID:  ${row.external_id}`);
      console.log(`    Slug:         ${row.slug}`);
      console.log(`    Topic ID:     ${row.topic_id}`);
      console.log(`    Deleted:      ${row.deleted_at ? 'YES' : 'NO'}`);
      console.log('');
    });

    // Check if Python has tutorial_sections
    if (pythonResult.rows.length > 0) {
      const pythonInternalId = pythonResult.rows[0].internal_id;
      const pythonExternalId = pythonResult.rows[0].external_id;
      
      console.log('[Python Section Lookup by Internal ID]');
      const pythonSectionByInternal = await client.query(`
        SELECT 
          id AS section_id,
          subtopic_id,
          navigation_node_id,
          status,
          created_at
        FROM tutorial_sections
        WHERE subtopic_id = $1
          AND deleted_at IS NULL
      `, [pythonInternalId]);
      
      console.log(`  Query: WHERE subtopic_id = '${pythonInternalId}' (internal ID)`);
      console.log(`  Result: ${pythonSectionByInternal.rows.length} row(s)`);
      if (pythonSectionByInternal.rows.length > 0) {
        const section = pythonSectionByInternal.rows[0];
        console.log(`    Section ID:   ${section.section_id}`);
        console.log(`    Navigation:   ${section.navigation_node_id}`);
        console.log(`    Status:       ${section.status}`);
      }
      console.log('');
      
      console.log('[Python Section Lookup by External ID]');
      const pythonSectionByExternal = await client.query(`
        SELECT 
          id AS section_id,
          subtopic_id,
          navigation_node_id,
          status,
          created_at
        FROM tutorial_sections
        WHERE subtopic_id = $1
          AND deleted_at IS NULL
      `, [pythonExternalId]);
      
      console.log(`  Query: WHERE subtopic_id = '${pythonExternalId}' (external ID)`);
      console.log(`  Result: ${pythonSectionByExternal.rows.length} row(s)`);
      console.log('');
    }

    // ========================================================================
    // PART 3: Cross-Reference Analysis
    // ========================================================================
    console.log('─'.repeat(80));
    console.log('[PART 3] Cross-Reference Analysis');
    console.log('─'.repeat(80));
    console.log('');

    console.log('[Observation 1] Identifier Semantics');
    console.log('');
    console.log('  tutorial_subtopics.id          = TutorialDB internal primary key');
    console.log('  tutorial_subtopics.external_id = Cross-database identity (MainDB)');
    console.log('  tutorial_sections.subtopic_id  = Foreign key (which ID type?)');
    console.log('');

    console.log('[Observation 2] getTutorialByPage Flow');
    console.log('');
    console.log('  Step 1: Receives subtopicId parameter');
    console.log('  Step 2: Queries tutorial_subtopics WHERE external_id = subtopicId');
    console.log('  Step 3: Returns subtopic.id (internal ID)');
    console.log('  Step 4: Uses internal ID for tutorial_sections lookup');
    console.log('');
    console.log('  This means getTutorialByPage EXPECTS external_id as input');
    console.log('');

    console.log('[Observation 3] tutorialRuntimeResolver Line 115');
    console.log('');
    console.log('  Current code:');
    console.log('    subtopicId: payload.hierarchy.subtopic.id');
    console.log('');
    console.log('  Question: Does payload.hierarchy.subtopic.id contain:');
    console.log('    A) Internal ID (tutorial_subtopics.id)?');
    console.log('    B) External ID (tutorial_subtopics.external_id)?');
    console.log('');

    // ========================================================================
    // PART 4: Trace resolveHierarchy Return Value
    // ========================================================================
    console.log('─'.repeat(80));
    console.log('[PART 4] Trace resolveHierarchy Return Structure');
    console.log('─'.repeat(80));
    console.log('');
    
    console.log('Based on tutorialSidebarDelivery.ts code inspection:');
    console.log('');
    console.log('  resolveHierarchy() returns:');
    console.log('    subtopic: {');
    console.log('      id: subtopic.id,                      // TutorialDB internal ID');
    console.log('      externalId: tutorialSubtopicRecord.externalId,  // MainDB ID');
    console.log('      name: subtopic.name,');
    console.log('      slug: tutorialSubtopicRecord.slug,');
    console.log('      tutorialId: tutorialSubtopicRecord.id,');
    console.log('      canonicalSlug: tutorialSubtopicRecord.slug');
    console.log('    }');
    console.log('');
    console.log('  Then getPublishedTutorialPagePayload() calls:');
    console.log('    tutorialDeliveryService.getTutorialByPage(');
    console.log('      hierarchy.subtopic.externalId,  // ← Uses external_id');
    console.log('      params.navigationNodeId,');
    console.log('      options');
    console.log('    )');
    console.log('');
    console.log('  BUT tutorialRuntimeResolver.ts line 115 uses:');
    console.log('    subtopicId: payload.hierarchy.subtopic.id  // ← Uses internal id');
    console.log('');

    // ========================================================================
    // PART 5: Verification Query
    // ========================================================================
    console.log('─'.repeat(80));
    console.log('[PART 5] Verification — Do IDs Match?');
    console.log('─'.repeat(80));
    console.log('');
    
    const verification = await client.query(`
      SELECT 
        name,
        id AS internal_id,
        external_id,
        CASE 
          WHEN id = external_id THEN 'SAME'
          ELSE 'DIFFERENT'
        END AS relationship
      FROM tutorial_subtopics
      WHERE name ILIKE '%java%'
         OR name ILIKE '%python%'
      ORDER BY name
      LIMIT 10
    `);
    
    console.log('Checking if internal_id = external_id:');
    console.log('');
    verification.rows.forEach(row => {
      console.log(`  ${row.name}`);
      console.log(`    Internal:     ${row.internal_id}`);
      console.log(`    External:     ${row.external_id}`);
      console.log(`    Relationship: ${row.relationship}`);
      console.log('');
    });

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('═'.repeat(80));
    console.log('INVESTIGATION SUMMARY');
    console.log('═'.repeat(80));
    console.log('');
    
    const javaHasSectionByInternal = javaResult.rows.length > 0 ? 
      (await client.query(`SELECT COUNT(*) FROM tutorial_sections WHERE subtopic_id = $1 AND deleted_at IS NULL`, [javaResult.rows[0].internal_id])).rows[0].count : '0';
    
    const pythonHasSectionByInternal = pythonResult.rows.length > 0 ?
      (await client.query(`SELECT COUNT(*) FROM tutorial_sections WHERE subtopic_id = $1 AND deleted_at IS NULL`, [pythonResult.rows[0].internal_id])).rows[0].count : '0';
    
    console.log('[Key Findings]');
    console.log('');
    console.log(`1. Java subtopic exists: ${javaResult.rows.length > 0 ? 'YES' : 'NO'}`);
    console.log(`2. Java sections (by internal ID): ${javaHasSectionByInternal} row(s)`);
    console.log(`3. Python subtopic exists: ${pythonResult.rows.length > 0 ? 'YES' : 'NO'}`);
    console.log(`4. Python sections (by internal ID): ${pythonHasSectionByInternal} row(s)`);
    console.log('');
    
    console.log('[Identifier Flow]');
    console.log('');
    console.log('  Route → resolveHierarchy() → Returns hierarchy object');
    console.log('  hierarchy.subtopic.id = internal ID (TutorialDB PK)');
    console.log('  hierarchy.subtopic.externalId = external ID (MainDB)');
    console.log('');
    console.log('  getPublishedTutorialPagePayload() → getTutorialByPage()');
    console.log('  ✓ Uses hierarchy.subtopic.externalId (CORRECT)');
    console.log('');
    console.log('  tutorialRuntimeResolver.ts line 115:');
    console.log('  subtopicId: payload.hierarchy.subtopic.id');
    console.log('  ✗ Uses internal ID (MISMATCH if used for cross-DB operations)');
    console.log('');
    
    console.log('[Hypothesis Status]');
    console.log('');
    
    if (javaResult.rows.length > 0 && pythonResult.rows.length > 0) {
      const javaMatch = javaResult.rows[0].internal_id === javaResult.rows[0].external_id;
      const pythonMatch = pythonResult.rows[0].internal_id === pythonResult.rows[0].external_id;
      
      if (javaMatch && pythonMatch) {
        console.log('  ✓ Internal ID = External ID for both Java and Python');
        console.log('  ✓ No practical mismatch in current data');
        console.log('  ⚠️  BUT: Architecture assumes they can differ');
        console.log('  ⚠️  Resolver uses wrong identifier semantically');
      } else {
        console.log('  ✗ CONFIRMED: Internal ID ≠ External ID');
        console.log('  ✗ Resolver mismatch affects data lookup');
        console.log('  ⚠️  This explains why content may not be found');
      }
    } else {
      console.log('  ⚠️  Insufficient data to confirm hypothesis');
    }
    console.log('');
    
    console.log('[Next Steps]');
    console.log('');
    console.log('1. Verify TutorialRuntimeContext usage');
    console.log('2. Check if subtopicId from context is used for API calls');
    console.log('3. Trace ILS/tracking API calls');
    console.log('4. Determine if mismatch causes 401/404 errors');
    console.log('');

  } finally {
    await client.end();
  }
}

main().catch(console.error);
