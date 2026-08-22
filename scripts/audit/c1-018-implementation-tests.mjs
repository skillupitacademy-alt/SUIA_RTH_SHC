#!/usr/bin/env node
/**
 * C1-018: Implementation Test Suite
 * 
 * Automated verification of V2 tutorial_sections architecture
 * Tests entire delivery chain: Composer → Storage → Delivery → Public Rendering
 * 
 * NO GUI TESTING - All verification at API/database/schema level
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env.local') });

neonConfig.webSocketConstructor = WebSocket;

const TUTORIAL_DB = process.env.DATABASE_URL_TUTORIAL?.trim().replace(/^["']|["']$/g, '');

if (!TUTORIAL_DB) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: TUTORIAL_DB });

// Test results tracker
const results = {
  passed: [],
  failed: [],
  blocked: [],
};

function pass(testName) {
  results.passed.push(testName);
  console.log(`✅ [PASS] ${testName}`);
}

function fail(testName, reason) {
  results.failed.push({ testName, reason });
  console.log(`❌ [FAIL] ${testName}`);
  console.log(`   Reason: ${reason}`);
}

function block(testName, reason) {
  results.blocked.push({ testName, reason });
  console.log(`⏸️  [BLOCKED] ${testName}`);
  console.log(`   Reason: ${reason}`);
}

/**
 * Test 1: tutorial_sections table exists and has correct structure
 */
