#!/usr/bin/env node
/**
 * PHASE 8.1 — GATE 1: VERIFY CANONICAL FIXTURE
 * 
 * READ-ONLY investigation to verify:
 * - canonical Java subtopic internal/external IDs
 * - topic bridge
 * - sidebar navigation node
 * - actual navigationNodeId value
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function main() {
  console.log('🔍 PHASE 8.1 — GATE 1: VERIFY CANONICAL FIXTURE\n');
  
  // Find canonical Java subtopic
  console.log('1. Finding canonical Java subtopic...\n');
  
  const subtopicResult = await pool.query(`
    SELECT 
      id,
      external_id,
      name,
      slug,
      topic_id,
      deleted_at
    FROM tutorial_subtopics
    WHERE LOWER(name) LIKE '%what is java%'
      AND deleted_at IS NULL
    LIMIT 1
  `);
  
  if (subtopicResult.rows.length === 0) {
    console.error('❌ Canonical Java subtopic NOT FOUND');
    console.error('   Expected: name containing "what is java"');
    process.exit(1);
  }
  
  const javaSubtopic = subtopicResult.rows[0];
  
  console.log('✅ Canonical Java Subtopic Found:\n');
  console.log(`   Internal ID:  ${javaSubtopic.id}`);
  console.log(`   External ID:  ${javaSubtopic.external_id}`);
  console.log(`   Name:         ${javaSubtopic.name}`);
  console.log(`   Slug:         ${javaSubtopic.slug}`);
  console.log(`   Topic ID:     ${javaSubtopic.topic_id}`);
  console.log(`   Deleted At:   ${javaSubtopic.deleted_at}`);
  
  // Verify topic bridge
  console.log('\n2. Verifying topic bridge...\n');
  
  const topicResult = await pool.query(`
    SELECT 
      id,
      external_id,
      name,
      slug
    FROM tutorial_topics
    WHERE id = $1
  `, [javaSubtopic.topic_id]);
  
  if (topicResult.rows.length === 0) {
    console.error('❌ Topic NOT FOUND');
    console.error(`   Expected topic_id: ${javaSubtopic.topic_id}`);
    process.exit(1);
  }
  
  const javaTopic = topicResult.rows[0];
  
  console.log('✅ Topic Found:\n');
  console.log(`   Internal ID:    ${javaTopic.id}`);
  console.log(`   External ID:    ${javaTopic.external_id}`);
  console.log(`   Name:           ${javaTopic.name}`);
  console.log(`   Slug:           ${javaTopic.slug}`);
  
  // Find sidebar for this topic
  console.log('\n3. Finding sidebar navigation for this topic...\n');
  
  const sidebarResult = await pool.query(`
    SELECT 
      topic_id,
      brand_id,
      status,
      tree
    FROM tutorial_sidebar_trees_v2
    WHERE topic_id = $1
      AND brand_id = $2
  `, [javaTopic.external_id, 'shared']);
  
  if (sidebarResult.rows.length === 0) {
    console.error('❌ Sidebar NOT FOUND');
    console.error(`   Expected: topicId="${javaTopic.external_id}", brandId="shared"`);
    process.exit(1);
  }
  
  const sidebar = sidebarResult.rows[0];
  
  console.log('✅ Sidebar Found:\n');
  console.log(`   Topic ID:    ${sidebar.topic_id}`);
  console.log(`   Brand ID:    ${sidebar.brand_id}`);
  console.log(`   Status:      ${sidebar.status}`);
  
  // Parse and inspect navigation tree
  console.log('\n4. Inspecting navigation tree structure...\n');
  
  const tree = sidebar.tree;
  
  if (!tree || typeof tree !== 'object') {
    console.error('❌ Invalid tree structure');
    process.exit(1);
  }
  
  console.log(`   Tree has ${Object.keys(tree).length} top-level keys`);
  
  // Find the Java subtopic navigation node
  function findNodeById(obj, targetId) {
    if (typeof obj !== 'object' || obj === null) return null;
    
    if (obj.id === targetId) {
      return obj;
    }
    
    // Check in topics array (root level)
    if (obj.topics && Array.isArray(obj.topics)) {
      for (const topic of obj.topics) {
        const found = findNodeById(topic, targetId);
        if (found) return found;
      }
    }
    
    // Check in children array (nested levels)
    if (obj.children && Array.isArray(obj.children)) {
      for (const child of obj.children) {
        const found = findNodeById(child, targetId);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  const javaNode = findNodeById(tree, 'whatisjava');
  
  if (!javaNode) {
    console.error('❌ Java navigation node NOT FOUND in tree');
    console.error('   Searched for: id="whatisjava"');
    console.log('\n📋 Available page nodes in tree:');
    
    function listAllNodes(obj, indent = '   ') {
      if (typeof obj !== 'object' || obj === null) return;
      
      if (obj.type === 'page' && obj.id) {
        console.log(`${indent}${obj.name} (id: ${obj.id}, slug: ${obj.slug || 'N/A'})`);
      }
      
      if (obj.topics && Array.isArray(obj.topics)) {
        for (const topic of obj.topics) {
          listAllNodes(topic, indent);
        }
      }
      
      if (obj.children && Array.isArray(obj.children)) {
        for (const child of obj.children) {
          listAllNodes(child, indent + '  ');
        }
      }
    }
    
    listAllNodes(tree);
    
    process.exit(1);
  }
  
  console.log('✅ Java Navigation Node Found:\n');
  console.log(`   Node ID:     ${javaNode.id}`);
  console.log(`   Name:        ${javaNode.name}`);
  console.log(`   Slug:        ${javaNode.slug}`);
  console.log(`   Type:        ${javaNode.type || 'N/A'}`);
  
  // CRITICAL VERIFICATION
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 CANONICAL NAVIGATION NODE VERIFICATION:\n');
  console.log(`   Expected by Phase 8.1 prompt: "whatisjava"`);
  console.log(`   Actual in sidebar tree:       "${javaNode.id}"`);
  
  if (javaNode.id === 'whatisjava') {
    console.log('\n   ✅ MATCH: Navigation node is "whatisjava" (no hyphens)');
  } else if (javaNode.id === 'what-is-java') {
    console.log('\n   ❌ MISMATCH: Navigation node is "what-is-java" (with hyphens)');
    console.log('   ⚠️  Current tests use "what-is-java" — this matches database');
    console.log('   ⚠️  Phase 8.1 prompt says "whatisjava" — needs investigation');
  } else {
    console.log(`\n   ⚠️  UNEXPECTED: Navigation node is "${javaNode.id}"`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Summary
  console.log('📊 GATE 1 SUMMARY:\n');
  console.log(`   Subtopic Internal ID:  ${javaSubtopic.id}`);
  console.log(`   Subtopic External ID:  ${javaSubtopic.external_id}`);
  console.log(`   Topic External ID:     ${javaTopic.external_id}`);
  console.log(`   Sidebar Topic ID:      ${sidebar.topic_id}`);
  console.log(`   Navigation Node ID:    ${javaNode.id}`);
  console.log(`   Brand:                 ${sidebar.brand_id}`);
  
  console.log('\n✅ GATE 1 COMPLETE\n');
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
    process.exit(0);
  });
