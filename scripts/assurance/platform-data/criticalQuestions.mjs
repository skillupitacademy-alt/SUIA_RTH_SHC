#!/usr/bin/env node

/**
 * Phase 0A Critical Questions Investigation
 * Answers specific architecture questions using actual database queries
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..', '..', '..');

function readConnectionString(appPath, varName) {
  const envPath = join(PROJECT_ROOT, appPath, '.env.local');
  try {
    const content = readFileSync(envPath, 'utf-8');
    const pattern = new RegExp(`^${varName}=["']?([^"'\\n]+)["']?$`, 'm');
    const match = content.match(pattern);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function investigateTutorialSections() {
  console.log('\n🔍 CRITICAL QUESTION A: tutorial_sections IDENTITY\n');
  
  const connectionString = readConnectionString('apps/skillhubcore-admin', 'DATABASE_URL_TUTORIAL');
  if (!connectionString) {
    console.log('❌ Cannot connect to tutorial_prod');
    return;
  }
  
  const sql = neon(connectionString);
  
  // Sample actual data
  const sample = await sql(`
    SELECT id, subtopic_id, navigation_node_id, brand_id, deleted_at, status
    FROM tutorial_sections
    LIMIT 10
  `);
  
  console.log('Sample data from tutorial_sections:');
  console.table(sample.map(row => ({
    id: row.id.substring(0, 8),
    subtopic_id: row.subtopic_id.substring(0, 8),
    navigation_node_id: row.navigation_node_id,
    brand_id: row.brand_id,
    deleted_at: row.deleted_at,
    status: row.status,
  })));
  
  // Check for duplicates if constraint didn't exist
  const duplicates = await sql(`
    SELECT subtopic_id, navigation_node_id, brand_id, COUNT(*) as count
    FROM tutorial_sections
    WHERE deleted_at IS NULL
    GROUP BY subtopic_id, navigation_node_id, brand_id
    HAVING COUNT(*) > 1
  `);
  
  console.log(`\n✅ Duplicate check: ${duplicates.length} duplicates found`);
  
  // Check navigationNodeId format
  const nodeIdSample = await sql(`
    SELECT DISTINCT navigation_node_id
    FROM tutorial_sections
    ORDER BY navigation_node_id
    LIMIT 20
  `);
  
  console.log('\nSample navigation_node_id values:');
  nodeIdSample.forEach(row => {
    console.log(`  - ${row.navigation_node_id}`);
  });
}

async function investigateNavigationNodeIdStorage() {
  console.log('\n🔍 CRITICAL QUESTION B: navigationNodeId STORAGE\n');
  
  const connectionString = readConnectionString('apps/skillhubcore-admin', 'DATABASE_URL_TUTORIAL');
  if (!connectionString) {
    console.log('❌ Cannot connect to tutorial_prod');
    return;
  }
  
  const sql = neon(connectionString);
  
  // Check if there's a navigation_nodes table
  const tables = await sql(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name LIKE '%navigation%'
    ORDER BY table_name
  `);
  
  console.log('Tables with "navigation" in name:');
  tables.forEach(row => console.log(`  - ${row.table_name}`));
  
  // Check sidebar_trees for navigation structure
  const sidebarColumns = await sql(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tutorial_sidebar_trees_v2'
    ORDER BY ordinal_position
  `);
  
  console.log('\nColumns in tutorial_sidebar_trees_v2:');
  sidebarColumns.forEach(row => console.log(`  - ${row.column_name}`));
  
  const sidebarSample = await sql(`
    SELECT *
    FROM tutorial_sidebar_trees_v2
    LIMIT 3
  `);
  
  console.log('\nSample tutorial_sidebar_trees_v2:');
  sidebarSample.forEach((row, idx) => {
    console.log(`\n  Row ${idx + 1}:`);
    Object.keys(row).forEach(key => {
      if (key === 'sidebar_tree') {
        const treePreview = JSON.stringify(row[key]).substring(0, 150);
        console.log(`    ${key}: ${treePreview}...`);
      } else if (typeof row[key] === 'string' && row[key].length > 36) {
        console.log(`    ${key}: ${row[key].substring(0, 36)}...`);
      } else {
        console.log(`    ${key}: ${row[key]}`);
      }
    });
  });
}

async function investigateSubtopicIdentity() {
  console.log('\n🔍 CRITICAL QUESTION C: SUBTOPIC IDENTITY\n');
  
  const quizConn = readConnectionString('apps/api-server', 'DATABASE_URL');
  const tutorialConn = readConnectionString('apps/skillhubcore-admin', 'DATABASE_URL_TUTORIAL');
  
  if (quizConn) {
    const sql = neon(quizConn);
    
    // Check column names first
    const cols = await sql(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'subtopics'
      LIMIT 10
    `);
    console.log('Quiz DB subtopics columns:', cols.map(c => c.column_name).join(', '));
    
    const subtopics = await sql(`
      SELECT *
      FROM subtopics
      LIMIT 3
    `);
    
    console.log('\nQuiz DB subtopics (sample):');
    console.log(JSON.stringify(subtopics[0], null, 2).substring(0, 300));
  }
  
  if (tutorialConn) {
    const sql = neon(tutorialConn);
    
    // Check column names first
    const cols = await sql(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tutorial_subtopics'
      ORDER BY ordinal_position
    `);
    console.log('\nTutorial DB tutorial_subtopics columns:', cols.map(c => c.column_name).join(', '));
    
    const tutorialSubtopics = await sql(`
      SELECT *
      FROM tutorial_subtopics
      LIMIT 3
    `);
    
    console.log('\nTutorial DB tutorial_subtopics (sample):');
    if (tutorialSubtopics.length > 0) {
      console.log(JSON.stringify(tutorialSubtopics[0], null, 2).substring(0, 300));
    }
  }
}

async function investigateBlockIdentity() {
  console.log('\n🔍 CRITICAL QUESTION D: BLOCK IDENTITY\n');
  
  const connectionString = readConnectionString('apps/skillhubcore-admin', 'DATABASE_URL_TUTORIAL');
  if (!connectionString) {
    console.log('❌ Cannot connect to tutorial_prod');
    return;
  }
  
  const sql = neon(connectionString);
  
  const sectionSample = await sql(`
    SELECT id, content
    FROM tutorial_sections
    LIMIT 1
  `);
  
  if (sectionSample.length > 0) {
    const content = sectionSample[0].content;
    console.log('Sample section content structure:');
    
    if (content.blocks && Array.isArray(content.blocks)) {
      console.log(`  Total blocks: ${content.blocks.length}`);
      if (content.blocks.length > 0) {
        const firstBlock = content.blocks[0];
        console.log('  First block structure:');
        console.log(`    id: ${firstBlock.id || 'MISSING'}`);
        console.log(`    type: ${firstBlock.type || 'MISSING'}`);
        console.log(`    Keys: ${Object.keys(firstBlock).join(', ')}`);
      }
    } else {
      console.log('  Content structure:', Object.keys(content));
    }
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 0A - CRITICAL QUESTIONS INVESTIGATION');
  console.log('='.repeat(60));
  
  try {
    await investigateTutorialSections();
    await investigateNavigationNodeIdStorage();
    await investigateSubtopicIdentity();
    await investigateBlockIdentity();
    
    console.log('\n' + '='.repeat(60));
    console.log('INVESTIGATION COMPLETE');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Investigation failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
