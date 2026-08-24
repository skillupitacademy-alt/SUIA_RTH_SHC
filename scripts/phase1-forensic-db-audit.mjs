#!/usr/bin/env node
/**
 * Phase 1 Database Forensic Audit
 * 
 * Verifies actual database state, not assumptions
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

function collectPages(tree) {
  const pages = [];

  function walk(node, path = []) {
    const currentPath = [...path, node.id || 'unnamed'];

    if (node.type === 'page') {
      pages.push({
        nodeId: node.id,
        type: node.type,
        name: node.name,
        path: currentPath.join(' → '),
      });
    }

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, currentPath);
      }
    }
  }

  if (Array.isArray(tree?.topics)) {
    for (const topic of tree.topics) {
      walk(topic);
    }
  }

  return pages;
}

async function audit() {
  try {
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('PHASE 1 DATABASE FORENSIC AUDIT');
    console.log('══════════════════════════════════════════════════════════════════\n');

    // 1. Schema verification
    console.log('[1] tutorial_sections schema\n');

    const columns = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'tutorial_sections'
        AND column_name IN (
          'subtopic_id',
          'navigation_node_id',
          'brand_id',
          'deleted_at'
        )
      ORDER BY ordinal_position
    `);

    console.table(columns.rows);

    // 2. Indexes
    console.log('\n[2] tutorial_sections indexes\n');

    const indexes = await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'tutorial_sections'
        AND indexname LIKE '%identity%'
      ORDER BY indexname
    `);

    console.table(indexes.rows);

    // 3. Active tutorial count
    console.log('\n[3] Active tutorial records\n');

    const count = await pool.query(`
      SELECT 
        COUNT(*)::int AS total_count,
        COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS active_count,
        COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS deleted_count
      FROM tutorial_sections
    `);

    console.table(count.rows);

    // 4. Duplicate identity check
    console.log('\n[4] Duplicate active identity audit (CRITICAL)\n');

    const duplicates = await pool.query(`
      SELECT
        subtopic_id,
        navigation_node_id,
        brand_id,
        COUNT(*)::int AS count
      FROM tutorial_sections
      WHERE deleted_at IS NULL
      GROUP BY
        subtopic_id,
        navigation_node_id,
        brand_id
      HAVING COUNT(*) > 1
    `);

    if (duplicates.rows.length === 0) {
      console.log('✅ NO DUPLICATE ACTIVE IDENTITIES');
    } else {
      console.log('❌ DUPLICATE ACTIVE IDENTITIES FOUND:');
      console.table(duplicates.rows);
    }

    // 5. Sample active tutorials
    console.log('\n[5] Sample active tutorial records\n');

    const samples = await pool.query(`
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        created_at
      FROM tutorial_sections
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.table(samples.rows);

    // 6. Subtopics
    console.log('\n[6] Tutorial subtopics with hierarchy\n');

    const subtopics = await pool.query(`
      SELECT
        ts.id AS subtopic_internal_id,
        ts.external_id AS subtopic_external_id,
        ts.name AS subtopic_name,
        ts.slug AS subtopic_slug,
        ts.topic_id,
        tt.name AS topic_name,
        tt.slug AS topic_slug
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON tt.id = ts.topic_id
      ORDER BY ts.name
      LIMIT 10
    `);

    console.table(subtopics.rows);

    // 7. Sidebar trees
    console.log('\n[7] Sidebar trees metadata\n');

    const sidebars = await pool.query(`
      SELECT
        id,
        brand_id,
        topic_id,
        status,
        version,
        created_at,
        updated_at
      FROM tutorial_sidebar_trees_v2
      ORDER BY brand_id, topic_id
    `);

    console.table(sidebars.rows);

    // 8. Page inventory from sidebars
    console.log('\n[8] Sidebar page inventory (canonical node.id values)\n');

    const trees = await pool.query(`
      SELECT
        id,
        brand_id,
        topic_id,
        tree
      FROM tutorial_sidebar_trees_v2
      ORDER BY brand_id, topic_id
    `);

    for (const sidebar of trees.rows) {
      const pages = collectPages(sidebar.tree);
      
      console.log(`\n━━━ Brand: ${sidebar.brand_id} | Topic: ${sidebar.topic_id} ━━━`);
      console.log(`Total pages: ${pages.length}\n`);
      
      if (pages.length > 0) {
        console.table(pages.slice(0, 15));
      } else {
        console.log('⚠️  No pages found in this sidebar');
      }
    }

    // 9. Subtopic → Page mapping evidence
    console.log('\n[9] Subtopic → Page Relationship Evidence\n');
    console.log('Attempting to map subtopics to their sidebar pages...\n');

    for (const subtopic of subtopics.rows.slice(0, 3)) {
      console.log(`\n▸ Subtopic: ${subtopic.subtopic_name}`);
      console.log(`  Internal ID: ${subtopic.subtopic_internal_id}`);
      console.log(`  External ID: ${subtopic.subtopic_external_id}`);
      console.log(`  Topic ID: ${subtopic.topic_id}`);
      
      // Find sidebar for this topic
      const sidebarForTopic = trees.rows.find(s => s.topic_id === subtopic.topic_id);
      
      if (sidebarForTopic) {
        console.log(`  ✓ Found sidebar for topic ${subtopic.topic_id}`);
        
        const allPages = collectPages(sidebarForTopic.tree);
        console.log(`  Total pages in topic: ${allPages.length}`);
        
        // Try to find pages that might belong to this subtopic
        // This requires understanding the tree structure
        console.log(`  Sample pages:`, allPages.slice(0, 5).map(p => p.nodeId));
      } else {
        console.log(`  ❌ NO SIDEBAR FOUND for topic ${subtopic.topic_id}`);
      }
    }

    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('AUDIT COMPLETE');
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