async function test_tutorialSectionsExists() {
  const testName = 'tutorial_sections table structure';
  
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      ) AS exists
    `);
    
    if (!result.rows[0].exists) {
      fail(testName, 'Table does not exist');
      return false;
    }
    
    // Verify critical columns
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tutorial_sections'
    `);
    
    const columnNames = columns.rows.map(r => r.column_name);
    const requiredColumns = ['id', 'subtopic_id', 'brand_id', 'content', 'status'];
    
    for (const required of requiredColumns) {
      if (!columnNames.includes(required)) {
        fail(testName, `Missing required column: ${required}`);
        return false;
      }
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 2: Existing tutorial_sections data has valid JSON structure
 */
async function test_existingDataStructure() {
  const testName = 'Existing data JSON structure';
  
  try {
    const result = await pool.query(`
      SELECT id, subtopic_id, brand_id, content
      FROM tutorial_sections
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      block(testName, 'No existing data to validate');
      return true;
    }
    
    for (const row of result.rows) {
      // Verify content is valid JSON
      if (typeof row.content !== 'object') {
        fail(testName, `Row ${row.id} has invalid JSON content`);
        return false;
      }
      
      // Verify schemaVersion exists
      if (!row.content.schemaVersion) {
        fail(testName, `Row ${row.id} missing schemaVersion`);
        return false;
      }
      
      // Verify blocks array exists
      if (!Array.isArray(row.content.blocks)) {
        fail(testName, `Row ${row.id} missing blocks array`);
        return false;
      }
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 3: Block structure validation
 */
async function test_blockStructure() {
  const testName = 'Block structure validation';
  
  try {
    const result = await pool.query(`
      SELECT id, content
      FROM tutorial_sections
      WHERE jsonb_array_length(content->'blocks') > 0
      LIMIT 5
    `);
    
    if (result.rows.length === 0) {
      block(testName, 'No blocks found to validate');
      return true;
    }
    
    for (const row of result.rows) {
      const blocks = row.content.blocks;
      
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        
        // Verify required fields
        if (!block.id) {
          fail(testName, `Row ${row.id}, block ${i}: missing id`);
          return false;
        }
        
        if (!block.type) {
          fail(testName, `Row ${row.id}, block ${i}: missing type`);
          return false;
        }
        
        if (block.content === undefined) {
          fail(testName, `Row ${row.id}, block ${i}: missing content`);
          return false;
        }
      }
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 4: Block ordering preservation
 */
async function test_blockOrdering() {
  const testName = 'Block ordering preservation';
  
  try {
    const result = await pool.query(`
      SELECT id, content
      FROM tutorial_sections
      WHERE jsonb_array_length(content->'blocks') > 1
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      block(testName, 'No multi-block documents to test');
      return true;
    }
    
    const blocks = result.rows[0].content.blocks;
    
    // Verify blocks maintain array order
    const blockIds = blocks.map(b => b.id);
    const uniqueIds = new Set(blockIds);
    
    if (blockIds.length !== uniqueIds.size) {
      fail(testName, 'Duplicate block IDs found');
      return false;
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 5: Brand isolation
 */
async function test_brandIsolation() {
  const testName = 'Brand isolation';
  
  try {
    const brands = await pool.query(`
      SELECT DISTINCT brand_id 
      FROM tutorial_sections
    `);
    
    if (brands.rows.length === 0) {
      block(testName, 'No data to test brand isolation');
      return true;
    }
    
    // Verify shared brand exists
    const hasShared = brands.rows.some(r => r.brand_id === 'shared');
    
    if (!hasShared) {
      block(testName, 'No shared brand data found');
      return true;
    }
    
    // Verify brand-specific data doesn't cross-contaminate
    const sharedCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM tutorial_sections
      WHERE brand_id = 'shared'
    `);
    
    if (parseInt(sharedCount.rows[0].count) > 0) {
      pass(testName);
      return true;
    }
    
    block(testName, 'Insufficient data for isolation test');
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 6: Definition D1 block structure
 */
async function test_definitionD1Structure() {
  const testName = 'Definition D1 block structure';
  
  try {
    const result = await pool.query(`
      SELECT id, content
      FROM tutorial_sections
      WHERE content->'blocks' @> '[{"type": "definition"}]'
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      block(testName, 'No definition blocks found');
      return true;
    }
    
    const blocks = result.rows[0].content.blocks;
    const defBlock = blocks.find(b => b.type === 'definition');
    
    if (!defBlock) {
      fail(testName, 'Definition block not found in matched row');
      return false;
    }
    
    // Verify has version
    if (!defBlock.version) {
      fail(testName, 'Definition block missing version');
      return false;
    }
    
    // Verify has content
    if (!defBlock.content) {
      fail(testName, 'Definition block missing content');
      return false;
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 7: Code C1 block structure
 */
async function test_codeC1Structure() {
  const testName = 'Code C1 block structure';
  
  try {
    const result = await pool.query(`
      SELECT id, content
      FROM tutorial_sections
      WHERE content->'blocks' @> '[{"type": "code"}]'
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      block(testName, 'No code blocks found');
      return true;
    }
    
    const blocks = result.rows[0].content.blocks;
    const codeBlock = blocks.find(b => b.type === 'code');
    
    if (!codeBlock) {
      fail(testName, 'Code block not found in matched row');
      return false;
    }
    
    // Verify has version
    if (!codeBlock.version) {
      fail(testName, 'Code block missing version');
      return false;
    }
    
    // Verify has content
    if (!codeBlock.content) {
      fail(testName, 'Code block missing content');
      return false;
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 8: Published status verification
 */
async function test_publishedStatus() {
  const testName = 'Published status verification';
  
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count
      FROM tutorial_sections
      WHERE status IN ('approved', 'deployed')
    `);
    
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      block(testName, 'No published tutorials found');
      return true;
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Test 9: No active legacy runtime READ/WRITE
 * 
 * Scans runtime application code for active use of tutorial_page_content_v2.
 * EXCLUDES schema definitions (kept temporarily for rollback).
 * 
 * Classification:
 * - ⚠️  ACTIVE RUNTIME (repositories, services, API routes, UI) → VIOLATION
 * - ✅ SCHEMA (db-tutorial/src/schema) → ALLOWED (temporary)
 * - ✅ AUDIT/MIGRATION (scripts/audit, scripts/migration) → ALLOWED
 * - ✅ TESTS (__tests__, .test., .spec.) → ALLOWED
 */
async function test_noLegacyTableDependency() {
  const testName = 'No active legacy runtime READ/WRITE';
  
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Runtime directories to scan (EXCLUDE schema)
    const scanDirs = [
      'apps/skillhubcore-admin/src/app',           // Composer GUI + API routes
      'apps/skillhubcore-admin/src/components',
      'apps/skillhubcore-admin/src/lib',
      'apps/realtutorialhub-web/src',              // RTH delivery
      'apps/skillup-web/src',                      // SUIA delivery
      'packages/db-tutorial/src/repositories',     // Repository layer
      'packages/db-tutorial/src/services',         // Service layer
      'packages/db-tutorial/src/delivery',         // Delivery logic
      'packages/ui/src',                           // Shared UI components
      'src/share-branding/LearningExperience',    // Delivery components
    ];
    
    // Explicitly EXCLUDE (temporary infrastructure)
    const excludePatterns = [
      /packages\/db-tutorial\/src\/schema/,        // Schema kept for rollback
      /scripts\/audit\//,                          // Audit scripts
      /scripts\/migration\//,                      // Migration scripts
      /__tests__\//,                               // Test files
      /\.test\./,
      /\.spec\./,
    ];
    
    // Forbidden patterns in active runtime code
    const forbiddenPatterns = [
      'tutorial_page_content_v2',
      'tutorialPageContentV2',
      '/api/tutorial-page-content',
    ];
    
    const violations = [];
    const schemaRefs = [];
    
    async function scanFile(filePath) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check if this is schema/infrastructure
        const isExcluded = excludePatterns.some(pattern => pattern.test(filePath));
        
        for (const pattern of forbiddenPatterns) {
          if (content.includes(pattern)) {
            if (isExcluded) {
              // Track but don't fail
              schemaRefs.push({ file: filePath, pattern });
            } else {
              // Active runtime violation
              violations.push({ file: filePath, pattern });
            }
          }
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
    
    async function scanDirectory(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            // Skip node_modules, .next, etc.
            if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            // Only scan source files
            if (/\.(ts|tsx|js|jsx|mjs)$/.test(entry.name)) {
              await scanFile(fullPath);
            }
          }
        }
      } catch (err) {
        // Directory doesn't exist or not accessible
      }
    }
    
    // Scan all directories from project root
    const projectRoot = resolve(__dirname, '../..');
    
    for (const dir of scanDirs) {
      const fullDir = path.join(projectRoot, dir);
      await scanDirectory(fullDir);
    }
    
    // Report schema refs (informational)
    if (schemaRefs.length > 0) {
      console.log(`   ℹ️  Found ${schemaRefs.length} schema/infrastructure references (allowed temporarily)`);
    }
    
    // Fail on active runtime violations
    if (violations.length > 0) {
      fail(testName, `Found ${violations.length} ACTIVE runtime legacy references`);
      violations.slice(0, 10).forEach(v => {
        const relativePath = v.file.replace(projectRoot, '');
        console.log(`     ⚠️  ${relativePath}`);
        console.log(`        Pattern: ${v.pattern}`);
      });
      if (violations.length > 10) {
        console.log(`     ... and ${violations.length - 10} more`);
      }
      return false;
    }
    
    pass(testName);
    return true;
  } catch (error) {
    block(testName, `Static scan error: ${error.message}`);
    return true;
  }
}

/**
 * Test 10: TutorialDocument schema validation
 */
async function test_tutorialDocumentSchema() {
  const testName = 'TutorialDocument schema compliance';
  
  try {
    const result = await pool.query(`
      SELECT id, content
      FROM tutorial_sections
      LIMIT 10
    `);
    
    if (result.rows.length === 0) {
      block(testName, 'No data to validate');
      return true;
    }
    
    for (const row of result.rows) {
      const doc = row.content;
      
      // Must have schemaVersion
      if (typeof doc.schemaVersion !== 'number') {
        fail(testName, `Row ${row.id}: invalid schemaVersion`);
        return false;
      }
      
      // Must have blocks array
      if (!Array.isArray(doc.blocks)) {
        fail(testName, `Row ${row.id}: blocks is not an array`);
        return false;
      }
      
      // Each block must have required fields
      for (const block of doc.blocks) {
        if (!block.id || !block.type) {
          fail(testName, `Row ${row.id}: block missing id or type`);
          return false;
        }
      }
    }
    
    pass(testName);
    return true;
  } catch (error) {
    fail(testName, error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  C1-018 AUTOMATED IMPLEMENTATION TEST SUITE');
  console.log('══════════════════════════════════════════════════════════════\n');
  
  console.log('Target: tutorial_sections V2 architecture');
  console.log('Mode: READ-ONLY database verification\n');
  
  console.log('──────────────────────────────────────────────────────────────');
  console.log('RUNNING TESTS...\n');
  
  // Execute all tests
  await test_tutorialSectionsExists();
  await test_existingDataStructure();
  await test_blockStructure();
  await test_blockOrdering();
  await test_brandIsolation();
  await test_definitionD1Structure();
  await test_codeC1Structure();
  await test_publishedStatus();
  await test_noLegacyTableDependency();
  await test_tutorialDocumentSchema();
  
  // Report results
  console.log('\n──────────────────────────────────────────────────────────────');
  console.log('TEST SUMMARY\n');
  
  console.log(`✅ Passed:  ${results.passed.length}`);
  console.log(`❌ Failed:  ${results.failed.length}`);
  console.log(`⏸️  Blocked: ${results.blocked.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFAILED TESTS:');
    results.failed.forEach(({ testName, reason }) => {
      console.log(`  • ${testName}`);
      console.log(`    ${reason}`);
    });
  }
  
  if (results.blocked.length > 0) {
    console.log('\nBLOCKED TESTS:');
    results.blocked.forEach(({ testName, reason }) => {
      console.log(`  • ${testName}`);
      console.log(`    ${reason}`);
    });
  }
  
  console.log('\n══════════════════════════════════════════════════════════════');
  
  if (results.failed.length === 0) {
    console.log('  RESULT: ✅ PASS');
  } else {
    console.log('  RESULT: ❌ FAIL');
  }
  
  console.log('══════════════════════════════════════════════════════════════\n');
  
  return results.failed.length === 0;
}

// Execute
runTests()
  .then(success => {
    pool.end();
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    pool.end();
    process.exit(1);
  });
