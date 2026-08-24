#!/usr/bin/env node
/**
 * Phase 1 Identity Mapping Discovery
 * 
 * Discovers how tutorial_subtopics map to sidebar pages
 * WITHOUT modifying any data
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

function collectAllNodes(tree) {
  const nodes = [];

  function walk(node, level = 0, path = []) {
    const currentPath = [...path, node.id || 'unnamed'];
    
    nodes.push({
      level,
      id: node.id,
      type: node.type,
      name: node.name,
      slug: node.slug,
      externalId: node.externalId,
      path: currentPath.join(' → '),
      childrenCount: Array.isArray(node.children) ? node.children.length : 0,
    });

    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        walk(child, level + 1, currentPath);
      }
    }
  }

  if (Array.isArray(tree?.topics)) {
    for (const topic of tree.topics) {
      walk(topic, 0);
    }
  }

  return nodes;
}

async function investigate() {
  try {
    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('PHASE 1 — SUBTOPIC/SIDEBAR IDENTITY MAPPING DISCOVERY');
    console.log('══════════════════════════════════════════════════════════════════\n');

    // STEP 1: Complete tutorial_topics inspection
    console.log('[1] Tutorial Topics - Complete Identity Information\n');

    const topics = await pool.query(`
      SELECT
        id,
        external_id,
        name,
        slug
      FROM tutorial_topics
      ORDER BY name
    `);

    console.table(topics.rows);

    // STEP 2: Complete tutorial_subtopics with parent info
    console.log('\n[2] Tutorial Subtopics - With Parent Topic Details\n');

    const subtopics = await pool.query(`
      SELECT
        ts.id AS subtopic_id,
        ts.external_id AS subtopic_external_id,
        ts.name AS subtopic_name,
        ts.slug AS subtopic_slug,
        ts.topic_id AS subtopic_topic_id,
        tt.id AS parent_topic_id,
        tt.external_id AS parent_topic_external_id,
        tt.name AS parent_topic_name,
        tt.slug AS parent_topic_slug
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON tt.id = ts.topic_id
      ORDER BY tt.name, ts.name
    `);

    console.table(subtopics.rows);

    // STEP 3: Sidebar root nodes and complete structure
    console.log('\n[3] Sidebar Trees - Complete Structure\n');

    const sidebars = await pool.query(`
      SELECT
        id,
        brand_id,
        topic_id AS sidebar_topic_id,
        tree
      FROM tutorial_sidebar_trees_v2
      ORDER BY brand_id, topic_id
    `);

    for (const sidebar of sidebars.rows) {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Sidebar ID: ${sidebar.id}`);
      console.log(`Brand: ${sidebar.brand_id}`);
      console.log(`Topic ID: ${sidebar.sidebar_topic_id}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      const allNodes = collectAllNodes(sidebar.tree);
      
      // Show root nodes
      console.log('Root Nodes (Level 0):');
      const roots = allNodes.filter(n => n.level === 0);
      console.table(roots);

      // Show groups (Level 1)
      console.log('\nGroups (Level 1):');
      const groups = allNodes.filter(n => n.level === 1);
      console.table(groups);

      // Sample pages
      console.log('\nSample Pages (Level 2+):');
      const pages = allNodes.filter(n => n.type === 'page').slice(0, 10);
      console.table(pages);

      console.log(`\nTotal nodes: ${allNodes.length}`);
      console.log(`Total pages: ${allNodes.filter(n => n.type === 'page').length}`);
    }

    // STEP 4: Identity comparison matrix
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[4] IDENTITY COMPARISON MATRIX');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test mapping candidates for Java
    console.log('▸ JAVA Mapping Analysis\n');

    const javaSubtopics = subtopics.rows.filter(s => s.parent_topic_name === 'Java');
    const javaSidebar = sidebars.rows.find(s => {
      const allNodes = collectAllNodes(s.tree);
      return allNodes.some(n => n.id === 'java');
    });

    if (javaSidebar && javaSubtopics.length > 0) {
      const javaNodes = collectAllNodes(javaSidebar.tree);
      const javaRoot = javaNodes.find(n => n.level === 0);

      console.log('Tutorial Topic:');
      const javaTopic = topics.rows.find(t => t.name === 'Java');
      console.table([javaTopic]);

      console.log('\nSidebar Root Node:');
      console.table([javaRoot]);

      console.log('\nMapping Tests:');
      console.log('─'.repeat(60));

      // Test A: Topic slug match
      const topicSlugMatch = javaTopic?.slug === javaRoot?.id;
      console.log(`A. topic.slug === sidebar_root.id`);
      console.log(`   ${javaTopic?.slug} === ${javaRoot?.id}`);
      console.log(`   Result: ${topicSlugMatch ? '✅ MATCH' : '❌ NO MATCH'}\n`);

      // Test B: Topic name lowercase
      const nameLowerMatch = javaTopic?.name?.toLowerCase() === javaRoot?.id;
      console.log(`B. topic.name.toLowerCase() === sidebar_root.id`);
      console.log(`   ${javaTopic?.name?.toLowerCase()} === ${javaRoot?.id}`);
      console.log(`   Result: ${nameLowerMatch ? '✅ MATCH' : '❌ NO MATCH'}\n`);

      // Test C: Topic external_id
      const externalIdMatch = javaTopic?.external_id === javaRoot?.id;
      console.log(`C. topic.external_id === sidebar_root.id`);
      console.log(`   ${javaTopic?.external_id} === ${javaRoot?.id}`);
      console.log(`   Result: ${externalIdMatch ? '✅ MATCH' : '❌ NO MATCH'}\n`);

      console.log('\nJava Subtopics vs Sidebar Groups:');
      console.log('─'.repeat(60));
      
      for (const subtopic of javaSubtopics) {
        console.log(`\nSubtopic: "${subtopic.subtopic_name}"`);
        console.log(`  ID: ${subtopic.subtopic_id}`);
        console.log(`  External ID: ${subtopic.subtopic_external_id}`);
        console.log(`  Slug: ${subtopic.subtopic_slug}`);
        
        // Find potential matching nodes
        const potentialMatches = javaNodes.filter(n => 
          n.id === subtopic.subtopic_slug ||
          n.id === subtopic.subtopic_external_id ||
          n.name?.toLowerCase() === subtopic.subtopic_name?.toLowerCase() ||
          n.slug === subtopic.subtopic_slug
        );

        if (potentialMatches.length > 0) {
          console.log(`  ✅ Potential matches found:`);
          console.table(potentialMatches);
        } else {
          console.log(`  ❌ NO matches found in sidebar`);
          
          // Show what IS in the sidebar
          const groups = javaNodes.filter(n => n.type === 'group');
          console.log(`  Available sidebar groups:`, groups.map(g => g.id).slice(0, 5));
        }
      }
    }

    // STEP 5: Python mapping
    console.log('\n▸ PYTHON Mapping Analysis\n');

    const pythonSubtopics = subtopics.rows.filter(s => s.parent_topic_name === 'Python');
    const pythonSidebar = sidebars.rows.find(s => {
      const allNodes = collectAllNodes(s.tree);
      return allNodes.some(n => n.id === 'python');
    });

    if (pythonSidebar && pythonSubtopics.length > 0) {
      const pythonNodes = collectAllNodes(pythonSidebar.tree);
      const pythonRoot = pythonNodes.find(n => n.level === 0);

      console.log('Tutorial Topic:');
      const pythonTopic = topics.rows.find(t => t.name === 'Python');
      console.table([pythonTopic]);

      console.log('\nSidebar Root Node:');
      console.table([pythonRoot]);

      console.log('\nPython Subtopics vs Sidebar Groups:');
      console.log('─'.repeat(60));

      for (const subtopic of pythonSubtopics) {
        console.log(`\nSubtopic: "${subtopic.subtopic_name}"`);
        console.log(`  Slug: ${subtopic.subtopic_slug}`);
        
        const potentialMatches = pythonNodes.filter(n =>
          n.id === subtopic.subtopic_slug ||
          n.id === subtopic.subtopic_external_id ||
          n.name?.toLowerCase() === subtopic.subtopic_name?.toLowerCase()
        );

        if (potentialMatches.length > 0) {
          console.log(`  ✅ Potential matches:`);
          console.table(potentialMatches);
        } else {
          console.log(`  ❌ NO matches`);
        }
      }
    }

    // STEP 6: Duplicate subtopic investigation
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[5] DUPLICATE SUBTOPIC INVESTIGATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const duplicateNames = await pool.query(`
      SELECT
        name,
        COUNT(*)::int AS count
      FROM tutorial_subtopics
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    console.log('Duplicate Subtopic Names:');
    console.table(duplicateNames.rows);

    for (const dup of duplicateNames.rows) {
      console.log(`\n▸ Duplicate: "${dup.name}"\n`);
      
      const instances = await pool.query(`
        SELECT
          id,
          external_id,
          name,
          slug,
          topic_id,
          created_at
        FROM tutorial_subtopics
        WHERE name = $1
        ORDER BY created_at
      `, [dup.name]);

      console.table(instances.rows);

      // Check which one might match sidebar
      if (javaSidebar) {
        const javaNodes = collectAllNodes(javaSidebar.tree);
        
        for (const instance of instances.rows) {
          const matches = javaNodes.filter(n =>
            n.id === instance.slug ||
            n.id?.replace(/\?/g, '') === instance.slug ||
            n.id === 'what-is-java' // known page
          );

          if (matches.length > 0) {
            console.log(`\n  Instance ${instance.id}:`);
            console.log(`    Slug: ${instance.slug}`);
            console.log(`    ✅ Matches sidebar nodes:`);
            console.table(matches);
          }
        }
      }
    }

    console.log('\n══════════════════════════════════════════════════════════════════');
    console.log('INVESTIGATION COMPLETE');
    console.log('══════════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ INVESTIGATION FAILED:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

investigate();
