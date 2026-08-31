#!/usr/bin/env node
/**
 * PHASE 8.1 — GATE 3: VERIFY EXISTING TUTORIALS
 * 
 * Query existing tutorial_sections for canonical Java fixture
 * to understand SectionAlreadyExistsError
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function main() {
  console.log('🔍 PHASE 8.1 — GATE 3: EXISTING TUTORIALS\n');
  
  // Get canonical Java subtopic internal ID
  const subtopicResult = await pool.query(`
    SELECT id, external_id, name, slug
    FROM tutorial_subtopics
    WHERE LOWER(name) LIKE '%what is java%'
      AND deleted_at IS NULL
    LIMIT 1
  `);
  
  if (subtopicResult.rows.length === 0) {
    console.error('❌ Java subtopic not found');
    process.exit(1);
  }
  
  const javaSubtopic = subtopicResult.rows[0];
  
  console.log('📦 Canonical Java Subtopic:\n');
  console.log(`   Internal ID:  ${javaSubtopic.id}`);
  console.log(`   External ID:  ${javaSubtopic.external_id}`);
  console.log(`   Name:         ${javaSubtopic.name}`);
  console.log(`   Slug:         ${javaSubtopic.slug}\n`);
  
  // Query ALL tutorials for this subtopic
  console.log('🔎 Querying ALL tutorials for this subtopic...\n');
  
  const tutorialsResult = await pool.query(`
    SELECT 
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      status,
      version,
      created_at,
      updated_at,
      published_at,
      deleted_at
    FROM tutorial_sections
    WHERE subtopic_id = $1
    ORDER BY 
      deleted_at NULLS FIRST,
      brand_id,
      navigation_node_id,
      created_at DESC
  `, [javaSubtopic.id]);
  
  console.log(`Found ${tutorialsResult.rows.length} tutorial(s):\n`);
  
  if (tutorialsResult.rows.length === 0) {
    console.log('   ✅ NO EXISTING TUTORIALS - Database is clean\n');
    console.log('   This means SectionAlreadyExistsError is likely caused by:');
    console.log('   - Test creating tutorial in beforeEach/beforeAll');
    console.log('   - Multiple tests running without cleanup between them');
    console.log('   - Test suite interference (one test creates, another expects clean state)\n');
  } else {
    let activeCount = 0;
    let deletedCount = 0;
    
    for (const row of tutorialsResult.rows) {
      const isDeleted = row.deleted_at !== null;
      if (isDeleted) {
        deletedCount++;
      } else {
        activeCount++;
      }
      
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Tutorial ID:       ${row.id}`);
      console.log(`Navigation Node:   ${row.navigation_node_id}`);
      console.log(`Brand:             ${row.brand_id}`);
      console.log(`Status:            ${row.status}`);
      console.log(`Version:           ${row.version}`);
      console.log(`Created:           ${row.created_at}`);
      console.log(`Updated:           ${row.updated_at}`);
      console.log(`Published:         ${row.published_at || 'NULL'}`);
      console.log(`Deleted:           ${row.deleted_at || 'NULL (ACTIVE)'}`);
      console.log(`State:             ${isDeleted ? '🗑️  SOFT DELETED' : '✅ ACTIVE'}`);
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    console.log(`📊 SUMMARY:\n`);
    console.log(`   Active tutorials:   ${activeCount}`);
    console.log(`   Deleted tutorials:  ${deletedCount}`);
    console.log(`   Total:              ${tutorialsResult.rows.length}\n`);
    
    // Analyze active tutorials
    if (activeCount > 0) {
      console.log('⚠️  ACTIVE TUTORIALS EXIST\n');
      console.log('   This explains SectionAlreadyExistsError if tests expect clean state.\n');
      
      const activeByIdentity = {};
      for (const row of tutorialsResult.rows) {
        if (row.deleted_at === null) {
          const key = `${row.navigation_node_id}|${row.brand_id}`;
          if (!activeByIdentity[key]) {
            activeByIdentity[key] = [];
          }
          activeByIdentity[key].push(row);
        }
      }
      
      console.log('   Active tutorials by identity:\n');
      for (const [key, rows] of Object.entries(activeByIdentity)) {
        const [navNode, brand] = key.split('|');
        console.log(`   • navigationNodeId="${navNode}", brandId="${brand}": ${rows.length} row(s)`);
        if (rows.length > 1) {
          console.log('     ❌ DUPLICATE VIOLATION - unique constraint should prevent this!');
        }
      }
      console.log('');
    }
  }
  
  // Check navigation node values used
  console.log('📋 Navigation Node IDs in use:\n');
  const navNodesResult = await pool.query(`
    SELECT DISTINCT navigation_node_id, COUNT(*) as count
    FROM tutorial_sections
    WHERE subtopic_id = $1
    GROUP BY navigation_node_id
    ORDER BY navigation_node_id
  `, [javaSubtopic.id]);
  
  if (navNodesResult.rows.length === 0) {
    console.log('   (none)\n');
  } else {
    for (const row of navNodesResult.rows) {
      const isCorrect = row.navigation_node_id === 'whatisjava';
      const status = isCorrect ? '✅ CORRECT' : '❌ INCORRECT';
      console.log(`   • "${row.navigation_node_id}": ${row.count} tutorial(s) ${status}`);
    }
    console.log('');
  }
  
  // Check brands in use
  console.log('🏢 Brands in use:\n');
  const brandsResult = await pool.query(`
    SELECT DISTINCT brand_id, COUNT(*) as count
    FROM tutorial_sections
    WHERE subtopic_id = $1
    GROUP BY brand_id
    ORDER BY brand_id
  `, [javaSubtopic.id]);
  
  if (brandsResult.rows.length === 0) {
    console.log('   (none)\n');
  } else {
    for (const row of brandsResult.rows) {
      console.log(`   • "${row.brand_id}": ${row.count} tutorial(s)`);
    }
    console.log('');
  }
  
  console.log('✅ GATE 3 COMPLETE\n');
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
