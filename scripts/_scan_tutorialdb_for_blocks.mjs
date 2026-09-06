#!/usr/bin/env node
/**
 * COMPREHENSIVE TutorialDB SCAN
 * 
 * Search ALL tables for block-level content (D1, C1, S1, etc.)
 * Determine where actual tutorial content is stored
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const SUBTOPIC_INTERNAL_ID = '414f63eb-cccf-4bd1-bcc0-b52df69ce499';
const SUBTOPIC_EXTERNAL_ID = '12efacf1-b5ad-4b43-9fe4-17ba1cf249e4';
const NAVIGATION_NODE_ID = 'whatisjava';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

  console.log('================================================================');
  console.log('COMPREHENSIVE TutorialDB SCAN FOR BLOCK-LEVEL CONTENT');
  console.log('================================================================\n');

  // Get all tables
  const tablesResult = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log(`Scanning ${tablesResult.rows.length} tables...\n`);

  const findings = [];

  for (const table of tablesResult.rows) {
    const tableName = table.table_name;
    
    console.log(`Scanning: ${tableName}...`);

    try {
      // Get columns for this table
      const columnsResult = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      const columns = columnsResult.rows;
      
      // Check if table has relevant columns
      const hasSubtopicId = columns.some(c => c.column_name === 'subtopic_id');
      const hasNavigationNodeId = columns.some(c => c.column_name === 'navigation_node_id');
      const hasContent = columns.some(c => c.column_name === 'content');
      const hasPayload = columns.some(c => c.column_name === 'payload');
      const hasBlocks = columns.some(c => c.column_name === 'blocks');
      
      // Try to find whatisjava-related content
      let relevantRows = [];
      
      if (hasSubtopicId) {
        // Try with internal ID
        const internalResult = await pool.query(
          `SELECT * FROM ${tableName} WHERE subtopic_id = $1 LIMIT 5`,
          [SUBTOPIC_INTERNAL_ID]
        );
        
        if (internalResult.rows.length > 0) {
          relevantRows = relevantRows.concat(internalResult.rows);
        }
        
        // Try with external ID
        try {
          const externalResult = await pool.query(
            `SELECT * FROM ${tableName} WHERE subtopic_id = $1 LIMIT 5`,
            [SUBTOPIC_EXTERNAL_ID]
          );
          
          if (externalResult.rows.length > 0) {
            relevantRows = relevantRows.concat(externalResult.rows);
          }
        } catch (err) {
          // External ID might not match, that's OK
        }
      }
      
      if (hasNavigationNodeId && relevantRows.length === 0) {
        const navResult = await pool.query(
          `SELECT * FROM ${tableName} WHERE navigation_node_id = $1 LIMIT 5`,
          [NAVIGATION_NODE_ID]
        );
        
        if (navResult.rows.length > 0) {
          relevantRows = relevantRows.concat(navResult.rows);
        }
      }
      
      // If we found relevant rows, check for block structure
      if (relevantRows.length > 0) {
        console.log(`  ✅ Found ${relevantRows.length} row(s)`);
        
        for (const row of relevantRows) {
          let hasBlockStructure = false;
          let blockIds = [];
          let contentStructure = 'unknown';
          
          // Check content/payload/blocks columns
          if (row.content && typeof row.content === 'object') {
            if (row.content.blocks && Array.isArray(row.content.blocks)) {
              hasBlockStructure = true;
              blockIds = row.content.blocks.map(b => b.id || 'NO_ID').slice(0, 10);
              contentStructure = 'TutorialDocument with blocks[]';
            } else if (row.content.definition || row.content.code || row.content.summary) {
              contentStructure = 'Legacy (definition/code/summary)';
            } else {
              contentStructure = `Object with keys: ${Object.keys(row.content).join(', ')}`;
            }
          } else if (row.payload && typeof row.payload === 'object') {
            if (row.payload.blocks && Array.isArray(row.payload.blocks)) {
              hasBlockStructure = true;
              blockIds = row.payload.blocks.map(b => b.id || 'NO_ID').slice(0, 10);
              contentStructure = 'Payload with blocks[]';
            } else if (row.payload.definition || row.payload.code || row.payload.summary) {
              contentStructure = 'Legacy payload (definition/code/summary)';
            } else {
              contentStructure = `Payload with keys: ${Object.keys(row.payload).join(', ')}`;
            }
          } else if (row.blocks) {
            if (Array.isArray(row.blocks)) {
              hasBlockStructure = true;
              blockIds = row.blocks.map(b => b.id || b).slice(0, 10);
              contentStructure = 'Direct blocks array';
            }
          }
          
          findings.push({
            table: tableName,
            rowId: row.id || 'NO_ID',
            hasBlockStructure,
            blockIds,
            contentStructure,
            subtopicId: row.subtopic_id || null,
            navigationNodeId: row.navigation_node_id || null,
            status: row.status || null,
            brandId: row.brand_id || null,
          });
          
          if (hasBlockStructure) {
            console.log(`    🎯 BLOCK STRUCTURE FOUND!`);
            console.log(`       Row ID: ${row.id || 'N/A'}`);
            console.log(`       Blocks: ${blockIds.join(', ')}`);
          } else {
            console.log(`    ℹ️  Row ID: ${row.id || 'N/A'} - ${contentStructure}`);
          }
        }
      }
      
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}`);
    }
  }

  // Summary Report
  console.log('\n\n================================================================');
  console.log('SCAN RESULTS SUMMARY');
  console.log('================================================================\n');

  const tablesWithBlockContent = [...new Set(findings.filter(f => f.hasBlockStructure).map(f => f.table))];
  const tablesWithLegacyContent = [...new Set(findings.filter(f => !f.hasBlockStructure && f.contentStructure.includes('Legacy')).map(f => f.table))];
  
  console.log('TABLES WITH BLOCK-LEVEL CONTENT:');
  if (tablesWithBlockContent.length > 0) {
    tablesWithBlockContent.forEach(t => {
      const blocks = findings.filter(f => f.table === t && f.hasBlockStructure);
      console.log(`  ✅ ${t} (${blocks.length} row(s))`);
      
      // Show sample block IDs
      const sampleBlocks = blocks[0].blockIds;
      if (sampleBlocks.length > 0) {
        console.log(`     Sample blocks: ${sampleBlocks.slice(0, 5).join(', ')}`);
      }
    });
  } else {
    console.log('  ❌ NONE FOUND');
  }
  console.log('');

  console.log('TABLES WITH LEGACY CONTENT:');
  if (tablesWithLegacyContent.length > 0) {
    tablesWithLegacyContent.forEach(t => {
      const count = findings.filter(f => f.table === t && !f.hasBlockStructure).length;
      console.log(`  ⚠️  ${t} (${count} row(s))`);
    });
  } else {
    console.log('  None');
  }
  console.log('');

  // Detailed findings
  console.log('DETAILED FINDINGS:');
  console.log('─'.repeat(80));
  
  if (findings.length === 0) {
    console.log('❌ NO CONTENT FOUND for whatisjava in any table');
  } else {
    findings.forEach((f, i) => {
      console.log(`\n${i + 1}. Table: ${f.table}`);
      console.log(`   Row ID: ${f.rowId}`);
      console.log(`   Subtopic: ${f.subtopicId || 'N/A'}`);
      console.log(`   Navigation: ${f.navigationNodeId || 'N/A'}`);
      console.log(`   Brand: ${f.brandId || 'N/A'}`);
      console.log(`   Status: ${f.status || 'N/A'}`);
      console.log(`   Structure: ${f.contentStructure}`);
      
      if (f.hasBlockStructure) {
        console.log(`   ✅ Block IDs: ${f.blockIds.join(', ')}`);
      }
    });
  }
  console.log('');

  // Recommendations
  console.log('\n================================================================');
  console.log('RECOMMENDATIONS');
  console.log('================================================================\n');

  if (tablesWithBlockContent.length > 0) {
    console.log('✅ Block-level content EXISTS in TutorialDB');
    console.log(`   Table(s): ${tablesWithBlockContent.join(', ')}`);
    console.log('   Action: Update delivery code to read from correct table');
  } else if (tablesWithLegacyContent.length > 0) {
    console.log('⚠️  Only LEGACY content found (definition/code/summary)');
    console.log('   Block-level content (D1, C1, S1) does NOT exist');
    console.log('   Possible causes:');
    console.log('   1. Content never migrated to block structure');
    console.log('   2. Tutorial Composer creates legacy format');
    console.log('   3. Migration incomplete');
    console.log('');
    console.log('   Action: Determine if content needs regeneration or');
    console.log('           if legacy→block conversion is required');
  } else {
    console.log('❌ NO CONTENT FOUND for whatisjava');
    console.log('   Content may be:');
    console.log('   1. Deleted from all tables');
    console.log('   2. Stored under different identifier');
    console.log('   3. Never created');
  }
  console.log('');

  // ILS Compatibility
  console.log('BLOCK-LEVEL ILS COMPATIBILITY:');
  if (tablesWithBlockContent.length > 0) {
    console.log('  ✅ Block-level content available');
    console.log('  ✅ Compatible with BlockTelemetryProvider');
    console.log('  ✅ Can track D1, C1, S1 metrics');
  } else {
    console.log('  ❌ NO block-level content');
    console.log('  ❌ BlockTelemetryProvider cannot function');
    console.log('  ❌ Cannot track individual block metrics');
    console.log('  → Explains why block_learning_state is empty');
  }
  console.log('');

  await pool.end();
}

main().catch(err => {
  console.error('SCAN ERROR:', err);
  process.exit(1);
});
