#!/usr/bin/env node
/**
 * Phase 1 - Inspect Subtopic to Sidebar Relationship
 * 
 * CRITICAL: Determine how tutorial_subtopics maps to sidebar nodes
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║   PHASE 1 - SUBTOPIC ↔ SIDEBAR RELATIONSHIP                     ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

async function inspectRelationship() {
  try {
    console.log('[STEP 1] Get all subtopics with full hierarchy\n');
    
    const subtopics = await pool.query(`
      SELECT 
        ts.id as subtopic_id,
        ts.external_id as subtopic_external_id,
        ts.name as subtopic_name,
        ts.slug as subtopic_slug,
        ts.topic_id,
        tt.name as topic_name,
        tt.slug as topic_slug,
        tsu.name as subject_name,
        td.name as domain_name
      FROM tutorial_subtopics ts
      LEFT JOIN tutorial_topics tt ON ts.topic_id = tt.id
      LEFT JOIN tutorial_subjects tsu ON tt.subject_id = tsu.id
      LEFT JOIN tutorial_domains td ON tsu.domain_id = td.id
      ORDER BY ts.name
    `);
    
    console.log(`Found ${subtopics.rows.length} subtopic(s):\n`);
    
    for (const subtopic of subtopics.rows) {
      console.log('───────────────────────────────────────────────────────────────────');
      console.log(`Subtopic: ${subtopic.subtopic_name}`);
      console.log(`  Internal ID: ${subtopic.subtopic_id}`);
      console.log(`  External ID: ${subtopic.subtopic_external_id}`);
      console.log(`  Slug: ${subtopic.subtopic_slug}`);
      console.log(`  Hierarchy: ${subtopic.domain_name} → ${subtopic.subject_name} → ${subtopic.topic_name}`);
      console.log(`  Topic ID: ${subtopic.topic_id}\n`);
      
      // Get sidebar for this topic
      const sidebar = await pool.query(`
        SELECT 
          id,
          brand_id,
          tree
        FROM tutorial_sidebar_trees_v2
        WHERE topic_id = $1
        LIMIT 1
      `, [subtopic.topic_id]);
      
      if (sidebar.rows.length === 0) {
        console.log('  ⚠️  No sidebar found for this topic\n');
        continue;
      }
      
      const tree = sidebar.rows[0].tree;
      
      console.log(`  Sidebar Brand: ${sidebar.rows[0].brand_id}`);
      console.log(`  Searching for subtopic in sidebar tree...\n`);
      
      // Search for this subtopic in the tree
      const matches = findSubtopicInTree(tree, subtopic);
      
      if (matches.length === 0) {
        console.log('  ❌ Subtopic NOT found in sidebar tree');
        console.log('  This means external_id does NOT directly map to sidebar node.id\n');
      } else {
        console.log(`  ✅ Found ${matches.length} potential match(es):\n`);
        matches.forEach((match, i) => {
          console.log(`    Match ${i + 1}:`);
          console.log(`      Node ID: ${match.id}`);
          console.log(`      Node Type: ${match.type}`);
          console.log(`      Node Name: ${match.name}`);
          console.log(`      Path: ${match.path}\n`);
        });
      }
    }
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 2] Analyze sidebar structure patterns\n');
    
    const allSidebars = await pool.query(`
      SELECT tree, brand_id
      FROM tutorial_sidebar_trees_v2
    `);
    
    console.log(`Analyzing ${allSidebars.rows.length} sidebar tree(s)...\n`);
    
    for (const sidebar of allSidebars.rows) {
      console.log(`Brand: ${sidebar.brand_id}`);
      const structure = analyzeTreeStructure(sidebar.tree);
      console.log(`  Topics: ${structure.topics}`);
      console.log(`  Groups: ${structure.groups}`);
      console.log(`  Pages: ${structure.pages}`);
      console.log(`  Max depth: ${structure.maxDepth}\n`);
    }
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('✅ ANALYSIS COMPLETE\n');
    console.log('KEY FINDINGS:\n');
    console.log('1. Check if external_id matches any sidebar node.id');
    console.log('2. Identify the correct mapping pattern');
    console.log('3. Determine how to validate (subtopic + navigationNode) pairs\n');
    
  } catch (error) {
    console.error('\n❌ INSPECTION FAILED:', error.message);
    console.error('\nError details:', error);
  } finally {
    await pool.end();
  }
}

function findSubtopicInTree(tree, subtopic) {
  const matches = [];
  
  function search(node, path = []) {
    const currentPath = [...path, node.id || node.name];
    
    // Check various matching criteria
    if (node.id === subtopic.subtopic_external_id) {
      matches.push({ ...node, path: currentPath.join(' → '), matchType: 'external_id' });
    }
    
    if (node.id === subtopic.subtopic_slug) {
      matches.push({ ...node, path: currentPath.join(' → '), matchType: 'slug' });
    }
    
    if (node.name && node.name.toLowerCase() === subtopic.subtopic_name.toLowerCase()) {
      matches.push({ ...node, path: currentPath.join(' → '), matchType: 'name' });
    }
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => search(child, currentPath));
    }
  }
  
  if (tree.topics && Array.isArray(tree.topics)) {
    tree.topics.forEach(topic => search(topic));
  } else if (Array.isArray(tree)) {
    tree.forEach(node => search(node));
  } else {
    search(tree);
  }
  
  return matches;
}

function analyzeTreeStructure(tree) {
  const structure = {
    topics: 0,
    groups: 0,
    pages: 0,
    maxDepth: 0,
  };
  
  function analyze(node, depth = 0) {
    structure.maxDepth = Math.max(structure.maxDepth, depth);
    
    if (node.type === 'group') {
      if (depth === 0) {
        structure.topics++;
      } else {
        structure.groups++;
      }
    } else if (node.type === 'page') {
      structure.pages++;
    }
    
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => analyze(child, depth + 1));
    }
  }
  
  if (tree.topics && Array.isArray(tree.topics)) {
    tree.topics.forEach(topic => analyze(topic, 0));
  } else if (Array.isArray(tree)) {
    tree.forEach(node => analyze(node, 0));
  } else {
    analyze(tree, 0);
  }
  
  return structure;
}

inspectRelationship();
