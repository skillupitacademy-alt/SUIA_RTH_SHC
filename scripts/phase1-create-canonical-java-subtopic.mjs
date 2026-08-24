#!/usr/bin/env node
/**
 * Phase 1 - Create Canonical Java Subtopic
 * 
 * Creates exactly ONE "What is Java?" subtopic with canonical slug "whatisjava"
 * Then verifies the complete identity chain
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

function normalizeNavigationId(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function createCanonicalSubtopic() {
  const client = await pool.connect();

  try {
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('PHASE 1 — CREATE CANONICAL JAVA SUBTOPIC');
    console.log('══════════════════════════════════════════════════════════════════\n');

    await client.query('BEGIN');

    // ================================================================
    // STEP 1: PRE-INSERTION VERIFICATION
    // ================================================================
    console.log('[STEP 1] PRE-INSERTION VERIFICATION\n');

    const existingByName = await client.query(`
      SELECT id, name, slug, topic_id
      FROM tutorial_subtopics
      WHERE LOWER(name) = LOWER('What is Java?')
        AND deleted_at IS NULL
    `);

    console.log(`Existing "What is Java?" subtopics: ${existingByName.rows.length}`);
    if (existingByName.rows.length > 0) {
      throw new Error(`Found ${existingByName.rows.length} existing "What is Java?" subtopics. Expected 0.`);
    }

    const existingBySlug = await client.query(`
      SELECT id, name, slug, topic_id
      FROM tutorial_subtopics
      WHERE slug = 'whatisjava'
        AND deleted_at IS NULL
    `);

    console.log(`Existing subtopics with slug "whatisjava": ${existingBySlug.rows.length}`);
    if (existingBySlug.rows.length > 0) {
      throw new Error(`Found ${existingBySlug.rows.length} subtopics with slug "whatisjava". Expected 0.`);
    }

    console.log('✅ No conflicting subtopics exist\n');

    // ================================================================
    // STEP 2: VERIFY JAVA TOPIC
    // ================================================================
    console.log('[STEP 2] VERIFY JAVA TOPIC\n');

    const javaTopic = await client.query(`
      SELECT
        id AS internal_id,
        external_id,
        name,
        slug
      FROM tutorial_topics
      WHERE id = '27f2a97d-c6eb-4252-8de9-b05ddab29553'
    `);

    if (javaTopic.rows.length === 0) {
      throw new Error('Java topic not found with ID 27f2a97d-c6eb-4252-8de9-b05ddab29553');
    }

    const topic = javaTopic.rows[0];
    console.log('Java topic verified:');
    console.table([topic]);

    if (topic.external_id !== '4b21ddc0-123b-41e3-8ea1-280d37f7f035') {
      throw new Error(`Java topic external_id mismatch. Expected 4b21ddc0..., got ${topic.external_id}`);
    }

    console.log('✅ Java topic external_id matches expected value\n');

    // ================================================================
    // STEP 3: INSERT CANONICAL SUBTOPIC
    // ================================================================
    console.log('[STEP 3] INSERT CANONICAL SUBTOPIC\n');

    const newId = randomUUID();
    const newExternalId = randomUUID();

    console.log('Inserting:');
    console.log(`  id: ${newId}`);
    console.log(`  external_id: ${newExternalId}`);
    console.log(`  name: "What is Java?"`);
    console.log(`  slug: "whatisjava"`);
    console.log(`  topic_id: ${topic.internal_id}`);
    console.log('');

    const insertResult = await client.query(`
      INSERT INTO tutorial_subtopics (
        id,
        external_id,
        name,
        slug,
        topic_id,
        created_at,
        updated_at
      ) VALUES (
        $1,
        $2,
        'What is Java?',
        'whatisjava',
        $3,
        NOW(),
        NOW()
      )
      RETURNING
        id,
        external_id,
        name,
        slug,
        topic_id,
        created_at
    `, [newId, newExternalId, topic.internal_id]);

    if (insertResult.rows.length === 0) {
      throw new Error('Insert failed - no row returned');
    }

    const inserted = insertResult.rows[0];
    console.log('✅ Subtopic created successfully:');
    console.table([inserted]);

    // ================================================================
    // STEP 4: VERIFY THE NEW RECORD
    // ================================================================
    console.log('\n[STEP 4] VERIFY NEW RECORD\n');

    const verification = await client.query(`
      SELECT
        ts.id AS subtopic_id,
        ts.external_id AS subtopic_external_id,
        ts.name AS subtopic_name,
        ts.slug AS subtopic_slug,
        ts.topic_id AS subtopic_topic_id,
        tt.id AS parent_topic_id,
        tt.external_id AS parent_topic_external_id,
        tt.name AS parent_topic_name
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON tt.id = ts.topic_id
      WHERE ts.id = $1
    `, [newId]);

    if (verification.rows.length === 0) {
      throw new Error('Verification failed - inserted record not found');
    }

    const verified = verification.rows[0];
    console.table([verified]);

    // Verify values
    const checks = [];

    if (verified.subtopic_name === 'What is Java?') {
      checks.push('✅ name = "What is Java?"');
    } else {
      checks.push(`❌ name = "${verified.subtopic_name}" (expected "What is Java?")`);
    }

    if (verified.subtopic_slug === 'whatisjava') {
      checks.push('✅ slug = "whatisjava"');
    } else {
      checks.push(`❌ slug = "${verified.subtopic_slug}" (expected "whatisjava")`);
    }

    if (verified.parent_topic_name === 'Java') {
      checks.push('✅ parent topic = "Java"');
    } else {
      checks.push(`❌ parent topic = "${verified.parent_topic_name}" (expected "Java")`);
    }

    if (verified.parent_topic_external_id === '4b21ddc0-123b-41e3-8ea1-280d37f7f035') {
      checks.push('✅ parent external_id matches expected');
    } else {
      checks.push(`❌ parent external_id mismatch`);
    }

    console.log('');
    checks.forEach(c => console.log(c));

    if (checks.some(c => c.startsWith('❌'))) {
      throw new Error('Verification checks failed');
    }

    // ================================================================
    // STEP 5: VERIFY SIDEBAR BRIDGE
    // ================================================================
    console.log('\n[STEP 5] VERIFY SIDEBAR BRIDGE\n');

    const sidebar = await client.query(`
      SELECT
        id AS sidebar_id,
        brand_id,
        topic_id AS sidebar_topic_id,
        status,
        tree
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = $1
        AND brand_id = 'shared'
    `, [verified.parent_topic_external_id]);

    if (sidebar.rows.length === 0) {
      throw new Error(`No sidebar found for topic_id ${verified.parent_topic_external_id}`);
    }

    const sidebarRow = sidebar.rows[0];
    console.log('Sidebar found:');
    console.log(`  ID: ${sidebarRow.sidebar_id}`);
    console.log(`  Brand: ${sidebarRow.brand_id}`);
    console.log(`  Topic ID: ${sidebarRow.sidebar_topic_id}`);
    console.log(`  Status: ${sidebarRow.status}`);
    console.log('');

    console.log('Bridge verification:');
    console.log(`  tutorial_topics.external_id:  ${verified.parent_topic_external_id}`);
    console.log(`  sidebar.topic_id:             ${sidebarRow.sidebar_topic_id}`);
    
    if (verified.parent_topic_external_id === sidebarRow.sidebar_topic_id) {
      console.log('  ✅ MATCH\n');
    } else {
      throw new Error('Bridge verification failed - external_id does not match sidebar topic_id');
    }

    // ================================================================
    // STEP 6: VERIFY SIDEBAR PAGE
    // ================================================================
    console.log('[STEP 6] VERIFY SIDEBAR PAGE\n');

    function findPageById(tree, targetId) {
      function walk(node) {
        if (node.id === targetId) return node;
        if (Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = walk(child);
            if (found) return found;
          }
        }
        return null;
      }
      if (Array.isArray(tree?.topics)) {
        for (const topic of tree.topics) {
          const found = walk(topic);
          if (found) return found;
        }
      }
      return null;
    }

    const targetPage = findPageById(sidebarRow.tree, 'what-is-java');

    if (!targetPage) {
      throw new Error('Sidebar page "what-is-java" not found');
    }

    console.log('Target sidebar page found:');
    console.log(`  node.id:   "${targetPage.id}"`);
    console.log(`  node.type: "${targetPage.type}"`);
    console.log(`  node.name: "${targetPage.name}"`);
    console.log('');

    if (targetPage.type !== 'page') {
      throw new Error(`Expected node type "page", got "${targetPage.type}"`);
    }

    console.log('✅ Sidebar page type is "page"\n');

    // ================================================================
    // STEP 7: VERIFY NORMALIZATION
    // ================================================================
    console.log('[STEP 7] VERIFY NORMALIZATION\n');

    const subtopicSlugNormalized = normalizeNavigationId(verified.subtopic_slug);
    const sidebarIdNormalized = normalizeNavigationId(targetPage.id);

    console.log('Normalization test:');
    console.log(`  subtopic.slug:        "${verified.subtopic_slug}"`);
    console.log(`  normalized:           "${subtopicSlugNormalized}"`);
    console.log('');
    console.log(`  sidebar node.id:      "${targetPage.id}"`);
    console.log(`  normalized:           "${sidebarIdNormalized}"`);
    console.log('');

    if (subtopicSlugNormalized === sidebarIdNormalized) {
      console.log(`  ✅ MATCH: "${subtopicSlugNormalized}" === "${sidebarIdNormalized}"\n`);
    } else {
      throw new Error(`Normalization mismatch: "${subtopicSlugNormalized}" !== "${sidebarIdNormalized}"`);
    }

    // ================================================================
    // STEP 8: VERIFY NO TUTORIAL SECTIONS
    // ================================================================
    console.log('[STEP 8] VERIFY NO TUTORIAL SECTIONS\n');

    const sections = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM tutorial_sections
      WHERE subtopic_id = $1
    `, [newId]);

    console.log(`Tutorial sections for new subtopic: ${sections.rows[0].count}`);

    if (sections.rows[0].count === 0) {
      console.log('✅ No tutorial sections exist (as expected)\n');
    } else {
      throw new Error(`Found ${sections.rows[0].count} tutorial sections, expected 0`);
    }

    // ================================================================
    // STEP 9: FINAL COUNT VERIFICATION
    // ================================================================
    console.log('[STEP 9] FINAL COUNT VERIFICATION\n');

    const finalCount = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM tutorial_subtopics
      WHERE LOWER(name) = LOWER('What is Java?')
        AND deleted_at IS NULL
    `);

    console.log(`Total "What is Java?" subtopics: ${finalCount.rows[0].count}`);

    if (finalCount.rows[0].count === 1) {
      console.log('✅ Exactly ONE "What is Java?" subtopic exists\n');
    } else {
      throw new Error(`Expected 1 subtopic, found ${finalCount.rows[0].count}`);
    }

    // ================================================================
    // COMMIT
    // ================================================================
    await client.query('COMMIT');

    console.log('══════════════════════════════════════════════════════════════════');
    console.log('✅ CANONICAL JAVA SUBTOPIC CREATED AND VERIFIED');
    console.log('══════════════════════════════════════════════════════════════════\n');

    console.log('COMPLETE IDENTITY CHAIN:');
    console.log('');
    console.log('  tutorial_subtopics');
    console.log(`    id:         ${verified.subtopic_id}`);
    console.log(`    name:       "${verified.subtopic_name}"`);
    console.log(`    slug:       "${verified.subtopic_slug}"`);
    console.log(`    topic_id:   ${verified.subtopic_topic_id}`);
    console.log('         ↓');
    console.log('  tutorial_topics');
    console.log(`    id:          ${verified.parent_topic_id}`);
    console.log(`    name:        "${verified.parent_topic_name}"`);
    console.log(`    external_id: ${verified.parent_topic_external_id}`);
    console.log('         ↓');
    console.log('  tutorial_sidebar_trees_v2');
    console.log(`    id:       ${sidebarRow.sidebar_id}`);
    console.log(`    topic_id: ${sidebarRow.sidebar_topic_id}`);
    console.log(`    brand:    ${sidebarRow.brand_id}`);
    console.log('         ↓');
    console.log('  sidebar page');
    console.log(`    node.id:   "${targetPage.id}"`);
    console.log(`    node.type: "${targetPage.type}"`);
    console.log(`    node.name: "${targetPage.name}"`);
    console.log('');
    console.log('  NORMALIZATION:');
    console.log(`    normalize("${verified.subtopic_slug}") = "${subtopicSlugNormalized}"`);
    console.log(`    normalize("${targetPage.id}") = "${sidebarIdNormalized}"`);
    console.log(`    ✅ MATCH`);
    console.log('');
    console.log('══════════════════════════════════════════════════════════════════');
    console.log('PHASE 1 CANONICAL SUBTOPIC: PASS');
    console.log('══════════════════════════════════════════════════════════════════\n');

    console.log('NEXT STEPS:');
    console.log('  1. Fix validator to use topic.external_id → sidebar.topic_id bridge');
    console.log('  2. Implement cross-topic rejection tests');
    console.log('  3. Create three-page acceptance test');
    console.log('  4. Verify delivery isolation');
    console.log('  5. Run complete Phase 1 certification\n');

  } catch (error) {
    await client.query('ROLLBACK');

    console.error('\n══════════════════════════════════════════════════════════════════');
    console.error('❌ CREATION FAILED');
    console.error('══════════════════════════════════════════════════════════════════\n');
    console.error(error.message);
    console.error('\nTransaction rolled back. No changes committed.\n');

    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

createCanonicalSubtopic();
