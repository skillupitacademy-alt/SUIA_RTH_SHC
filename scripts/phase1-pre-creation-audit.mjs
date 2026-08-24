#!/usr/bin/env node
/**
 * Phase 1 Pre-Creation Audit
 * 
 * Verifies topic-sidebar relationships and orphaned records
 * before creating the canonical Java subtopic
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

function normalizeNavigationId(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function audit() {
  try {
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('PHASE 1 — PRE-CREATION AUDIT');
    console.log('══════════════════════════════════════════════════════════════════\n');

    // ================================================================
    // 1. CORRECTED UNIQUE INDEX VERIFICATION
    // ================================================================
    console.log('[1] CORRECTED UNIQUE INDEX VERIFICATION\n');

    const tableConstraints = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM pg_constraint
      WHERE conrelid = 'tutorial_sections'::regclass
        AND contype = 'u'
    `);

    const uniqueIndex = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
        AND indexname = 'uq_tutorial_v2_identity_active'
    `);

    console.log(`Table UNIQUE constraints: ${tableConstraints.rows[0].count}`);
    console.log(`Partial UNIQUE index "uq_tutorial_v2_identity_active": ${uniqueIndex.rows.length > 0 ? 'PRESENT' : 'MISSING'}`);

    if (uniqueIndex.rows.length > 0) {
      console.log('\nIndex definition:');
      console.log(uniqueIndex.rows[0].indexdef);
      
      const hasSoftDeleteFilter = uniqueIndex.rows[0].indexdef.includes('deleted_at IS NULL');
      const hasThreeParts = 
        uniqueIndex.rows[0].indexdef.includes('subtopic_id') &&
        uniqueIndex.rows[0].indexdef.includes('navigation_node_id') &&
        uniqueIndex.rows[0].indexdef.includes('brand_id');

      console.log(`\n✅ Soft-delete filter: ${hasSoftDeleteFilter ? 'PRESENT' : 'MISSING'}`);
      console.log(`✅ Three-part identity: ${hasThreeParts ? 'VERIFIED' : 'MISSING'}`);
      console.log(`\n✅ Phase 1 identity enforcement: ACTIVE`);
    } else {
      console.log('\n❌ Partial unique index MISSING - Phase 1 not ready');
    }

    // ================================================================
    // 2. ALL TOPICS AND SIDEBAR RELATIONSHIPS
    // ================================================================
    console.log('\n[2] ALL TOPICS AND SIDEBAR RELATIONSHIPS\n');

    const topics = await pool.query(`
      SELECT
        tt.id AS internal_id,
        tt.external_id,
        tt.name,
        tt.slug,
        tt.created_at,
        st.id AS sidebar_id,
        st.brand_id AS sidebar_brand,
        st.status AS sidebar_status
      FROM tutorial_topics tt
      LEFT JOIN tutorial_sidebar_trees_v2 st
        ON st.topic_id = tt.external_id
      ORDER BY tt.name, tt.created_at
    `);

    console.table(topics.rows);

    const withSidebar = topics.rows.filter(t => t.sidebar_id);
    const withoutSidebar = topics.rows.filter(t => !t.sidebar_id);

    console.log(`\nTopics with sidebars: ${withSidebar.length}`);
    console.log(`Topics without sidebars: ${withoutSidebar.length}`);

    if (withoutSidebar.length > 0) {
      console.log('\n⚠️  Topics without sidebars:');
      withoutSidebar.forEach(t => {
        console.log(`  - ${t.name} (${t.internal_id})`);
        console.log(`    external_id: ${t.external_id}`);
      });
    }

    // ================================================================
    // 3. ALL SUBTOPICS AND PARENT TOPIC VERIFICATION
    // ================================================================
    console.log('\n[3] ALL SUBTOPICS AND PARENT TOPIC VERIFICATION\n');

    const subtopics = await pool.query(`
      SELECT
        ts.id AS subtopic_id,
        ts.name AS subtopic_name,
        ts.slug AS subtopic_slug,
        ts.topic_id AS subtopic_topic_id,
        tt.id AS parent_id,
        tt.external_id AS parent_external_id,
        tt.name AS parent_name,
        st.id AS sidebar_id,
        st.topic_id AS sidebar_topic_id
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON tt.id = ts.topic_id
      LEFT JOIN tutorial_sidebar_trees_v2 st ON st.topic_id = tt.external_id
      WHERE ts.deleted_at IS NULL
      ORDER BY tt.name, ts.name
    `);

    console.table(subtopics.rows);

    const subtopicsWithSidebar = subtopics.rows.filter(s => s.sidebar_id);
    const subtopicsWithoutSidebar = subtopics.rows.filter(s => !s.sidebar_id);

    console.log(`\nSubtopics with parent topic + sidebar: ${subtopicsWithSidebar.length}`);
    console.log(`Subtopics WITHOUT sidebar (orphaned): ${subtopicsWithoutSidebar.length}`);

    if (subtopicsWithoutSidebar.length > 0) {
      console.log('\n🚨 ORPHANED SUBTOPICS (parent topic has no sidebar):');
      subtopicsWithoutSidebar.forEach(s => {
        console.log(`  - ${s.subtopic_name}`);
        console.log(`    Parent topic: ${s.parent_name}`);
        console.log(`    Parent external_id: ${s.parent_external_id}`);
        console.log(`    Action required: Cannot create tutorials without sidebar`);
      });
    }

    // ================================================================
    // 4. NORMALIZED SLUG COLLISION CHECK
    // ================================================================
    console.log('\n[4] NORMALIZED SLUG COLLISION CHECK\n');

    const normalizedMap = new Map();

    for (const sub of subtopics.rows) {
      const norm = normalizeNavigationId(sub.subtopic_slug);
      if (!normalizedMap.has(norm)) {
        normalizedMap.set(norm, []);
      }
      normalizedMap.get(norm).push({
        id: sub.subtopic_id,
        name: sub.subtopic_name,
        slug: sub.subtopic_slug,
        topic: sub.parent_name
      });
    }

    let collisionCount = 0;
    normalizedMap.forEach((subs, normalized) => {
      if (subs.length > 1) {
        collisionCount++;
        console.log(`🚨 COLLISION: normalized="${normalized}"`);
        console.table(subs);
      }
    });

    if (collisionCount === 0) {
      console.log('✅ No normalized slug collisions');
    } else {
      console.log(`\n⚠️  ${collisionCount} normalized collision(s) detected`);
    }

    // ================================================================
    // 5. JAVA SUBTOPIC CREATION READINESS
    // ================================================================
    console.log('\n[5] JAVA SUBTOPIC CREATION READINESS\n');

    const javaTopicReady = topics.rows.find(t => 
      t.name === 'Java' && 
      t.external_id === '4b21ddc0-123b-41e3-8ea1-280d37f7f035'
    );

    if (!javaTopicReady) {
      console.log('❌ Java topic not found or external_id mismatch');
    } else if (!javaTopicReady.sidebar_id) {
      console.log('❌ Java topic has no sidebar');
    } else {
      console.log('✅ Java topic verified:');
      console.log(`   Internal ID: ${javaTopicReady.internal_id}`);
      console.log(`   External ID: ${javaTopicReady.external_id}`);
      console.log(`   Sidebar: ${javaTopicReady.sidebar_id} (${javaTopicReady.sidebar_brand})`);

      const existingJavaSubtopic = subtopics.rows.find(s =>
        s.parent_name === 'Java' &&
        s.subtopic_name.toLowerCase() === 'what is java?'
      );

      if (existingJavaSubtopic) {
        console.log(`\n❌ "What is Java?" subtopic already exists: ${existingJavaSubtopic.subtopic_id}`);
      } else {
        console.log('\n✅ No "What is Java?" subtopic exists');
        console.log('✅ Ready to create canonical Java subtopic');
      }

      // Verify sidebar contains what-is-java page
      const javaSidebar = await pool.query(`
        SELECT tree
        FROM tutorial_sidebar_trees_v2
        WHERE id = $1
      `, [javaTopicReady.sidebar_id]);

      if (javaSidebar.rows.length > 0) {
        function findPage(tree, targetId) {
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

        const whatIsJavaPage = findPage(javaSidebar.rows[0].tree, 'what-is-java');
        
        if (whatIsJavaPage) {
          console.log('\n✅ Target sidebar page verified:');
          console.log(`   node.id: "${whatIsJavaPage.id}"`);
          console.log(`   node.type: "${whatIsJavaPage.type}"`);
          console.log(`   node.name: "${whatIsJavaPage.name}"`);
          console.log(`   normalized: "${normalizeNavigationId(whatIsJavaPage.id)}"`);
        } else {
          console.log('\n❌ Target page "what-is-java" not found in sidebar');
        }
      }
    }

    // ================================================================
    // 6. RECOMMENDED NEXT STEPS
    // ================================================================
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('[6] RECOMMENDED NEXT STEPS');
    console.log('══════════════════════════════════════════════════════════════════\n');

    const ready = [];
    const notReady = [];

    if (uniqueIndex.rows.length > 0) {
      ready.push('✅ Phase 1 unique index active');
    } else {
      notReady.push('❌ Phase 1 unique index missing');
    }

    if (javaTopicReady && javaTopicReady.sidebar_id) {
      ready.push('✅ Java topic + sidebar ready');
    } else {
      notReady.push('❌ Java topic or sidebar not ready');
    }

    if (subtopicsWithoutSidebar.length === 0) {
      ready.push('✅ No orphaned subtopics');
    } else {
      notReady.push(`⚠️  ${subtopicsWithoutSidebar.length} orphaned subtopic(s)`);
    }

    if (collisionCount === 0) {
      ready.push('✅ No normalized collisions');
    } else {
      notReady.push(`⚠️  ${collisionCount} normalized collision(s)`);
    }

    ready.forEach(r => console.log(r));
    if (notReady.length > 0) {
      console.log('');
      notReady.forEach(r => console.log(r));
    }

    if (withoutSidebar.length > 0) {
      console.log('\n⚠️  MASTER DATA ISSUE:');
      console.log(`   ${withoutSidebar.length} topic(s) exist without sidebars`);
      console.log('   This is outside Phase 1 Java scope');
      console.log('   Requires separate master data decision');
    }

    if (notReady.length === 0) {
      console.log('\n✅ READY TO CREATE JAVA SUBTOPIC:');
      console.log('   name: "What is Java?"');
      console.log('   slug: "whatisjava"');
      console.log(`   topic_id: "${javaTopicReady.internal_id}"`);
    }

    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('PRE-CREATION AUDIT COMPLETE');
    console.log('══════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

audit();
