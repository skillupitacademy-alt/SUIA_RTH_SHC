/**
 * PHASE 10: OFFICIAL TUTORIALBLOCK CONTRACT VERIFICATION
 * 
 * NO DATABASE MODIFICATIONS
 * NO SCHEMA MODIFICATIONS
 * 
 * Reads the current tutorial_sections record and validates against
 * the official TutorialDocumentSchema to get exact Zod error paths.
 * 
 * This script validates structure manually to avoid TypeScript compilation.
 */

import dotenv from 'dotenv';
import { Pool, neonConfig } from '@neondatabase/serverless';
import WebSocket from 'ws';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const tutorialDb = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

const RECORD_ID = '455ba9ed-9365-4637-bf5e-c186c943601f';

/**
 * Manual validation rules based on TutorialBlockSchema
 */
function validateBlock(block, index) {
  const errors = [];
  
  // Check base structure
  if (!block.id) {
    errors.push(`blocks[${index}].id is missing`);
  }
  if (!block.type) {
    errors.push(`blocks[${index}].type is missing`);
  }
  
  // Check version-specific structures
  if (block.type === 'definition') {
    if (block.version !== 'D1') {
      errors.push(`blocks[${index}].version should be "D1" for definition blocks, got: ${block.version || 'undefined'}`);
    }
    if (!block.content || !block.content.page) {
      errors.push(`blocks[${index}].content.page is missing (required for D1 definition)`);
    } else {
      const page = block.content.page;
      if (page.type !== 'definition') errors.push(`blocks[${index}].content.page.type should be "definition"`);
      if (!page.category) errors.push(`blocks[${index}].content.page.category is missing`);
      if (!page.title) errors.push(`blocks[${index}].content.page.title is missing`);
      if (!page.intro) errors.push(`blocks[${index}].content.page.intro is missing`);
      if (!page.definition) errors.push(`blocks[${index}].content.page.definition is missing`);
      if (!Array.isArray(page.explanation)) errors.push(`blocks[${index}].content.page.explanation should be array`);
      if (!page.example) errors.push(`blocks[${index}].content.page.example is missing`);
      if (!Array.isArray(page.characteristics)) errors.push(`blocks[${index}].content.page.characteristics should be array`);
      if (!page.takeaway) errors.push(`blocks[${index}].content.page.takeaway is missing`);
    }
  } else if (block.type === 'code') {
    // Check if it's C1 version or legacy
    if (block.version === 'C1') {
      if (!block.content || !block.content.page) {
        errors.push(`blocks[${index}].content.page is missing (required for C1 code)`);
      } else {
        const page = block.content.page;
        if (page.type !== 'code') errors.push(`blocks[${index}].content.page.type should be "code"`);
        if (!page.title) errors.push(`blocks[${index}].content.page.title is missing`);
        if (!page.introduction) errors.push(`blocks[${index}].content.page.introduction is missing`);
        if (!page.language) errors.push(`blocks[${index}].content.page.language is missing`);
        if (!page.code) errors.push(`blocks[${index}].content.page.code is missing`);
        if (!Array.isArray(page.explanation)) errors.push(`blocks[${index}].content.page.explanation should be array`);
        if (!page.takeaway) errors.push(`blocks[${index}].content.page.takeaway is missing`);
      }
    } else {
      // Legacy code block
      if (!block.content || !block.content.language) {
        errors.push(`blocks[${index}].content.language is missing (legacy code block)`);
      }
      if (!block.content || !block.content.code) {
        errors.push(`blocks[${index}].content.code is missing (legacy code block)`);
      }
    }
  } else if (block.type === 'summary') {
    if (!block.content || !Array.isArray(block.content.points)) {
      errors.push(`blocks[${index}].content.points should be array (summary block)`);
    }
  } else if (['objective', 'explanation'].includes(block.type)) {
    errors.push(`blocks[${index}].type "${block.type}" is NOT in official TutorialBlock schema`);
  }
  
  return errors;
}

