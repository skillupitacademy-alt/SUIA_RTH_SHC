#!/usr/bin/env node
/**
 * Phase 1 Forensic Database Inspection
 * 
 * READ-ONLY audit of current database state
 * NO modifications - only inspection and reporting
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

function normalizeNavigationId(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function inspect() {
  try {
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('PHASE 1 — FORENSIC DATABASE INSPECTION (READ-ONLY)');
    console.log('══════════════════════════════════════════════════════════════════\n');

    // ================================================================
    // SECTION 1: SCHEMA VERIFICATION
    // ================================================================
    console.log('[1] SCHEMA VERIFICATION\n');

    const navNodeIdColumn = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tutorial_sections'
        AND column_name = 'navigation_node_id'
    `);

    if (navNodeIdColumn.rows.length === 0) {
      console.log('❌ navigation_node_id column DOES NOT EXIST');
    } else {
      console.log('✅ navigation_node_id column exists:');
      console.table(navNodeIdColumn.rows);
    }

    const uniqueConstraint = await pool.query(`
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'tutorial_sections'::regclass
        AND contype = 'u'
    `);

    console.log('\nUnique Constraints:');
    if (uniqueConstraint.rows.length === 0) {
      console.log('❌ No unique constraints found');
    } else {
      console.table(uniqueConstraint.rows);
    }

    const indexes = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
      ORDER BY indexname
    `);

    console.log('\nIndexes:');
    console.table(indexes.rows);

    // ================================================================
    // SECTION 2: TUTORIAL TOPICS
    // ================================================================
    console.log('\n[2] TUTORIAL TOPICS\n');

    const topics = await pool.query(`
      SELECT
        id AS internal_id,
        external_id,
        name,
        slug,
        created_at
      FROM tutorial_topics
      WHERE name IN ('Java', 'Python')
      ORDER BY name
    `);

    console.table(topics.rows);

    // ================================================================
    // SECTION 3: TUTORIAL SUBTOPICS
    // ================================================================
    console.log('\n[3] TUTORIAL SUBTOPICS\n');

    const subtopics = await pool.query(`
      SELECT
        ts.id,
        ts.external_id,
        ts.name,
        ts.slug,
        ts.topic_id,
        ts.created_at,
        tt.name AS parent_topic_name,
        tt.external_id AS parent_topic_external_id
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON tt.id = ts.topic_id
      WHERE ts.deleted_at IS NULL
      ORDER BY tt.name, ts.name
    `);

    console.log(`Total active subtopics: ${subtopics.rows.length}\n`);
    console.table(subtopics.rows);

    // Check for "What is Java?" specifically
    const whatIsJava = subtopics.rows.filter(s => 
      s.name.toLowerCase() === 'what is java?'
    );

    console.log(`\n"What is Java?" subtopics: ${whatIsJava.length}`);
    if (whatIsJava.length > 0) {
      console.table(whatIsJava);
    } else {
      console.log('✅ No "What is Java?" subtopics exist (clean state as expected)');
    }

    // ================================================================
    // SECTION 4: SIDEBAR TREES
    // ================================================================
    console.log('\n[4] SIDEBAR TREES\n');

    const sidebars = await pool.query(`
      SELECT
        id,
        brand_id,
        topic_id,
        status,
        created_at
      FROM tutorial_sidebar_trees_v2
      ORDER BY brand_id, topic_id
    `);

    console.table(sidebars.rows);

    // ================================================================
    // SECTION 5: TOPIC → SIDEBAR BRIDGE VERIFICATION
    // ================================================================
    console.log('\n[5] TOPIC → SIDEBAR BRIDGE VERIFICATION\n');

    for (const topic of topics.rows) {
      console.log(`\nTopic: ${topic.name}`);
      console.log(`  Internal ID: ${topic.internal_id}`);
      console.log(`  External ID: ${topic.external_id}`);

      const matchingSidebar = sidebars.rows.find(s => 
        s.topic_id === topic.external_id
      );

      if (matchingSidebar) {
        console.log(`  ✅ Sidebar found: topic_id = ${matchingSidebar.topic_id}`);
        console.log(`     Brand: ${matchingSidebar.brand_id}`);
        console.log(`     Status: ${matchingSidebar.status}`);
      } else {
        console.log(`  ❌ NO sidebar found with topic_id = ${topic.external_id}`);
      }
    }

    // ================================================================
    // SECTION 6: JAVA SIDEBAR PAGE ANALYSIS
    // ================================================================
    console.log('\n[6] JAVA SIDEBAR PAGE ANALYSIS\n');

    const javaSidebar = await pool.query(`
      SELECT tree
      FROM tutorial_sidebar_trees_v2
      WHERE topic_id = '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
        AND brand_id = 'shared'
      LIMIT 1
    `);

    if (javaSidebar.rows.length === 0) {
      console.log('❌ Java sidebar not found');
    } else {
      console.log('✅ Java sidebar found\n');

      function collectPages(tree) {
        const pages = [];
        
        function walk(node) {
          if (node.type === 'page') {
            pages.push({
              id: node.id,
              name: node.name,
              normalized: normalizeNavigationId(node.id)
            });
          }
          if (Array.isArray(node.children)) {
            node.children.forEach(walk);
          }
        }

        if (Array.isArray(tree?.topics)) {
          tree.topics.forEach(walk);
        }

        return pages;
      }

      const pages = collectPages(javaSidebar.rows[0].tree);
      console.log(`Total pages in Java sidebar: ${pages.length}\n`);

      const whatIsJavaPage = pages.find(p => 
        p.id.toLowerCase().includes('what') && 
        p.id.toLowerCase().includes('java')
      );

      if (whatIsJavaPage) {
        console.log('Target page "what-is-java":');
        console.log(`  node.id: "${whatIsJavaPage.id}"`);
        console.log(`  node.name: "${whatIsJavaPage.name}"`);
        console.log(`  normalized: "${whatIsJavaPage.normalized}"`);
      } else {
        console.log('❌ "what-is-java" page not found in sidebar');
      }

      console.log('\nFirst 10 pages:');
      console.table(pages.slice(0, 10));
    }

    // ================================================================
    // SECTION 7: TUTORIAL SECTIONS
    // ================================================================
    console.log('\n[7] TUTORIAL SECTIONS\n');

    const sections = await pool.query(`
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        order_index,
        created_at,
        deleted_at
      FROM tutorial_sections
      ORDER BY created_at DESC
      LIMIT 20
    `);

    console.log(`Total tutorial_sections (last 20): ${sections.rows.length}\n`);

    if (sections.rows.length === 0) {
      console.log('✅ No tutorial_sections exist (clean state)');
    } else {
      console.table(sections.rows);

      const activeCount = sections.rows.filter(s => !s.deleted_at).length;
      const deletedCount = sections.rows.filter(s => s.deleted_at).length;

      console.log(`\nActive: ${activeCount}`);
      console.log(`Deleted: ${deletedCount}`);
    }

    // ================================================================
    // SECTION 8: NORMALIZED COLLISION CHECK
    // ================================================================
    console.log('\n[8] NORMALIZED COLLISION CHECK\n');

    const collisionCheck = await pool.query(`
      SELECT
        ts.topic_id,
        tt.name AS topic_name,
        ts.slug,
        COUNT(*)::int AS count
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON tt.id = ts.topic_id
      WHERE ts.deleted_at IS NULL
      GROUP BY ts.topic_id, tt.name, ts.slug
      HAVING COUNT(*) > 1
    `);

    if (collisionCheck.rows.length === 0) {
      console.log('✅ No slug collisions detected (each slug is unique)');
    } else {
      console.log('🚨 COLLISION DETECTED:');
      console.table(collisionCheck.rows);
    }

    // Normalized collision check
    const allSubtopics = await pool.query(`
      SELECT
        ts.id,
        ts.slug,
        ts.name,
        ts.topic_id,
        tt.name AS topic_name
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON tt.id = ts.topic_id
      WHERE ts.deleted_at IS NULL
    `);

    const normalizedMap = new Map();

    for (const sub of allSubtopics.rows) {
      const norm = normalizeNavigationId(sub.slug);
      if (!normalizedMap.has(norm)) {
        normalizedMap.set(norm, []);
      }
      normalizedMap.get(norm).push(sub);
    }

    let normalizedCollisions = 0;
    normalizedMap.forEach((subs, normalized) => {
      if (subs.length > 1) {
        normalizedCollisions++;
        console.log(`\n🚨 NORMALIZED COLLISION: "${normalized}"`);
        console.table(subs.map(s => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          topic: s.topic_name
        })));
      }
    });

    if (normalizedCollisions === 0) {
      console.log('\n✅ No normalized collisions detected');
    }

    // ================================================================
    // SECTION 9: SUMMARY
    // ================================================================
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('INSPECTION SUMMARY');
    console.log('══════════════════════════════════════════════════════════════════\n');

    const summary = {
      'navigation_node_id column': navNodeIdColumn.rows.length > 0 ? 'EXISTS' : 'MISSING',
      'unique constraints': uniqueConstraint.rows.length,
      'tutorial_topics': topics.rows.length,
      'tutorial_subtopics (active)': subtopics.rows.length,
      '"What is Java?" subtopics': whatIsJava.length,
      'tutorial_sidebar_trees_v2': sidebars.rows.length,
      'Java sidebar exists': javaSidebar.rows.length > 0 ? 'YES' : 'NO',
      'tutorial_sections': sections.rows.length,
      'normalized collisions': normalizedCollisions
    };

    console.table([summary]);

    // ================================================================
    // SECTION 10: READINESS ASSESSMENT
    // ================================================================
    console.log('\n[10] READINESS FOR PHASE 1 IMPLEMENTATION\n');

    const ready = [];
    const notReady = [];

    if (navNodeIdColumn.rows.length > 0) {
      ready.push('✅ navigation_node_id column exists');
    } else {
      notReady.push('❌ navigation_node_id column missing');
    }

    if (whatIsJava.length === 0) {
      ready.push('✅ No "What is Java?" duplicates');
    } else {
      notReady.push(`❌ ${whatIsJava.length} "What is Java?" subtopics exist`);
    }

    if (javaSidebar.rows.length > 0) {
      ready.push('✅ Java sidebar exists');
    } else {
      notReady.push('❌ Java sidebar missing');
    }

    if (normalizedCollisions === 0) {
      ready.push('✅ No normalized slug collisions');
    } else {
      notReady.push(`❌ ${normalizedCollisions} normalized collisions`);
    }

    if (topics.rows.some(t => t.name === 'Java' && t.external_id)) {
      ready.push('✅ Java topic has external_id');
    } else {
      notReady.push('❌ Java topic missing or no external_id');
    }

    console.log('READY:');
    ready.forEach(r => console.log(`  ${r}`));

    if (notReady.length > 0) {
      console.log('\nNOT READY:');
      notReady.forEach(r => console.log(`  ${r}`));
    }

    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('FORENSIC INSPECTION COMPLETE');
    console.log('══════════════════════════════════════════════════════════════════\n');

    if (notReady.length > 0) {
      console.log('⚠️  Database requires preparation before Phase 1 implementation\n');
      process.exitCode = 1;
    } else {
      console.log('✅ Database is ready for Phase 1 implementation\n');
    }

  } catch (error) {
    console.error('\n❌ INSPECTION FAILED:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

inspect();
