#!/usr/bin/env node
/**
 * R/Y/G Required Blocks Preflight
 *
 * PURPOSE:
 *   Prove the exact required blocks for whatisjava using database query
 *   that replicates the resolver logic.
 *
 * IMPORTANT:
 *   - Queries tutorial_sections directly
 *   - Extracts blocks with progressRole='instructional'
 *   - Matches production resolver behavior
 *
 * SCOPE:
 *   Read-only. No mutations.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL_TUTORIAL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL_TUTORIAL is required');
}

const pool = new Pool({ connectionString: DATABASE_URL });

const NAVIGATION_NODE_ID = 'whatisjava';
const SUBTOPIC_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const BRAND = 'realtutorialhub';

async function main() {
  console.log('');
  console.log('==========================================');
  console.log('R/Y/G REQUIRED BLOCKS PREFLIGHT');
  console.log('==========================================');
  console.log('');

  console.log('Navigation Node:', NAVIGATION_NODE_ID);
  console.log('Subtopic ID:', SUBTOPIC_ID);
  console.log('Brand:', BRAND);
  console.log('');

  // Query tutorial_sections for the content
  console.log('--- SECTION LOOKUP ---');
  console.log('');

  const sectionResult = await pool.query(`
    SELECT
      id,
      subtopic_id,
      navigation_node_id,
      brand_id,
      brand_visibility,
      content
    FROM tutorial_sections
    WHERE subtopic_id = $1
      AND navigation_node_id = $2
      AND deleted_at IS NULL
  `, [SUBTOPIC_ID, NAVIGATION_NODE_ID]);

  console.log(`Found ${sectionResult.rows.length} section(s)`);
  if (sectionResult.rows.length > 0) {
    console.log('Brand IDs:', sectionResult.rows.map(r => r.brand_id).join(', '));
  }
  console.log('');

  if (sectionResult.rows.length === 0) {
    console.log('❌ Section not found');
    console.log('');
    console.log('Cannot proceed with R/Y/G certification');
    process.exitCode = 1;
    return;
  }

  if (sectionResult.rows.length > 1) {
    console.log('⚠️  Multiple sections found:', sectionResult.rows.length);
    console.log('');
  }

  const section = sectionResult.rows[0];
  console.log('Section ID:', section.id);
  console.log('Content:', section.content ? 'present' : 'NULL');
  console.log('');

  if (!section.content || !section.content.blocks) {
    console.log('❌ No blocks in section content');
    console.log('');
    process.exitCode = 1;
    return;
  }

  // Extract required blocks (instructional only)
  console.log('--- REQUIRED BLOCKS (RESOLVER LOGIC) ---');
  console.log('');

  const allBlocks = section.content.blocks;
  console.log('Total blocks in content:', allBlocks.length);
  console.log('');

  const requiredBlocks = [];

  for (const block of allBlocks) {
    if (block.version) {
      // Default progressRole to 'instructional' for versioned blocks
      const progressRole = block.progressRole ?? 'instructional';
      
      if (progressRole === 'instructional') {
        requiredBlocks.push({
          blockId: block.id,
          blockVersion: block.version,
          progressRole,
        });
      }
    }
  }

  console.log('Instructional blocks:');
  requiredBlocks.forEach((block, index) => {
    console.log(`${index + 1}.`);
    console.log(`   blockId:      ${block.blockId}`);
    console.log(`   blockVersion: ${block.blockVersion}`);
    console.log(`   progressRole: ${block.progressRole}`);
    console.log('');
  });

  console.log('--- VERIFICATION ---');
  console.log('');

  const totalCount = requiredBlocks.length;
  console.log('Total required blocks:', totalCount);

  // Count unique block IDs
  const uniqueBlockIds = new Set(requiredBlocks.map(b => b.blockId));
  console.log('Unique block IDs:', uniqueBlockIds.size);

  // Count by version
  const versionCounts = requiredBlocks.reduce((acc, block) => {
    acc[block.blockVersion] = (acc[block.blockVersion] || 0) + 1;
    return acc;
  }, {});

  console.log('');
  console.log('Blocks by version:');
  Object.entries(versionCounts).forEach(([version, count]) => {
    console.log(`  ${version}: ${count}`);
  });
  console.log('');

  // Check for duplicates
  const hasDuplicates = uniqueBlockIds.size !== requiredBlocks.length;
  if (hasDuplicates) {
    console.log('⚠️  WARNING: Duplicate block IDs detected!');
    console.log('');
    process.exitCode = 1;
    return;
  }

  // Expected: 3 blocks (I1, D1, C1)
  console.log('--- CERTIFICATION CHECK ---');
  console.log('');

  const EXPECTED_COUNT = 3;
  const EXPECTED_VERSIONS = ['I1', 'D1', 'C1'];

  console.log('Expected total:', EXPECTED_COUNT);
  console.log('Actual total:', totalCount);

  if (totalCount === EXPECTED_COUNT) {
    console.log('✅ COUNT: PASS');
  } else {
    console.log('❌ COUNT: FAIL');
    process.exitCode = 1;
  }

  console.log('');
  console.log('Expected versions:', EXPECTED_VERSIONS.join(', '));
  
  const actualVersions = requiredBlocks.map(b => b.blockVersion).sort();
  console.log('Actual versions:', actualVersions.join(', '));

  const versionsMatch = 
    EXPECTED_VERSIONS.length === actualVersions.length &&
    EXPECTED_VERSIONS.every(v => actualVersions.includes(v));

  if (versionsMatch) {
    console.log('✅ VERSIONS: PASS');
  } else {
    console.log('❌ VERSIONS: FAIL');
    process.exitCode = 1;
  }

  console.log('');

  if (totalCount === EXPECTED_COUNT && versionsMatch && !hasDuplicates) {
    console.log('==========================================');
    console.log('✅ PREFLIGHT PASSED');
    console.log('==========================================');
    console.log('');
    console.log('Required blocks proven:');
    console.log('  Total: 3');
    console.log('  Versions: I1, D1, C1');
    console.log('  No duplicates');
    console.log('');
    console.log('Exact block identities:');
    requiredBlocks.forEach((block) => {
      console.log(`  ${block.blockVersion}: ${block.blockId}`);
    });
    console.log('');
    console.log('R/Y/G certification matrix:');
    console.log('  0/3 = 0%   → RED');
    console.log('  1/3 = 33%  → RED');
    console.log('  2/3 = 67%  → YELLOW');
    console.log('  3/3 = 100% → GREEN');
    console.log('');
  } else {
    console.log('==========================================');
    console.log('❌ PREFLIGHT FAILED');
    console.log('==========================================');
    console.log('');
    console.log('Required blocks do NOT match expected');
    console.log('R/Y/G certification cannot proceed');
    console.log('');
  }
}

main()
  .catch((error) => {
    console.error('');
    console.error('==========================================');
    console.error('PREFLIGHT ERROR');
    console.error('==========================================');
    console.error('');
    console.error(error);
    console.error('');
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