console.log('═══════════════════════════════════════════════════════════');
console.log('PHASE 10: OFFICIAL TUTORIALBLOCK CONTRACT VERIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('Target record:', RECORD_ID);
console.log('');

try {
  // Step 1: Fetch the record
  console.log('Step 1: Fetching tutorial_sections record...');
  
  const result = await tutorialDb.query(`
    SELECT 
      id,
      content,
      status,
      created_at
    FROM tutorial_sections
    WHERE id = $1
  `, [RECORD_ID]);

  if (result.rows.length === 0) {
    console.log('❌ Record not found!');
    process.exit(1);
  }

  const record = result.rows[0];
  const content = record.content;

  console.log('✅ Record found');
  console.log(`   Status: ${record.status}`);
  console.log(`   Created: ${record.created_at}`);
  console.log('');

  // Step 2: Inspect top-level structure
  console.log('Step 2: Top-level content structure:');
  console.log(`   schemaVersion: ${content.schemaVersion} (type: ${typeof content.schemaVersion})`);
  console.log(`   blocks: array length ${content.blocks?.length || 0}`);
  console.log(`   metadata: ${content.metadata ? 'present' : 'missing'}`);
  console.log('');

  // Step 3: Inspect each block
  console.log('Step 3: Block structure inspection:');
  console.log('────────────────────────────────────────────────────────────');

  if (content.blocks && Array.isArray(content.blocks)) {
    content.blocks.forEach((block, index) => {
      console.log(`\nBlock ${index}:`);
      console.log(`   id:       ${block.id}`);
      console.log(`   type:     ${block.type}`);
      console.log(`   version:  ${block.version || 'MISSING'}`);
      
      if (block.content) {
        const contentKeys = Object.keys(block.content);
        console.log(`   content keys: [${contentKeys.join(', ')}]`);
        
        // Check for expected versioned structure
        if (block.version === 'D1' || block.version === 'C1') {
          console.log(`   ✅ Has version field (${block.version})`);
          if (block.content.page) {
            console.log(`   ✅ Has content.page structure`);
          } else {
            console.log(`   ❌ Missing content.page structure`);
          }
        } else {
          console.log(`   ❌ Missing version field or unknown version`);
        }
      } else {
        console.log(`   content: MISSING`);
      }
    });
  } else {
    console.log('❌ blocks is not an array or missing');
  }

  console.log('');
  console.log('────────────────────────────────────────────────────────────');
  console.log('');

  // Step 4: Validate manually against official contract
  console.log('Step 4: Validating against official TutorialBlock contract...');
  console.log('');

  const allErrors = [];
  
  // Validate schemaVersion
  if (content.schemaVersion !== 1) {
    allErrors.push({
      path: 'schemaVersion',
      message: `Expected literal 1, got ${content.schemaVersion}`,
      code: 'invalid_literal',
    });
  }
  
  // Validate blocks
  if (content.blocks && Array.isArray(content.blocks)) {
    content.blocks.forEach((block, index) => {
      const blockErrors = validateBlock(block, index);
      blockErrors.forEach(error => {
        allErrors.push({
          path: error,
          message: 'Contract violation',
          code: 'invalid_structure',
        });
      });
    });
  }

  if (allErrors.length === 0) {
    console.log('✅ VALIDATION PASSED!');
    console.log('   The content matches the official TutorialBlock contract.');
    console.log('');
  } else {
    console.log('❌ VALIDATION FAILED');
    console.log('');
    console.log('Contract Violations:');
    console.log('────────────────────────────────────────────────────────────');
    
    console.log(`Total errors: ${allErrors.length}`);
    console.log('');

    allErrors.forEach((error, index) => {
      console.log(`Error ${index + 1}:`);
      console.log(`   ${error.path}`);
      console.log(`   ${error.message}`);
      console.log('');
    });

    console.log('────────────────────────────────────────────────────────────');
  }

  // Step 5: Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('PHASE 10: DIAGNOSTIC COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  if (allErrors.length === 0) {
    console.log('✅ Content is architecturally valid');
    console.log('✅ Ready for delivery');
  } else {
    console.log('❌ Content has contract violations');
    console.log('');
    console.log('Root Causes:');
    
    const hasVersionErrors = allErrors.some(e => e.path.includes('version'));
    const hasPageErrors = allErrors.some(e => e.path.includes('content.page'));
    const hasTypeErrors = allErrors.some(e => e.path.includes('NOT in official'));

    if (hasTypeErrors) {
      console.log('   ⚠️  Gate 2 uses block types not in official TutorialBlock schema');
      console.log('      (objective, explanation are not valid types)');
    }
    if (hasVersionErrors) {
      console.log('   ⚠️  Blocks missing version field (D1, C1, etc.)');
    }
    if (hasPageErrors) {
      console.log('   ⚠️  Blocks missing content.page structure');
    }
    
    console.log('');
    console.log('Official TutorialBlock Architecture:');
    console.log('');
    console.log('Definition blocks:');
    console.log('  { id, type: "definition", version: "D1",');
    console.log('    content: { page: {');
    console.log('      type: "definition", category, title, intro,');
    console.log('      definition, explanation[], example{},');
    console.log('      characteristics[], takeaway');
    console.log('    }}}');
    console.log('');
    console.log('Code blocks (C1):');
    console.log('  { id, type: "code", version: "C1",');
    console.log('    content: { page: {');
    console.log('      type: "code", title, introduction, language,');
    console.log('      code, explanation[], takeaway');
    console.log('    }}}');
    console.log('');
    console.log('Summary blocks:');
    console.log('  { id, type: "summary",');
    console.log('    content: { title?, points[] },');
    console.log('    presentation: {} }');
    console.log('');
    console.log('Available block types:');
    console.log('  heading, paragraph, list, code (legacy + C1),');
    console.log('  table, image, callout, definition (D1),');
    console.log('  example, quote, summary, diagram, comparison');
    console.log('');
    console.log('NOT VALID: objective, explanation');
  }

  console.log('');
  console.log('FILES MODIFIED:    NONE');
  console.log('DATABASE MODIFIED: NONE');
  console.log('');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nStack:', error.stack);
  process.exit(1);
} finally {
  await tutorialDb.end();
}
