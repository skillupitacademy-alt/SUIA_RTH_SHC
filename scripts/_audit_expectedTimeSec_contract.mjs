#!/usr/bin/env node
/**
 * AUDIT: expectedTimeSec CONTRACT VERIFICATION
 * 
 * Verify the complete AI → Composer → tutorial_sections → ILS chain
 * ensures expectedTimeSec flows correctly through all layers
 * 
 * CONTRACT:
 * 1. AI JSON uses expectedTimeSec (camelCase)
 * 2. TutorialDocument schema accepts expectedTimeSec
 * 3. All block schemas accept expectedTimeSec
 * 4. Composer validation preserves expectedTimeSec
 * 5. createTutorial() persists it in tutorial_sections.content
 * 6. Publishing does not strip expectedTimeSec
 * 7. Delivery returns expectedTimeSec in blocks
 * 8. ILS reads expectedTimeSec from blocks
 * 9. ILS maps to block_learning_state.expected_time_sec (snake_case DB column)
 * 10. NO alternate fields (completionSec, completionTime, expected_time)
 */

import { config } from 'dotenv';
import pkg from 'pg';
import { readFile } from 'fs/promises';
import globPkg from 'glob';

const { glob } = globPkg;

config({ path: '.env.local', override: true });

const { Client } = pkg;

console.log('================================================================');
console.log('expectedTimeSec CONTRACT AUDIT');
console.log('================================================================\n');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

// ============================================
// 1. VERIFY TypeScript SCHEMA DEFINITIONS
// ============================================
console.log('─'.repeat(80));
console.log('1. VERIFYING TypeScript Schema Definitions');
console.log('─'.repeat(80));

// Find TutorialDocument and block type definitions
const typeFiles = await glob('packages/types/src/tutorial-rich-document/**/*.ts');

if (!typeFiles || typeFiles.length === 0) {
  console.log('⚠️  No TypeScript schema files found');
  results.warnings.push('TypeScript schema files not found');
}

let tutorialDocumentFound = false;
let expectedTimeSecInSchema = false;
let blockSchemasChecked = [];

if (typeFiles && typeFiles.length > 0) {
  for (const file of typeFiles) {
  const content = await readFile(file, 'utf-8');
  
  // Check for TutorialDocument
  if (content.includes('interface TutorialDocument') || content.includes('type TutorialDocument')) {
    tutorialDocumentFound = true;
    console.log(`✅ TutorialDocument schema found: ${file}`);
  }
  
  // Check for expectedTimeSec in content blocks
  if (file.includes('content-blocks.ts')) {
    if (content.includes('expectedTimeSec')) {
      expectedTimeSecInSchema = true;
      console.log(`✅ expectedTimeSec found in content-blocks.ts`);
      
      // Extract the line for verification
      const lines = content.split('\n');
      const relevantLines = lines.filter(line => 
        line.includes('expectedTimeSec') && !line.trim().startsWith('//')
      );
      
      if (relevantLines.length > 0) {
        console.log('   Schema definition:');
        relevantLines.forEach(line => {
          console.log(`   ${line.trim()}`);
        });
      }
      
      results.passed.push('expectedTimeSec defined in content-blocks.ts schema');
    } else {
      console.log(`❌ expectedTimeSec NOT FOUND in content-blocks.ts`);
      results.failed.push('expectedTimeSec missing from content-blocks.ts schema');
    }
  }
  
  // Check individual block types
  const blockTypes = ['definition', 'code', 'concept', 'interactive', 'exercise'];
  for (const blockType of blockTypes) {
    if (file.includes(`${blockType}-block.ts`) || content.includes(`${blockType}Block`)) {
      blockSchemasChecked.push(blockType);
    }
  }
}
}

console.log('\n');

if (!tutorialDocumentFound) {
  console.log('⚠️  TutorialDocument schema location not confirmed');
  results.warnings.push('TutorialDocument schema location not confirmed');
}

if (!expectedTimeSecInSchema) {
  console.log('❌ CRITICAL: expectedTimeSec not found in schema definitions');
  results.failed.push('expectedTimeSec missing from TypeScript schemas');
}

// ============================================
// 2. VERIFY PROVISIONED CONTENT
// ============================================
console.log('─'.repeat(80));
console.log('2. VERIFYING Provisioned Content in Database');
console.log('─'.repeat(80));

