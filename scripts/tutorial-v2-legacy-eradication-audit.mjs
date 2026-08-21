#!/usr/bin/env node
/**
 * TUTORIAL V2 LEGACY ERADICATION AUDIT
 * 
 * PURPOSE:
 * Evidence-based audit of Tutorial DB before removing legacy architecture.
 * 
 * OBJECTIVES:
 * 1. Count actual rows in tutorial_sections
 * 2. Classify content as Legacy vs V2 vs Unknown
 * 3. Identify which section_type values exist in reality
 * 4. Identify which difficulty values exist in reality
 * 5. Map FK dependencies
 * 6. Identify obsolete indexes
 * 7. Identify obsolete enums
 * 8. Produce ERADICATION MATRIX
 * 
 * SAFETY:
 * This script is READ-ONLY. It performs no mutations.
 */

import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

console.log('='.repeat(80));
console.log('TUTORIAL V2 LEGACY ERADICATION AUDIT');
console.log('READ-ONLY DATABASE ANALYSIS');
console.log('='.repeat(80));
console.log('');

const report = {
  timestamp: new Date().toISOString(),
  database: 'tutorial_prod',
  sections: {},
};

try {
  // ========================================================================
  // SECTION 1: TUTORIAL_SECTIONS ROW COUNT
  // ========================================================================
  console.log('📊 SECTION 1: tutorial_sections Row Count');
  console.log('-'.repeat(80));
  
  const rowCountResult = await pool.query(`
    SELECT 
      COUNT(*) AS total_rows,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_rows,
      COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) AS deleted_rows
    FROM tutorial_sections
  `);
  
  const rowCount = rowCountResult.rows[0];
  report.sections.rowCount = rowCount;
  
  console.log(`Total rows:   ${rowCount.total_rows}`);
  console.log(`Active rows:  ${rowCount.active_rows}`);
  console.log(`Deleted rows: ${rowCount.deleted_rows}`);
  console.log('');
  
  if (parseInt(rowCount.total_rows) === 0) {
    console.log('✅ FINDING: tutorial_sections is EMPTY');
    console.log('   → Migration can proceed with clean slate');
    console.log('   → No legacy content to preserve');
    console.log('');
  } else {
    console.log('⚠️  FINDING: tutorial_sections contains rows');
    console.log('   → Must classify content before removal');
    console.log('');
  }

  // ========================================================================
  // SECTION 2: SECTION_TYPE DISTRIBUTION
  // ========================================================================
  console.log('📊 SECTION 2: section_type Distribution');
  console.log('-'.repeat(80));
  
  const sectionTypeResult = await pool.query(`
    SELECT 
      section_type,
      COUNT(*) AS row_count,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_count
    FROM tutorial_sections
    GROUP BY section_type
    ORDER BY row_count DESC, section_type
  `);
  
  report.sections.sectionTypes = sectionTypeResult.rows;
  
  if (sectionTypeResult.rows.length === 0) {
    console.log('No section_type values found (table is empty)');
  } else {
    console.log('section_type       | Total | Active');
    console.log('-------------------|-------|-------');
    sectionTypeResult.rows.forEach(row => {
      console.log(`${row.section_type.padEnd(19)}| ${String(row.row_count).padStart(5)} | ${String(row.active_count).padStart(6)}`);
    });
  }
  console.log('');

  // ========================================================================
  // SECTION 3: DIFFICULTY DISTRIBUTION
  // ========================================================================
  console.log('📊 SECTION 3: difficulty Distribution');
  console.log('-'.repeat(80));
  
  const difficultyResult = await pool.query(`
    SELECT 
      difficulty,
      COUNT(*) AS row_count,
      COUNT(*) FILTER (WHERE deleted_at IS NULL) AS active_count
    FROM tutorial_sections
    GROUP BY difficulty
    ORDER BY row_count DESC, difficulty
  `);
  
  report.sections.difficulties = difficultyResult.rows;
  
  if (difficultyResult.rows.length === 0) {
    console.log('No difficulty values found (table is empty)');
  } else {
    console.log('difficulty         | Total | Active');
    console.log('-------------------|-------|-------');
    difficultyResult.rows.forEach(row => {
      console.log(`${row.difficulty.padEnd(19)}| ${String(row.row_count).padStart(5)} | ${String(row.active_count).padStart(6)}`);
    });
  }
  console.log('');

  // ========================================================================
  // SECTION 4: CONTENT CLASSIFICATION
  // ========================================================================
  console.log('📊 SECTION 4: Content Classification (V2 vs Legacy)');
  console.log('-'.repeat(80));
  
  if (parseInt(rowCount.active_rows) > 0) {
    const contentSample = await pool.query(`
      SELECT 
        id,
        subtopic_id,
        section_type,
        difficulty,
        brand_id,
        status,
        version,
        jsonb_typeof(content) AS content_type,
        CASE 
          WHEN content ? 'blocks' THEN jsonb_array_length(content->'blocks')
          ELSE 0
        END AS block_count,
        content->'blocks' AS blocks,
        content->'schemaVersion' AS schema_version
      FROM tutorial_sections
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    report.sections.contentSamples = [];
    
    let v2Count = 0;
    let legacyCount = 0;
    let unknownCount = 0;
    
    console.log('Analyzing content structure...');
    console.log('');
    
    contentSample.rows.forEach((row, idx) => {
      let classification = 'UNKNOWN';
      let blockInfo = '';
      
      // Check if TutorialDocument V2
      if (row.blocks && Array.isArray(row.blocks)) {
        const blocks = row.blocks;
        const blockTypes = blocks.map(b => `${b.type}/${b.version || '?'}`);
        
        const hasV2Blocks = blocks.some(b => 
          (b.type === 'definition' && ['d1', 'd2'].includes(b.version)) ||
          (b.type === 'code' && ['c1', 'c2'].includes(b.version)) ||
          (b.type === 'summary' && b.version === 's1')
        );
        
        const hasLegacyStructure = blocks.some(b => 
          ['notes', 'layman', 'real_life', 'technical'].includes(b.type)
        );
        
        if (hasV2Blocks) {
          classification = 'V2';
          v2Count++;
        } else if (hasLegacyStructure) {
          classification = 'LEGACY';
          legacyCount++;
        } else {
          classification = 'UNKNOWN';
          unknownCount++;
        }
        
        blockInfo = blockTypes.slice(0, 5).join(', ');
        if (blocks.length > 5) blockInfo += '...';
      } else {
        classification = 'LEGACY_OR_MALFORMED';
        legacyCount++;
        blockInfo = 'No blocks array';
      }
      
      if (idx < 10) {
        console.log(`Row ${idx + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Classification: ${classification}`);
        console.log(`  section_type: ${row.section_type}, difficulty: ${row.difficulty}`);
        console.log(`  Block count: ${row.block_count}`);
        console.log(`  Blocks: ${blockInfo}`);
        console.log('');
      }
      
      report.sections.contentSamples.push({
        id: row.id,
        subtopic_id: row.subtopic_id,
        section_type: row.section_type,
        difficulty: row.difficulty,
        brand_id: row.brand_id,
        classification,
        block_count: row.block_count,
        blocks: blockInfo,
      });
    });
    
    console.log('CLASSIFICATION SUMMARY:');
    console.log(`  V2 content:      ${v2Count}`);
    console.log(`  Legacy content:  ${legacyCount}`);
    console.log(`  Unknown:         ${unknownCount}`);
    console.log('');
    
    report.sections.classificationSummary = {
      v2: v2Count,
      legacy: legacyCount,
      unknown: unknownCount,
    };
    
    if (v2Count > 0 && legacyCount === 0) {
      console.log('✅ FINDING: All content is V2 TutorialDocument');
      console.log('   → Legacy metadata (section_type, difficulty) can be safely removed');
      console.log('');
    } else if (v2Count > 0 && legacyCount > 0) {
      console.log('⚠️  FINDING: Mixed V2 and Legacy content');
      console.log('   → Requires migration strategy');
      console.log('');
    } else if (legacyCount > 0 && v2Count === 0) {
      console.log('🔴 FINDING: Only legacy content found');
      console.log('   → Must convert or remove before V2 migration');
      console.log('');
    }
  } else {
    console.log('No active rows to classify');
    console.log('');
  }

  // ========================================================================
  // SECTION 5: OTHER TUTORIAL TABLES
  // ========================================================================
  console.log('📊 SECTION 5: Other Tutorial Tables');
  console.log('-'.repeat(80));
  
  const allTables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  report.sections.allTables = allTables.rows.map(r => r.table_name);
  
  console.log(`Total tables in tutorial_prod: ${allTables.rows.length}`);
  console.log('');
  
  // Check specific legacy tables
  const legacyTables = ['tutorial_content', 'tutorial_subsections'];
  
  for (const tableName of legacyTables) {
    const exists = allTables.rows.some(r => r.table_name === tableName);
    if (exists) {
      const count = await pool.query(`SELECT COUNT(*) AS cnt FROM ${tableName}`);
      const rowCount = count.rows[0].cnt;
      console.log(`  ${tableName}: ${rowCount} rows`);
      
      if (!report.sections.legacyTables) report.sections.legacyTables = {};
      report.sections.legacyTables[tableName] = parseInt(rowCount);
    }
  }
  console.log('');

  // ========================================================================
  // SECTION 6: FOREIGN KEY DEPENDENCIES
  // ========================================================================
  console.log('📊 SECTION 6: Foreign Key Dependencies');
  console.log('-'.repeat(80));
  
  const fkResult = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name
  `);
  
  report.sections.foreignKeys = fkResult.rows;
  
  console.log(`Found ${fkResult.rows.length} foreign key constraints`);
  console.log('');
  
  // Check FK dependencies on tutorial_sections
  const tutorialSectionsFKs = fkResult.rows.filter(
    fk => fk.referenced_table === 'tutorial_sections'
  );
  
  if (tutorialSectionsFKs.length > 0) {
    console.log('⚠️  Tables with FK to tutorial_sections:');
    tutorialSectionsFKs.forEach(fk => {
      console.log(`  ${fk.table_name}.${fk.column_name} → tutorial_sections.${fk.referenced_column}`);
    });
    console.log('');
    console.log('   → These tables may be affected by tutorial_sections changes');
    console.log('');
  }

  // ========================================================================
  // SECTION 7: INDEXES
  // ========================================================================
  console.log('📊 SECTION 7: Indexes on tutorial_sections');
  console.log('-'.repeat(80));
  
  const indexResult = await pool.query(`
    SELECT
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'tutorial_sections'
    ORDER BY indexname
  `);
  
  report.sections.indexes = indexResult.rows;
  
  console.log(`Found ${indexResult.rows.length} indexes`);
  console.log('');
  
  indexResult.rows.forEach(idx => {
    const isLegacy = 
      idx.indexdef.includes('section_type') || 
      idx.indexdef.includes('difficulty') ||
      idx.indexname.includes('type_difficulty');
    
    const marker = isLegacy ? '🔴' : '🟢';
    console.log(`${marker} ${idx.indexname}`);
    console.log(`   ${idx.indexdef}`);
    console.log('');
  });

  // ========================================================================
  // SECTION 8: ENUMS
  // ========================================================================
  console.log('📊 SECTION 8: Tutorial-Related Enums');
  console.log('-'.repeat(80));
  
  const enumResult = await pool.query(`
    SELECT
      t.typname AS enum_name,
      e.enumlabel AS enum_value,
      e.enumsortorder
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname LIKE '%tutorial%' OR t.typname LIKE '%section%' OR t.typname LIKE '%difficulty%'
    ORDER BY t.typname, e.enumsortorder
  `);
  
  // Group enum values
  const enums = {};
  enumResult.rows.forEach(row => {
    if (!enums[row.enum_name]) {
      enums[row.enum_name] = [];
    }
    enums[row.enum_name].push(row.enum_value);
  });
  
  report.sections.enums = enums;
  
  console.log(`Found ${Object.keys(enums).length} tutorial-related enums`);
  console.log('');
  
  Object.entries(enums).forEach(([name, values]) => {
    console.log(`${name}:`);
    console.log(`  Values: ${values.join(', ')}`);
    console.log('');
  });

  // ========================================================================
  // SECTION 9: BRAND DISTRIBUTION
  // ========================================================================
  console.log('📊 SECTION 9: Brand Distribution');
  console.log('-'.repeat(80));
  
  if (parseInt(rowCount.active_rows) > 0) {
    const brandResult = await pool.query(`
      SELECT 
        brand_id,
        COUNT(*) AS row_count
      FROM tutorial_sections
      WHERE deleted_at IS NULL
      GROUP BY brand_id
      ORDER BY row_count DESC
    `);
    
    report.sections.brands = brandResult.rows;
    
    console.log('brand_id           | Count');
    console.log('-------------------|-------');
    brandResult.rows.forEach(row => {
      console.log(`${row.brand_id.padEnd(19)}| ${String(row.row_count).padStart(6)}`);
    });
    console.log('');
  } else {
    console.log('No active rows to analyze');
    console.log('');
  }

  // ========================================================================
  // SECTION 10: UNIQUE CONSTRAINT CHECK
  // ========================================================================
  console.log('📊 SECTION 10: Unique Constraints');
  console.log('-'.repeat(80));
  
  const constraintResult = await pool.query(`
    SELECT
      conname AS constraint_name,
      pg_get_constraintdef(oid) AS constraint_definition
    FROM pg_constraint
    WHERE conrelid = 'tutorial_sections'::regclass
      AND contype = 'u'
    ORDER BY conname
  `);
  
  report.sections.uniqueConstraints = constraintResult.rows;
  
  console.log(`Found ${constraintResult.rows.length} unique constraints`);
  console.log('');
  
  constraintResult.rows.forEach(c => {
    const isLegacy = 
      c.constraint_definition.includes('section_type') || 
      c.constraint_definition.includes('difficulty');
    
    const marker = isLegacy ? '🔴 LEGACY' : '🟢 V2';
    console.log(`${marker}: ${c.constraint_name}`);
    console.log(`  ${c.constraint_definition}`);
    console.log('');
  });

  // ========================================================================
  // FINAL SUMMARY
  // ========================================================================
  console.log('='.repeat(80));
  console.log('ERADICATION MATRIX');
  console.log('='.repeat(80));
  console.log('');
  
  console.log('DATABASE COMPONENTS:');
  console.log('  ❌ tutorial_sections.section_type    - Remove column');
  console.log('  ❌ tutorial_sections.difficulty       - Remove column');
  console.log('  ❌ Unique constraint (4-tuple)        - Replace with (subtopic_id, brand_id)');
  console.log('  ❌ Legacy indexes (with section_type/difficulty) - Remove');
  console.log('  ❌ section_type enum                  - Remove if unused elsewhere');
  console.log('  ❌ tutorial_difficulty enum           - Keep only if used by assessments');
  console.log('');
  
  console.log('CONTENT:');
  if (parseInt(rowCount.total_rows) === 0) {
    console.log('  ✅ No existing rows - clean slate migration');
  } else if (report.sections.classificationSummary) {
    const { v2, legacy } = report.sections.classificationSummary;
    if (v2 > 0 && legacy === 0) {
      console.log('  ✅ All content is V2 TutorialDocument');
      console.log('  ✅ Can safely remove legacy metadata columns');
    } else if (legacy > 0) {
      console.log('  ⚠️  Legacy content detected - requires migration');
    }
  }
  console.log('');
  
  console.log('NEXT STEPS:');
  console.log('  1. Review this audit report');
  console.log('  2. Verify classification of content samples');
  console.log('  3. Create migration script to:');
  console.log('     - Drop section_type column');
  console.log('     - Drop difficulty column');
  console.log('     - Drop legacy unique constraint');
  console.log('     - Add UNIQUE(subtopic_id, brand_id)');
  console.log('     - Drop legacy indexes');
  console.log('  4. Update TypeScript contracts');
  console.log('  5. Update repository layer');
  console.log('  6. Update service layer');
  console.log('  7. Update API layer');
  console.log('  8. Update delivery layer');
  console.log('  9. Update vector/RAG layer');
  console.log('  10. Run regression tests');
  console.log('');

  // ========================================================================
  // WRITE REPORT TO FILE
  // ========================================================================
  const reportPath = './scripts/tutorial-v2-eradication-audit-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Full report written to: ${reportPath}`);
  console.log('');

} catch (err) {
  console.error('❌ ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
} finally {
  await pool.end();
}

console.log('='.repeat(80));
console.log('AUDIT COMPLETE');
console.log('='.repeat(80));
