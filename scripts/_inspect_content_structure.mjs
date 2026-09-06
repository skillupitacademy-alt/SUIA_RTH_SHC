#!/usr/bin/env node
/**
 * INSPECT tutorial_page_content_v2 CONTENT STRUCTURE
 * 
 * Verify if it contains block-level content (D1, C1, etc.) or legacy structure
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  console.log('================================================================');
  console.log('TUTORIAL_PAGE_CONTENT_V2 STRUCTURE INSPECTION');
  console.log('================================================================\n');

  // Get the 2 content rows
  const result = await pool.query(`
    SELECT 
      id,
      brand_id,
      content_type,
      status,
      payload,
      source_format,
      source_content,
      version
    FROM tutorial_page_content_v2
    WHERE subtopic_id = $1
    ORDER BY content_type
  `, [SUBTOPIC_EXTERNAL_ID]);

  console.log(`Found ${result.rows.length} content row(s)\n`);

  for (let i = 0; i < result.rows.length; i++) {
    const row = result.rows[i];
    
    console.log('================================================================');
    console.log(`CONTENT ${i + 1}: ${row.content_type.toUpperCase()}`);
    console.log('================================================================\n');

    console.log('METADATA:');
    console.log(`  ID:            ${row.id}`);
    console.log(`  Brand:         ${row.brand_id}`);
    console.log(`  Type:          ${row.content_type}`);
    console.log(`  Status:        ${row.status}`);
    console.log(`  Version:       ${row.version}`);
    console.log(`  Source Format: ${row.source_format}`);
    console.log('');

    // Inspect payload structure
    console.log('PAYLOAD STRUCTURE:');
    if (row.payload) {
      const payload = row.payload;
      console.log(`  Type: ${typeof payload}`);
      
      if (typeof payload === 'object') {
        console.log(`  Keys: ${Object.keys(payload).join(', ')}`);
        console.log('');
        
        // Check for block structure
        if (payload.blocks && Array.isArray(payload.blocks)) {
          console.log('  ✅ HAS BLOCKS ARRAY:');
          console.log(`     Block count: ${payload.blocks.length}`);
          
          if (payload.blocks.length > 0) {
            console.log('     First 3 blocks:');
            payload.blocks.slice(0, 3).forEach((block, idx) => {
              console.log(`       ${idx + 1}. id: ${block.id || 'NO ID'}`);
              console.log(`          type: ${block.type || 'NO TYPE'}`);
              console.log(`          version: ${block.version || 'NO VERSION'}`);
              if (block.content) {
                const contentPreview = JSON.stringify(block.content).substring(0, 100);
                console.log(`          content: ${contentPreview}...`);
              }
            });
          }
        } else {
          console.log('  ❌ NO BLOCKS ARRAY');
        }
        
        // Check for legacy structure (definition/code/summary)
        if (payload.definition || payload.code || payload.summary) {
          console.log('\n  ⚠️  LEGACY STRUCTURE DETECTED:');
          if (payload.definition) console.log('     - definition: present');
          if (payload.code) console.log('     - code: present');
          if (payload.summary) console.log('     - summary: present');
        }
        
        // Show full structure (first 500 chars)
        console.log('\n  FULL PAYLOAD (preview):');
        const payloadStr = JSON.stringify(payload, null, 2);
        console.log(payloadStr.substring(0, 500));
        if (payloadStr.length > 500) {
          console.log(`  ... (${payloadStr.length - 500} more characters)`);
        }
      } else {
        console.log(`  Value: ${payload}`);
      }
    } else {
      console.log('  ❌ NULL or EMPTY');
    }
    console.log('');

    // Inspect source_content if exists
    if (row.source_content) {
      console.log('SOURCE_CONTENT:');
      console.log(`  Type: ${typeof row.source_content}`);
      const sourceStr = JSON.stringify(row.source_content).substring(0, 200);
      console.log(`  Preview: ${sourceStr}...`);
      console.log('');
    }
  }

  // Summary
  console.log('\n================================================================');
  console.log('ANALYSIS SUMMARY');
  console.log('================================================================\n');

  const hasBlocks = result.rows.some(r => 
    r.payload && r.payload.blocks && Array.isArray(r.payload.blocks)
  );

  const hasLegacy = result.rows.some(r => 
    r.payload && (r.payload.definition || r.payload.code || r.payload.summary)
  );

  console.log('CONTENT STRUCTURE:');
  if (hasBlocks) {
    console.log('  ✅ Block-level structure (D1, C1, S1, etc.)');
    console.log('     Compatible with TutorialDocument.blocks[]');
    console.log('     Compatible with BlockTelemetryProvider');
  } else {
    console.log('  ❌ NO block-level structure');
  }
  console.log('');

  if (hasLegacy) {
    console.log('  ⚠️  Legacy structure (definition/code/summary)');
    console.log('     Incompatible with current block-level ILS');
  }
  console.log('');

  console.log('DELIVERY COMPATIBILITY:');
  console.log('  Current delivery expects:');
  console.log('    - TutorialDocument with blocks[]');
  console.log('    - Each block has: id, type, version, content');
  console.log('');

  if (hasBlocks) {
    console.log('  ✅ tutorial_page_content_v2 IS COMPATIBLE');
    console.log('     Can be used by delivery layer');
  } else {
    console.log('  ❌ tutorial_page_content_v2 NOT COMPATIBLE');
    console.log('     Contains wrong structure for current architecture');
  }
  console.log('');

  console.log('RECOMMENDATION:');
  if (hasBlocks) {
    console.log('  Update delivery code to read tutorial_page_content_v2');
    console.log('  This is the correct content table');
  } else {
    console.log('  Content migration incomplete or incorrect');
    console.log('  May need to regenerate content in correct structure');
  }
  console.log('');

  await pool.end();
}

main().catch(err => {
  console.error('INSPECTION ERROR:', err);
  process.exit(1);
});
