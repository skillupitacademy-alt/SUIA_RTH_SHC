#!/usr/bin/env node
/**
 * Forensic Investigation: Java vs Python Tutorial Content
 * 
 * Purpose: Determine if Java content was deleted, soft-deleted, replaced,
 * or stored under different identity
 */

import 'dotenv/config';
import { config } from 'dotenv';
import pkg from 'pg';

config({ path: '.env.local', override: true });

const { Client } = pkg;

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL_TUTORIAL });
  
  try {
    await client.connect();
    console.log('FORENSIC INVESTIGATION: Java vs Python Tutorial Content');
    console.log('='.repeat(80));
    console.log('');

    // ========================================================================
    // INVESTIGATION 1: Search ALL sections (including soft-deleted)
    // ========================================================================
    console.log('INVESTIGATION 1: ALL SECTIONS (including soft-deleted)');
    console.log('-'.repeat(80));
    
    const allSections = await client.query(`
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        deleted_at,
        created_at,
        updated_at,
        published_at
      FROM tutorial_sections
      WHERE
        subtopic_id IN (
          '414f63eb-cccf-4bd1-bcc0-b52df69ce499',  -- Java internal ID
          '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4',  -- Java external ID
          '497f6cf0-a74e-4e6a-a5c2-eea5395f50c9',  -- Python internal ID
          '5b1cfc3d-8744-4ae6-903c-ea79aaf648a0'   -- Python external ID
        )
        OR navigation_node_id IN ('whatisjava', 'whatispython')
      ORDER BY created_at, updated_at;
    `);

    console.log(`Found ${allSections.rows.length} section(s):\n`);
    
    if (allSections.rows.length === 0) {
      console.log('  ❌ NO SECTIONS FOUND (Java may have never been created)\n');
    } else {
      allSections.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. Section ID: ${row.id}`);
        console.log(`   Navigation Node: "${row.navigation_node_id}"`);
        console.log(`   Subtopic ID: ${row.subtopic_id}`);
        console.log(`   Brand: ${row.brand_id}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Deleted: ${row.deleted_at ? `YES (${row.deleted_at})` : 'NO'}`);
        console.log(`   Created: ${row.created_at}`);
        console.log(`   Updated: ${row.updated_at}`);
        console.log(`   Published: ${row.published_at || 'Never'}`);
        console.log('');
      });
    }

    // ========================================================================
    // INVESTIGATION 2: Search by navigation node pattern
    // ========================================================================
    console.log('INVESTIGATION 2: Search by Navigation Node Pattern');
    console.log('-'.repeat(80));
    
    const byNodePattern = await client.query(`
      SELECT
        id,
        subtopic_id,
        navigation_node_id,
        brand_id,
        status,
        deleted_at,
        created_at
      FROM tutorial_sections
      WHERE 
        navigation_node_id ILIKE '%java%'
        OR navigation_node_id ILIKE '%python%'
      ORDER BY created_at;
    `);

    console.log(`Found ${byNodePattern.rows.length} section(s) with java/python pattern:\n`);
    byNodePattern.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. "${row.navigation_node_id}" (${row.status}, deleted: ${!!row.deleted_at})`);
      console.log(`   Created: ${row.created_at}`);
      console.log('');
    });

    // ========================================================================
    // INVESTIGATION 3: Check ALL navigation nodes for both subtopics
    // ========================================================================
    console.log('INVESTIGATION 3: ALL Navigation Nodes for Java & Python Subtopics');
    console.log('-'.repeat(80));
    
    const allNodes = await client.query(`
      SELECT
        navigation_node_id,
        COUNT(*) as section_count,
        STRING_AGG(DISTINCT status::text, ', ') as statuses,
        STRING_AGG(DISTINCT CASE WHEN deleted_at IS NULL THEN 'active' ELSE 'deleted' END, ', ') as states
      FROM tutorial_sections
      WHERE subtopic_id IN (
        '414f63eb-cccf-4bd1-bcc0-b52df69ce499',  -- Java internal
        '497f6cf0-a74e-4e6a-a5c2-eea5395f50c9'   -- Python internal
      )
      GROUP BY navigation_node_id
      ORDER BY navigation_node_id;
    `);

    console.log(`Found ${allNodes.rows.length} distinct navigation node(s):\n`);
    allNodes.rows.forEach((row) => {
      console.log(`  "${row.navigation_node_id}"`);
      console.log(`    Sections: ${row.section_count}`);
      console.log(`    Statuses: ${row.statuses}`);
      console.log(`    States: ${row.states}`);
      console.log('');
    });

    // ========================================================================
    // INVESTIGATION 4: Timeline of all section changes
    // ========================================================================
    console.log('INVESTIGATION 4: Complete Timeline');
    console.log('-'.repeat(80));
    
    const timeline = await client.query(`
      SELECT
        id,
        navigation_node_id,
        brand_id,
        status,
        deleted_at,
        created_at,
        updated_at,
        published_at
      FROM tutorial_sections
      WHERE 
        navigation_node_id IN ('whatisjava', 'whatispython')
        OR subtopic_id IN (
          '414f63eb-cccf-4bd1-bcc0-b52df69ce499',
          '497f6cf0-a74e-4e6a-a5c2-eea5395f50c9'
        )
      ORDER BY created_at, updated_at;
    `);

    console.log('Chronological order of events:\n');
    timeline.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.created_at.toISOString()}`);
      console.log(`   Action: CREATED section for "${row.navigation_node_id}"`);
      console.log(`   Section ID: ${row.id}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
      
      if (row.updated_at.getTime() !== row.created_at.getTime()) {
        console.log(`   Last Updated: ${row.updated_at.toISOString()}`);
      }
      
      if (row.published_at) {
        console.log(`   Published: ${row.published_at.toISOString()}`);
      }
      console.log('');
    });

    // ========================================================================
    // INVESTIGATION 5: Check LSNB navigation progress
    // ========================================================================
    console.log('INVESTIGATION 5: LSNB Navigation Progress Records');
    console.log('-'.repeat(80));
    
    const lsnbRecords = await client.query(`
      SELECT
        id,
        user_id,
        navigation_node_id,
        subtopic_id,
        section_id,
        status,
        visit_count,
        created_at,
        updated_at,
        deleted_at
      FROM tutorial_navigation_progress
      WHERE navigation_node_id IN ('whatisjava', 'whatispython')
      ORDER BY created_at;
    `);

    console.log(`Found ${lsnbRecords.rows.length} LSNB record(s):\n`);
    
    if (lsnbRecords.rows.length === 0) {
      console.log('  (No learner progress records found)\n');
    } else {
      lsnbRecords.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. Navigation Node: "${row.navigation_node_id}"`);
        console.log(`   User ID: ${row.user_id}`);
        console.log(`   Subtopic ID: ${row.subtopic_id}`);
        console.log(`   Section ID: ${row.section_id || 'NULL'}`);
        console.log(`   Status: ${row.status}`);
        console.log(`   Visits: ${row.visit_count}`);
        console.log(`   Deleted: ${row.deleted_at ? 'YES' : 'NO'}`);
        console.log('');
      });
    }

    // ========================================================================
    // INVESTIGATION 6: Check sidebar tree navigation nodes
    // ========================================================================
    console.log('INVESTIGATION 6: Sidebar Navigation Tree Nodes');
    console.log('-'.repeat(80));
    
    const sidebars = await client.query(`
      SELECT
        id,
        brand_id,
        topic_id,
        status,
        tree
      FROM tutorial_sidebar_trees_v2
      WHERE 
        brand_id IN ('shared', 'skillup', 'realtutorialhub')
        AND status = 'published'
      ORDER BY brand_id;
    `);

    console.log(`Found ${sidebars.rows.length} published sidebar(s):\n`);
    
    sidebars.rows.forEach((sidebar) => {
      console.log(`  Brand: ${sidebar.brand_id}`);
      console.log(`  Topic ID: ${sidebar.topic_id}`);
      
      // Parse tree JSON to find whatisjava and whatispython nodes
      const tree = sidebar.tree;
      const findNodes = (nodes, path = []) => {
        const found = [];
        if (!nodes) return found;
        
        for (const node of nodes) {
          const currentPath = [...path, node.name || node.id];
          
          if (node.id === 'whatisjava' || node.id === 'whatispython') {
            found.push({
              id: node.id,
              name: node.name,
              path: currentPath.join(' > '),
              hasUrl: !!node.url,
              hasSlug: !!node.slug
            });
          }
          
          if (node.children) {
            found.push(...findNodes(node.children, currentPath));
          }
        }
        return found;
      };
      
      const nodes = findNodes(tree.topics || []);
      
      if (nodes.length > 0) {
        console.log('  Navigation nodes found:');
        nodes.forEach(n => {
          console.log(`    - "${n.id}" (${n.name})`);
          console.log(`      Path: ${n.path}`);
          console.log(`      Has URL: ${n.hasUrl}`);
        });
      } else {
        console.log('  (No whatisjava or whatispython nodes found in tree)');
      }
      console.log('');
    });

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================
    console.log('='.repeat(80));
    console.log('INVESTIGATION SUMMARY');
    console.log('='.repeat(80));
    console.log('');
    
    const activeSections = allSections.rows.filter(r => !r.deleted_at);
    const deletedSections = allSections.rows.filter(r => r.deleted_at);
    const javaSection = allSections.rows.find(r => r.navigation_node_id === 'whatisjava');
    const pythonSection = allSections.rows.find(r => r.navigation_node_id === 'whatispython');
    
    console.log(`Total sections found: ${allSections.rows.length}`);
    console.log(`Active sections: ${activeSections.length}`);
    console.log(`Deleted sections: ${deletedSections.length}`);
    console.log('');
    
    console.log('Java Tutorial Status:');
    if (!javaSection) {
      console.log('  ❌ NO SECTION FOUND (never created or fully deleted)');
    } else if (javaSection.deleted_at) {
      console.log(`  ⚠️  SOFT-DELETED on ${javaSection.deleted_at}`);
      console.log(`     Was created on ${javaSection.created_at}`);
    } else {
      console.log(`  ✅ EXISTS (Status: ${javaSection.status})`);
      console.log(`     Created: ${javaSection.created_at}`);
      console.log(`     Published: ${javaSection.published_at || 'Never'}`);
    }
    console.log('');
    
    console.log('Python Tutorial Status:');
    if (!pythonSection) {
      console.log('  ❌ NO SECTION FOUND');
    } else if (pythonSection.deleted_at) {
      console.log(`  ⚠️  SOFT-DELETED on ${pythonSection.deleted_at}`);
    } else {
      console.log(`  ✅ EXISTS (Status: ${pythonSection.status})`);
      console.log(`     Created: ${pythonSection.created_at}`);
      console.log(`     Published: ${pythonSection.published_at || 'Never'}`);
    }
    console.log('');
    
    console.log('Possible Scenarios:');
    if (!javaSection) {
      console.log('  Scenario A: Java was never created in this database');
      console.log('  Scenario E: Java exists in different environment/database');
    } else if (javaSection.deleted_at) {
      console.log('  Scenario A: Java was soft-deleted');
      console.log('  Check updated_at to see when deletion occurred');
      console.log(`  Java updated: ${javaSection.updated_at}`);
      if (pythonSection) {
        console.log(`  Python created: ${pythonSection.created_at}`);
        if (new Date(pythonSection.created_at) < new Date(javaSection.updated_at)) {
          console.log('  ⚠️  Python was created BEFORE Java was deleted!');
        }
      }
    } else if (javaSection.status !== 'deployed') {
      console.log('  Java exists but is not published');
      console.log(`  Current status: ${javaSection.status}`);
    }
    
  } finally {
    await client.end();
  }
}

main().catch(console.error);
