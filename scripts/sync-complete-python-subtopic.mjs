#!/usr/bin/env node
/**
 * SYNC COMPLETE PYTHON SUBTOPIC
 * 
 * Sync "Complete Python" from MainDB to TutorialDB using HierarchySyncService pattern.
 * 
 * This script:
 * 1. Verifies MainDB subtopic exists
 * 2. Syncs full hierarchy chain (domain → subject → topic → subtopic)
 * 3. Verifies TutorialDB mapping was created
 * 4. Confirms resolveSubtopicId() now works
 * 
 * Root cause: Subtopic existed before auto-sync was implemented, never manually synced.
 * Fix: Manually trigger one-time sync for this subtopic.
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const MAIN_DB_URL = process.env.DATABASE_URL;
const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;
const COMPLETE_PYTHON_SUBTOPIC_ID = '5b1cfc3d-8744-4ae6-903c-ea79aaf648a0';

if (!MAIN_DB_URL || !TUTORIAL_DB_URL) {
  console.error('❌ Missing environment variables:');
  console.error('   DATABASE_URL:', MAIN_DB_URL ? '✓' : '✗');
  console.error('   DATABASE_URL_TUTORIAL:', TUTORIAL_DB_URL ? '✓' : '✗');
  process.exit(1);
}

const mainDb = new Pool({ connectionString: MAIN_DB_URL });
const tutorialDb = new Pool({ connectionString: TUTORIAL_DB_URL });

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   SYNC COMPLETE PYTHON SUBTOPIC TO TUTORIALDB           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

const slugify = (value) => {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return normalized.length > 0 ? normalized : 'item';
};

const uniqueSlug = (name, entityId) => {
  const suffix = entityId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `${slugify(name)}-${suffix.length > 0 ? suffix : entityId.slice(0, 8)}`;
};

async function sync() {
  try {
    console.log('[STEP 1] Fetch MainDB Hierarchy for Complete Python...\n');
    
    // Get subtopic with full hierarchy
    const subtopicResult = await mainDb.query(`
      SELECT 
        st.id as subtopic_id,
        st.name as subtopic_name,
        t.id as topic_id,
        t.name as topic_name,
        s.id as subject_id,
        s.name as subject_name,
        d.id as domain_id,
        d.name as domain_name
      FROM subtopics st
      JOIN topics t ON st.topic_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN domains d ON s.domain_id = d.id
      WHERE st.id = $1 AND st.deleted_at IS NULL
    `, [COMPLETE_PYTHON_SUBTOPIC_ID]);

    if (subtopicResult.rows.length === 0) {
      console.error('❌ Subtopic not found in MainDB');
      process.exit(1);
    }

    const hierarchy = subtopicResult.rows[0];
    console.log('✅ Found hierarchy chain:');
    console.log(`   Domain:   ${hierarchy.domain_name} (${hierarchy.domain_id})`);
    console.log(`   Subject:  ${hierarchy.subject_name} (${hierarchy.subject_id})`);
    console.log(`   Topic:    ${hierarchy.topic_name} (${hierarchy.topic_id})`);
    console.log(`   Subtopic: ${hierarchy.subtopic_name} (${hierarchy.subtopic_id})\n`);

    console.log('[STEP 2] Sync to TutorialDB...\n');

    // Begin transaction - sync full hierarchy chain
    const client = await tutorialDb.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Upsert domain
      console.log('   Syncing domain...');
      const domainResult = await client.query(`
        INSERT INTO tutorial_domains (external_id, name, slug, deleted_at, updated_at)
        VALUES ($1, $2, $3, NULL, NOW())
        ON CONFLICT (external_id) DO UPDATE
        SET name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            deleted_at = NULL,
            updated_at = NOW()
        RETURNING id
      `, [
        hierarchy.domain_id,
        hierarchy.domain_name,
        uniqueSlug(hierarchy.domain_name, hierarchy.domain_id)
      ]);
      const tutorialDomainId = domainResult.rows[0].id;
      console.log(`   ✅ Domain: ${tutorialDomainId}`);

      // 2. Upsert subject
      console.log('   Syncing subject...');
      const subjectResult = await client.query(`
        INSERT INTO tutorial_subjects (external_id, domain_id, name, slug, deleted_at, updated_at)
        VALUES ($1, $2, $3, $4, NULL, NOW())
        ON CONFLICT (external_id) DO UPDATE
        SET domain_id = EXCLUDED.domain_id,
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            deleted_at = NULL,
            updated_at = NOW()
        RETURNING id
      `, [
        hierarchy.subject_id,
        tutorialDomainId,
        hierarchy.subject_name,
        uniqueSlug(hierarchy.subject_name, hierarchy.subject_id)
      ]);
      const tutorialSubjectId = subjectResult.rows[0].id;
      console.log(`   ✅ Subject: ${tutorialSubjectId}`);

      // 3. Upsert topic
      console.log('   Syncing topic...');
      const topicResult = await client.query(`
        INSERT INTO tutorial_topics (external_id, subject_id, name, slug, deleted_at, updated_at)
        VALUES ($1, $2, $3, $4, NULL, NOW())
        ON CONFLICT (external_id) DO UPDATE
        SET subject_id = EXCLUDED.subject_id,
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            deleted_at = NULL,
            updated_at = NOW()
        RETURNING id
      `, [
        hierarchy.topic_id,
        tutorialSubjectId,
        hierarchy.topic_name,
        uniqueSlug(hierarchy.topic_name, hierarchy.topic_id)
      ]);
      const tutorialTopicId = topicResult.rows[0].id;
      console.log(`   ✅ Topic: ${tutorialTopicId}`);

      // 4. Upsert subtopic (THE CRITICAL MISSING MAPPING)
      console.log('   Syncing subtopic...');
      const subtopicInsertResult = await client.query(`
        INSERT INTO tutorial_subtopics (external_id, topic_id, name, slug, difficulty_levels, deleted_at, updated_at)
        VALUES ($1, $2, $3, $4, '[]'::jsonb, NULL, NOW())
        ON CONFLICT (external_id) DO UPDATE
        SET topic_id = EXCLUDED.topic_id,
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            difficulty_levels = EXCLUDED.difficulty_levels,
            deleted_at = NULL,
            updated_at = NOW()
        RETURNING id, external_id
      `, [
        hierarchy.subtopic_id,
        tutorialTopicId,
        hierarchy.subtopic_name,
        uniqueSlug(hierarchy.subtopic_name, hierarchy.subtopic_id)
      ]);
      const tutorialSubtopicId = subtopicInsertResult.rows[0].id;
      const externalId = subtopicInsertResult.rows[0].external_id;
      console.log(`   ✅ Subtopic: ${tutorialSubtopicId}`);
      console.log(`   ✅ external_id: ${externalId}\n`);

      await client.query('COMMIT');
      console.log('✅ Transaction committed\n');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction rolled back:', error.message);
      throw error;
    } finally {
      client.release();
    }

    console.log('[STEP 3] Verify Mapping...\n');

    // Verify the mapping exists
    const verifyResult = await tutorialDb.query(`
      SELECT id, external_id, name, slug
      FROM tutorial_subtopics
      WHERE external_id = $1
    `, [COMPLETE_PYTHON_SUBTOPIC_ID]);

    if (verifyResult.rows.length === 0) {
      console.error('❌ VERIFICATION FAILED: Mapping not found after sync');
      process.exit(1);
    }

    const mapped = verifyResult.rows[0];
    console.log('✅ Mapping verified:');
    console.log(`   TutorialDB internal ID: ${mapped.id}`);
    console.log(`   external_id: ${mapped.external_id}`);
    console.log(`   name: ${mapped.name}`);
    console.log(`   slug: ${mapped.slug}\n`);

    console.log('[STEP 4] Test resolveSubtopicId()...\n');

    // Simulate what resolveSubtopicId does
    const resolveTest = await tutorialDb.query(`
      SELECT id FROM tutorial_subtopics WHERE external_id = $1
    `, [COMPLETE_PYTHON_SUBTOPIC_ID]);

    if (resolveTest.rows.length === 0) {
      console.error('❌ resolveSubtopicId() would still return NULL');
      process.exit(1);
    }

    console.log('✅ resolveSubtopicId() test PASSED');
    console.log(`   Would return: ${resolveTest.rows[0].id}\n`);

    // Update MainDB sync status
    console.log('[STEP 5] Update MainDB sync status...\n');
    await mainDb.query(`
      UPDATE subtopics 
      SET tutorial_sync_status = 'synced'
      WHERE id = $1
    `, [COMPLETE_PYTHON_SUBTOPIC_ID]);
    console.log('✅ MainDB subtopic marked as synced\n');

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ SYNC COMPLETE');
    console.log('════════════════════════════════════════════════════════════\n');
    console.log('The "Complete Python" subtopic is now mapped to TutorialDB.');
    console.log('The 503 error should be resolved.\n');
    console.log('Next steps:');
    console.log('1. Test learner page: /tutorial-v2/full-stack-development/backend-development/python/completpython');
    console.log('2. Verify Tutorial Composer can create tutorials for this subtopic');
    console.log('3. Consider running HierarchySyncService.syncAll() for all other subtopics\n');

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mainDb.end();
    await tutorialDb.end();
  }
}

sync();