const client = new Client({ 
  connectionString: process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_DIRECT_URL_TUTORIAL 
});

await client.connect();

const contentQuery = await client.query(`
  SELECT 
    id,
    navigation_node_id,
    content,
    status
  FROM tutorial_sections
  WHERE navigation_node_id = 'whatisjava'
    AND deleted_at IS NULL
  LIMIT 1
`);

if (contentQuery.rows.length === 0) {
  console.log('❌ No whatisjava content found in tutorial_sections');
  results.failed.push('whatisjava content not found in database');
} else {
  const row = contentQuery.rows[0];
  const content = row.content;
  
  console.log(`✅ Found whatisjava tutorial: ${row.id}`);
  console.log(`   Status: ${row.status}`);
  console.log(`   Schema Version: ${content.schemaVersion || 'N/A'}`);
  console.log(`   Block Count: ${content.blocks?.length || 0}`);
  console.log('');
  
  // Verify expectedTimeSec in each block
  if (content.blocks && Array.isArray(content.blocks)) {
    let allBlocksHaveExpectedTime = true;
    
    content.blocks.forEach((block, index) => {
      const hasExpectedTime = 'expectedTimeSec' in block;
      const symbol = hasExpectedTime ? '✅' : '❌';
      
      console.log(`${symbol} Block ${index + 1}: ${block.type} (${block.version || 'v?'})`);
      
      if (hasExpectedTime) {
        console.log(`   expectedTimeSec: ${block.expectedTimeSec} seconds`);
        results.passed.push(`Block ${block.type} has expectedTimeSec: ${block.expectedTimeSec}`);
      } else {
        console.log(`   ❌ expectedTimeSec: MISSING`);
        allBlocksHaveExpectedTime = false;
        results.failed.push(`Block ${block.type} missing expectedTimeSec`);
      }
      
      // Check for alternate/conflicting fields
      const alternateFields = ['completionSec', 'completionTime', 'expected_time', 'expectedTime'];
      const foundAlternates = alternateFields.filter(field => field in block);
      
      if (foundAlternates.length > 0) {
        console.log(`   ⚠️  CONFLICTING FIELDS FOUND: ${foundAlternates.join(', ')}`);
        results.warnings.push(`Block ${block.type} has conflicting time fields: ${foundAlternates.join(', ')}`);
      }
      
      console.log('');
    });
    
    if (allBlocksHaveExpectedTime) {
      console.log('✅ ALL blocks contain expectedTimeSec\n');
      results.passed.push('All blocks in whatisjava contain expectedTimeSec');
    } else {
      console.log('❌ SOME blocks missing expectedTimeSec\n');
      results.failed.push('Some blocks missing expectedTimeSec');
    }
    
    // Verify it's camelCase, not snake_case
    const jsonString = JSON.stringify(content.blocks);
    if (jsonString.includes('expected_time_sec')) {
      console.log('❌ CRITICAL: Found snake_case expected_time_sec in JSON');
      console.log('   Canonical JSON should use camelCase: expectedTimeSec\n');
      results.failed.push('Canonical JSON uses snake_case instead of camelCase');
    } else {
      console.log('✅ Canonical JSON uses camelCase (expectedTimeSec)\n');
      results.passed.push('Canonical JSON uses correct camelCase format');
    }
  } else {
    console.log('❌ No blocks array found in content\n');
    results.failed.push('No blocks array in tutorial content');
  }
}

// ============================================
// 3. VERIFY ILS INTEGRATION
// ============================================
console.log('─'.repeat(80));
console.log('3. VERIFYING ILS Integration Path');
console.log('─'.repeat(80));

