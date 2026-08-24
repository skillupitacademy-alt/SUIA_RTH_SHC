#!/usr/bin/env node
/**
 * Phase 1 - Inspect Sidebar Structure
 * 
 * Examines the actual normalized sidebar tree structure
 * to understand how navigation nodes are stored
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('╔═══════════════════════════════════════════════════════════════════╗');
console.log('║   PHASE 1 - SIDEBAR STRUCTURE INSPECTION                        ║');
console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

async function inspectSidebar() {
  try {
    console.log('[STEP 1] Fetch all sidebar trees\n');
    
    const sidebars = await pool.query(`
      SELECT 
        id,
        brand_id,
        tree,
        created_at,
        updated_at
      FROM tutorial_sidebar_trees_v2
      ORDER BY brand_id
    `);
    
    console.log(`Found ${sidebars.rows.length} sidebar tree(s)\n`);
    
    for (const sidebar of sidebars.rows) {
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log(`Sidebar ID: ${sidebar.id}`);
      console.log(`Brand: ${sidebar.brand_id}`);
      console.log(`Created: ${sidebar.created_at}`);
      console.log(`Updated: ${sidebar.updated_at}\n`);
      
      const treeData = sidebar.tree;
      
      console.log('Tree Structure Sample:');
      console.log(JSON.stringify(treeData, null, 2).substring(0, 2000));
      console.log('\n');
      
      // Extract navigation nodes recursively
      console.log('Navigation Nodes Found:\n');
      
      function extractNodes(node, path = [], depth = 0) {
        const indent = '  '.repeat(depth);
        const pathStr = path.length > 0 ? path.join(' → ') + ' → ' : '';
        
        if (node.id) {
          console.log(`${indent}${pathStr}${node.id} (${node.type || 'unknown type'}) "${node.name || 'unnamed'}"`);
        }
        
        if (node.children && Array.isArray(node.children)) {
          const newPath = node.id ? [...path, node.id] : path;
          node.children.forEach(child => extractNodes(child, newPath, depth + 1));
        }
      }
      
      if (Array.isArray(treeData)) {
        treeData.forEach(rootNode => extractNodes(rootNode));
      } else if (treeData.domains && Array.isArray(treeData.domains)) {
        treeData.domains.forEach(domain => extractNodes(domain));
      } else {
        extractNodes(treeData);
      }
      
      console.log('\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('[STEP 2] Find all subtopics\n');
    
    const subtopics = await pool.query(`
      SELECT 
        id,
        external_id,
        name,
        slug
      FROM tutorial_subtopics
      ORDER BY name
    `);
    
    console.log(`Found ${subtopics.rows.length} subtopic(s):\n`);
    subtopics.rows.forEach(st => {
      console.log(`  Subtopic ID: ${st.id}`);
      console.log(`  External ID: ${st.external_id}`);
      console.log(`  Name: ${st.name}`);
      console.log(`  Slug: ${st.slug}\n`);
    });
    
    console.log('═══════════════════════════════════════════════════════════════════\n');
    console.log('✅ SIDEBAR INSPECTION COMPLETE\n');
    console.log('Key Observations:');
    console.log('  1. Each navigation node has an "id" field (canonical identity)');
    console.log('  2. Nodes have "type" (e.g., group, page)');
    console.log('  3. Nodes have "name" (display label)');
    console.log('  4. Children form hierarchical structure\n');
    console.log('Phase 1 Rule:');
    console.log('  navigationNodeId MUST use node.id');
    console.log('  NOT derived from name, slug, or position\n');
    
  } catch (error) {
    console.error('\n❌ INSPECTION FAILED:', error.message);
    console.error('\nError details:', error);
  } finally {
    await pool.end();
  }
}

inspectSidebar();
