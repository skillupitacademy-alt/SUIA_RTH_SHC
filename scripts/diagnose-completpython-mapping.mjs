#!/usr/bin/env node

/**
 * DATABASE MAPPING DIAGNOSIS - completpython
 * 
 * Diagnose why /tutorial-v2/.../completpython is failing with 503.
 * 
 * This script ONLY reads database state. It does NOT modify anything.
 * 
 * Investigation:
 * 1. MainDB topic.id for "python"
 * 2. tutorialSidebarTreesV2.topicId (should match MainDB)
 * 3. MainDB subtopic.id for "completpython"
 * 4. tutorial_subtopics.external_id mapping
 * 5. tutorial_subtopics.id (internal)
 * 6. tutorial_sections.subtopic_id
 * 7. tutorial_sections status/brand/visibility
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const MAIN_DB_URL = process.env.DATABASE_URL;
const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!MAIN_DB_URL || !TUTORIAL_DB_URL) {
  console.error('❌ Missing environment variables:');
  console.error('   DATABASE_URL:', MAIN_DB_URL ? '✓' : '✗');
  console.error('   DATABASE_URL_TUTORIAL:', TUTORIAL_DB_URL ? '✓' : '✗');
  process.exit(1);
}

const mainDb = new Pool({ connectionString: MAIN_DB_URL });
const tutorialDb = new Pool({ connectionString: TUTORIAL_DB_URL });

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   DATABASE MAPPING DIAGNOSIS - completpython             ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

async function diagnose() {
  try {
    // Step 1: Find MainDB domain for "full-stack-development"
    console.log('[STEP 1] MainDB Domain: full-stack-development');
    const domainResult = await mainDb.query(`
      SELECT id, name
      FROM domains
      WHERE deleted_at IS NULL
      ORDER BY name
    `);
    
    const domain = domainResult.rows.find(r => 
      r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'fullstackdevelopment' ||
      r.name.toLowerCase().includes('full') && r.name.toLowerCase().includes('stack')
    );
    
    if (!domain) {
      console.error('❌ Domain not found in MainDB');
      return;
    }
    
    console.log(`✅ Found domain: ${domain.name}`);
    console.log(`   ID: ${domain.id}\n`);

    // Step 2: Find MainDB subject for "backend-development"
    console.log('[STEP 2] MainDB Subject: backend-development');
    const subjectResult = await mainDb.query(`
      SELECT id, name, domain_id
      FROM subjects
      WHERE domain_id = $1 AND deleted_at IS NULL
      ORDER BY name
    `, [domain.id]);
    
    const subject = subjectResult.rows.find(r =>
      r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'backenddevelopment' ||
      r.name.toLowerCase().includes('backend')
    );
    
    if (!subject) {
      console.error('❌ Subject not found in MainDB');
      console.log('   Available subjects:', subjectResult.rows.map(r => r.name));
      return;
    }
    
    console.log(`✅ Found subject: ${subject.name}`);
    console.log(`   ID: ${subject.id}\n`);

    // Step 3: Find MainDB topic for "python"
    console.log('[STEP 3] MainDB Topic: python');
    const topicResult = await mainDb.query(`
      SELECT id, name, subject_id
      FROM topics
      WHERE subject_id = $1 AND deleted_at IS NULL
      ORDER BY name
    `, [subject.id]);
    
    const topic = topicResult.rows.find(r =>
      r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'python' ||
      r.name.toLowerCase() === 'python'
    );
    
    if (!topic) {
      console.error('❌ Topic not found in MainDB');
      console.log('   Available topics:', topicResult.rows.map(r => r.name));
      return;
    }
    
    console.log(`✅ Found topic: ${topic.name}`);
    console.log(`   MainDB topic.id: ${topic.id}\n`);

    // Step 4: Check TutorialDB sidebar for this topic
    console.log('[STEP 4] TutorialDB Sidebar: topic mapping');
    const sidebarResult = await tutorialDb.query(`
      SELECT id, brand_id, topic_id, status, created_at
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = $1
      ORDER BY created_at DESC
    `, [topic.id]);
    
    if (sidebarResult.rows.length === 0) {
      console.log('⚠️  No sidebar found with MainDB topic.id');
      console.log('   This means sidebar uses different ID mapping\n');
    } else {
      console.log(`✅ Found ${sidebarResult.rows.length} sidebar(s):`);
      sidebarResult.rows.forEach(row => {
        console.log(`   - brand: ${row.brand_id}, status: ${row.status}, id: ${row.id}`);
      });
      console.log();
    }

    // Step 5: Find MainDB subtopic for "completpython"
    console.log('[STEP 5] MainDB Subtopic: completpython');
    const subtopicResult = await mainDb.query(`
      SELECT id, name, topic_id
      FROM subtopics
      WHERE topic_id = $1 AND deleted_at IS NULL
      ORDER BY name
    `, [topic.id]);
    
    const subtopic = subtopicResult.rows.find(r =>
      r.name.toLowerCase().replace(/[^a-z0-9]/g, '') === 'completpython' ||
      r.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes('completepython')
    );
    
    if (!subtopic) {
      console.error('❌ Subtopic not found in MainDB');
      console.log('   Available subtopics:');
      subtopicResult.rows.forEach(r => {
        console.log(`   - ${r.name}`);
      });
      return;
    }
    
    console.log(`✅ Found subtopic: ${subtopic.name}`);
    console.log(`   MainDB subtopic.id: ${subtopic.id}\n`);

    // Step 6: Check TutorialDB subtopic mapping
    console.log('[STEP 6] TutorialDB Subtopic: external_id mapping');
    const tutorialSubtopicResult = await tutorialDb.query(`
      SELECT id, external_id, name
      FROM tutorial_subtopics
      WHERE external_id = $1
    `, [subtopic.id]);
    
    if (tutorialSubtopicResult.rows.length === 0) {
      console.error('❌ MAPPING MISSING: tutorial_subtopics.external_id not found');
      console.error(`   MainDB subtopic.id: ${subtopic.id}`);
      console.error(`   Expected: tutorial_subtopics.external_id = '${subtopic.id}'`);
      console.error(`   THIS IS THE ROOT CAUSE OF THE 503 ERROR\n`);
      
      // Check if any tutorial_subtopics exist for this topic
      console.log('[DIAGNOSTIC] Checking all tutorial_subtopics...');
      const allTutorialSubtopics = await tutorialDb.query(`
        SELECT id, external_id, name
        FROM tutorial_subtopics
        ORDER BY name
        LIMIT 20
      `);
      console.log(`   Found ${allTutorialSubtopics.rows.length} total tutorial_subtopics`);
      if (allTutorialSubtopics.rows.length > 0) {
        console.log('   Sample entries:');
        allTutorialSubtopics.rows.slice(0, 5).forEach(r => {
          console.log(`   - ${r.name} (external_id: ${r.external_id})`);
        });
      }
      return;
    }
    
    const tutorialSubtopic = tutorialSubtopicResult.rows[0];
    console.log(`✅ Found tutorial_subtopics mapping:`);
    console.log(`   TutorialDB internal ID: ${tutorialSubtopic.id}`);
    console.log(`   external_id: ${tutorialSubtopic.external_id}`);
    console.log(`   Name: ${tutorialSubtopic.name}\n`);

    // Step 7: Check tutorial_sections
    console.log('[STEP 7] TutorialDB Sections: published tutorials');
    const sectionsResult = await tutorialDb.query(`
      SELECT 
        id, 
        subtopic_id, 
        brand_id, 
        status, 
        brand_visibility,
        published_at,
        deleted_at,
        created_at
      FROM tutorial_sections
      WHERE subtopic_id = $1
      ORDER BY created_at DESC
    `, [tutorialSubtopic.id]);
    
    if (sectionsResult.rows.length === 0) {
      console.log('⚠️  No tutorial sections found');
      console.log('   Subtopic is mapped but has no published tutorial\n');
      return;
    }
    
    console.log(`✅ Found ${sectionsResult.rows.length} tutorial section(s):`);
    sectionsResult.rows.forEach(row => {
      console.log(`   - ID: ${row.id}`);
      console.log(`     brand: ${row.brand_id}`);
      console.log(`     status: ${row.status}`);
      console.log(`     visibility: ${row.brand_visibility || 'N/A'}`);
      console.log(`     published: ${row.published_at || 'N/A'}`);
      console.log(`     deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
    });
    console.log();

    // Summary
    console.log('════════════════════════════════════════════════════════════');
    console.log('DIAGNOSIS SUMMARY');
    console.log('════════════════════════════════════════════════════════════\n');
    
    console.log('✅ MainDB Hierarchy: COMPLETE');
    console.log(`   Domain: ${domain.name} (${domain.id})`);
    console.log(`   Subject: ${subject.name} (${subject.id})`);
    console.log(`   Topic: ${topic.name} (${topic.id})`);
    console.log(`   Subtopic: ${subtopic.name} (${subtopic.id})\n`);
    
    if (sidebarResult.rows.length > 0) {
      console.log('✅ Sidebar Mapping: OK');
      console.log(`   ${sidebarResult.rows.length} sidebar(s) found\n`);
    } else {
      console.log('⚠️  Sidebar Mapping: CHECK NEEDED');
      console.log('   No sidebar found with MainDB topic.id\n');
    }
    
    console.log('✅ Subtopic Mapping: OK');
    console.log(`   external_id → internal_id mapping exists\n`);
    
    if (sectionsResult.rows.length > 0) {
      console.log('✅ Tutorial Sections: FOUND');
      const published = sectionsResult.rows.filter(r => 
        ['approved', 'deployed'].includes(r.status) && !r.deleted_at
      );
      console.log(`   ${published.length}/${sectionsResult.rows.length} published & not deleted\n`);
      
      if (published.length > 0) {
        console.log('🟢 COMPLETE MAPPING CHAIN VERIFIED');
        console.log('   Tutorial should render successfully\n');
      } else {
        console.log('🟡 MAPPING EXISTS BUT NO PUBLISHED TUTORIAL');
        console.log('   The 503 error should now be a 404 (not found)');
        console.log('   Create a tutorial in Composer to complete the flow\n');
      }
    } else {
      console.log('🟡 MAPPING EXISTS BUT NO TUTORIAL SECTIONS');
      console.log('   The 503 error should now be a 404 (not found)');
      console.log('   Create a tutorial in Composer to complete the flow\n');
    }

  } catch (error) {
    console.error('\n❌ DIAGNOSIS FAILED:', error.message);
    console.error(error.stack);
  } finally {
    await mainDb.end();
    await tutorialDb.end();
  }
}

diagnose();