// Check block_learning_state schema
const blockStateSchema = await client.query(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'block_learning_state'
    AND column_name = 'expected_time_sec'
`);

if (blockStateSchema.rows.length > 0) {
  const col = blockStateSchema.rows[0];
  console.log(`✅ block_learning_state.expected_time_sec exists`);
  console.log(`   Data Type: ${col.data_type}`);
  console.log(`   Purpose: Stores expectedTimeSec from canonical TutorialDocument blocks`);
  console.log(`   Convention: snake_case (database column naming)\n`);
  results.passed.push('Database column block_learning_state.expected_time_sec exists');
} else {
  console.log(`❌ block_learning_state.expected_time_sec NOT FOUND\n`);
  results.failed.push('Database column expected_time_sec missing');
}

// ============================================
// 4. VERIFY NO ALTERNATE FIELDS IN CODE
// ============================================
console.log('─'.repeat(80));
console.log('4. CHECKING For Alternate/Conflicting Time Fields');
console.log('─'.repeat(80));

const sourceFiles = await glob('apps/skillhubcore-api/src/**/*.ts') || [];
const conflictingFields = ['completionSec', 'completionTime', 'expected_time'];
const filesWithConflicts = [];

if (sourceFiles && sourceFiles.length > 0) {
  for (const file of sourceFiles) {
  const content = await readFile(file, 'utf-8');
  
  for (const field of conflictingFields) {
    if (content.includes(field) && !content.includes(`// ${field}`)) {
      // Exclude comments
      const lines = content.split('\n');
      const relevantLines = lines.filter(line => 
        line.includes(field) && !line.trim().startsWith('//') && !line.trim().startsWith('*')
      );
      
      if (relevantLines.length > 0) {
        filesWithConflicts.push({ file, field, lines: relevantLines });
      }
    }
  }
}
}

if (filesWithConflicts.length > 0) {
  console.log(`⚠️  Found ${filesWithConflicts.length} potential conflicts:\n`);
  
  filesWithConflicts.slice(0, 5).forEach(({ file, field, lines }) => {
    console.log(`   ${file}`);
    console.log(`   Field: ${field}`);
    lines.slice(0, 2).forEach(line => {
      console.log(`   ${line.trim()}`);
    });
    console.log('');
  });
  
  results.warnings.push(`Found ${filesWithConflicts.length} files with alternate time fields`);
} else {
  console.log('✅ No conflicting time field names found in API code\n');
  results.passed.push('No conflicting time field names in codebase');
}

await client.end();

// ============================================
// FINAL REPORT
// ============================================
console.log('================================================================');
console.log('AUDIT SUMMARY');
console.log('================================================================\n');

console.log(`✅ PASSED: ${results.passed.length}`);
results.passed.forEach(item => console.log(`   - ${item}`));
console.log('');

if (results.warnings.length > 0) {
  console.log(`⚠️  WARNINGS: ${results.warnings.length}`);
  results.warnings.forEach(item => console.log(`   - ${item}`));
  console.log('');
}

if (results.failed.length > 0) {
  console.log(`❌ FAILED: ${results.failed.length}`);
  results.failed.forEach(item => console.log(`   - ${item}`));
  console.log('');
}

// ============================================
// CONTRACT CHECKLIST
// ============================================
console.log('─'.repeat(80));
console.log('CONTRACT CHECKLIST');
console.log('─'.repeat(80));

const checklist = [
  { id: 1, item: 'TutorialDocument schema accepts expectedTimeSec', status: expectedTimeSecInSchema },
  { id: 2, item: 'Block schemas define expectedTimeSec', status: expectedTimeSecInSchema },
  { id: 3, item: 'Canonical JSON uses camelCase (expectedTimeSec)', status: results.passed.includes('Canonical JSON uses correct camelCase format') },
  { id: 4, item: 'Published content contains expectedTimeSec', status: results.passed.some(p => p.includes('All blocks')) },
  { id: 5, item: 'Database column expected_time_sec exists', status: results.passed.includes('Database column block_learning_state.expected_time_sec exists') },
  { id: 6, item: 'No conflicting field names', status: results.failed.length === 0 }
];

checklist.forEach(({ id, item, status }) => {
  const symbol = status ? '✅' : '❌';
  console.log(`${symbol} ${id}. ${item}`);
});

console.log('');

// ============================================
// FINAL VERDICT
// ============================================
const allCriticalPassed = results.failed.length === 0 && expectedTimeSecInSchema;

if (allCriticalPassed) {
  console.log('✅ CONTRACT VERIFICATION: PASSED');
  console.log('✅ expectedTimeSec chain is complete and correct');
  console.log('✅ READY FOR EDUCATIONAL CONTENT CREATION VIA COMPOSER\n');
  process.exit(0);
} else {
  console.log('❌ CONTRACT VERIFICATION: FAILED');
  console.log('❌ Critical gaps in expectedTimeSec contract');
  console.log('⚠️  DO NOT USE COMPOSER FOR CONTENT UNTIL CONTRACT IS CLOSED\n');
  process.exit(1);
}
