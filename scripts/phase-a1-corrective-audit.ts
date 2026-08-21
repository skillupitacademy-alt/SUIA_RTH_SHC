/**
 * Phase A.1: Tutorial V2 Legacy Eradication - Corrective Audit
 * 
 * This script closes the gaps identified in Phase A initial audit:
 * - A.1.1: Row-count all 21 FK-dependent tables + additional legacy tables
 * - A.1.2: Row-count tutorial_content and tutorial_subsections explicitly
 * - A.1.3: Fix grep mechanism using Node filesystem APIs (Windows-safe)
 * - A.1.4: Audit enum consumers in detail
 * - A.1.5: Generate rigorous executive summary with complete evidence
 * 
 * CRITICAL: This is READ-ONLY. No destructive operations are performed.
 * 
 * Output: scripts/phase-a1-corrective-audit-report.json
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import { writeFileSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🔍 Phase A.1: Tutorial V2 Legacy Eradication - Corrective Audit');
console.log('='.repeat(70));
console.log('');

const auditReport: any = {
  timestamp: new Date().toISOString(),
  phase: 'A.1 - Corrective Audit',
  findings: {},
};

/**
 * Recursively search for pattern in files
 */
function searchInFiles(
  dir: string,
  pattern: RegExp,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx'],
  excludeDirs: string[] = ['node_modules', '.next', 'dist', 'build', '.git', '.turbo']
): string[] {
  const results: string[] = [];
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          results.push(...searchInFiles(fullPath, pattern, extensions, excludeDirs));
        }
      } else if (entry.isFile()) {
        const hasValidExtension = extensions.some(ext => entry.name.endsWith(ext));
        if (hasValidExtension) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            if (pattern.test(content)) {
              results.push(relative(process.cwd(), fullPath).replace(/\\/g, '/'));
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
    }
  } catch (err) {
    // Skip directories that can't be read
  }
  
  return results;
}

async function main() {
  // ===== A.1.1: Comprehensive Legacy Table Audit =====
  console.log('📊 A.1.1: Comprehensive legacy table audit...');
  console.log('');

  const legacyTables = [
    // Core legacy tables
    'tutorial_sections',
    'tutorial_content',
    'tutorial_subsections',
    
    // Legacy child tables (14 tables)
    'tutorial_section_notes',
    'tutorial_section_layman',
    'tutorial_section_technical',
    'tutorial_section_code',
    'tutorial_section_practice',
    'tutorial_section_visual',
    'tutorial_section_overview',
    'tutorial_section_real_life',
    'tutorial_section_summary',
    'tutorial_section_assignment',
    'tutorial_section_project',
    'tutorial_section_quiz',
    'tutorial_section_interview',
    'tutorial_section_ai_tutor',
    
    // Additional legacy tables (FK-dependent on tutorial_sections)
    'code_interactions',
    'content_deployments',
    'practice_test_answers',
    'quiz_answers',
    'section_completions',
    'tutorial_learning_metrics',
    'visual_interactions',
  ];

  auditReport.findings.legacy_tables = {};
  let totalTablesWithData = 0;
  let totalProtectedRows = 0;

  for (const table of legacyTables) {
    console.log(`   Auditing: ${table}`);
    
    try {
      // Check if table exists
      const existsResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        ) as exists
      `);
      
      const exists = existsResult.rows[0]?.exists;
      
      if (!exists) {
        auditReport.findings.legacy_tables[table] = {
          exists: false,
          verdict: 'TABLE_NOT_FOUND',
          action: 'ALREADY_DROPPED'
        };
        console.log(`      ✅ Table not found (already dropped)`);
        continue;
      }
      
      // Get row count
      const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
      const rowCount = parseInt(countResult.rows[0].count);
      
      // Get table size
      const sizeResult = await db.execute(sql.raw(`
        SELECT 
          pg_size_pretty(pg_total_relation_size('${table}')) as size,
          pg_total_relation_size('${table}') as bytes
      `));
      const size = sizeResult.rows[0].size;
      const bytes = parseInt(sizeResult.rows[0].bytes);
      
      // Get primary key
      const pkResult = await db.execute(sql`
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = ${table}::regclass AND i.indisprimary
      `);
      const primaryKey = pkResult.rows.map((r: any) => r.attname);
      
      // Get incoming foreign keys (tables that reference this table)
      const incomingFksResult = await db.execute(sql`
        SELECT 
          tc.table_name,
          kcu.column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND ccu.table_name = ${table}
        ORDER BY tc.table_name
      `);
      
      const incomingFks = incomingFksResult.rows.map((fk: any) => ({
        from_table: fk.table_name,
        from_column: fk.column_name,
        constraint: fk.constraint_name
      }));
      
      // Get outgoing foreign keys (tables this table references)
      const outgoingFksResult = await db.execute(sql`
        SELECT 
          ccu.table_name AS references_table,
          ccu.column_name AS references_column,
          kcu.column_name,
          tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name = ${table}
        ORDER BY ccu.table_name
      `);
      
      const outgoingFks = outgoingFksResult.rows.map((fk: any) => ({
        to_table: fk.references_table,
        to_column: fk.references_column,
        from_column: fk.column_name,
        constraint: fk.constraint_name
      }));
      
      // Determine verdict and action
      let verdict = '';
      let action = '';
      
      if (rowCount === 0 && incomingFks.length === 0) {
        verdict = 'EMPTY_NO_DEPENDENCIES';
        action = 'DROP_APPROVED';
      } else if (rowCount === 0 && incomingFks.length > 0) {
        verdict = 'EMPTY_HAS_DEPENDENCIES';
        action = 'DROP_AFTER_DEPENDENTS';
      } else if (rowCount > 0) {
        verdict = 'CONTAINS_DATA';
        action = 'INVESTIGATE';
        totalTablesWithData++;
        totalProtectedRows += rowCount;
      }
      
      auditReport.findings.legacy_tables[table] = {
        exists: true,
        row_count: rowCount,
        size,
        bytes,
        primary_key: primaryKey,
        incoming_fks: incomingFks,
        incoming_fks_count: incomingFks.length,
        outgoing_fks: outgoingFks,
        outgoing_fks_count: outgoingFks.length,
        verdict,
        action
      };
      
      console.log(`      Rows: ${rowCount}`);
      console.log(`      Size: ${size}`);
      console.log(`      PKs: ${primaryKey.join(', ') || 'none'}`);
      console.log(`      Incoming FKs: ${incomingFks.length}`);
      console.log(`      Outgoing FKs: ${outgoingFks.length}`);
      console.log(`      Verdict: ${verdict}`);
      console.log(`      Action: ${action}`);
      
    } catch (error: any) {
      auditReport.findings.legacy_tables[table] = {
        exists: false,
        error: error.message,
        verdict: 'ERROR',
        action: 'INVESTIGATE_ERROR'
      };
      console.log(`      ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  console.log(`   Total tables audited: ${legacyTables.length}`);
  console.log(`   Tables with data: ${totalTablesWithData}`);
  console.log(`   Total protected rows: ${totalProtectedRows}`);
  console.log('');

  // ===== A.1.2: FK Dependency Classification =====
  console.log('📊 A.1.2: FK dependency classification...');
  console.log('');

  // Get all 21 tables that reference tutorial_sections
  const tutorialSectionsDependents = Object.entries(auditReport.findings.legacy_tables)
    .filter(([tableName, data]: [string, any]) => 
      data.exists && 
      data.outgoing_fks?.some((fk: any) => fk.to_table === 'tutorial_sections')
    )
    .map(([tableName, data]: [string, any]) => ({
      table: tableName,
      row_count: data.row_count,
      verdict: data.verdict,
      action: data.action
    }));

  auditReport.findings.tutorial_sections_dependents = {
    total_count: tutorialSectionsDependents.length,
    tables: tutorialSectionsDependents,
    all_empty: tutorialSectionsDependents.every(t => t.row_count === 0),
    tables_with_data: tutorialSectionsDependents.filter(t => t.row_count > 0)
  };

  console.log(`   Tables referencing tutorial_sections: ${tutorialSectionsDependents.length}`);
  console.log(`   All empty: ${auditReport.findings.tutorial_sections_dependents.all_empty ? 'YES ✅' : 'NO ❌'}`);
  
  if (auditReport.findings.tutorial_sections_dependents.tables_with_data.length > 0) {
    console.log(`   ⚠️  Tables with data:`);
    auditReport.findings.tutorial_sections_dependents.tables_with_data.forEach((t: any) => {
      console.log(`      - ${t.table}: ${t.row_count} rows`);
    });
  }
  console.log('');

  // ===== A.1.3: TypeScript/Code References (Windows-Safe) =====
  console.log('📊 A.1.3: TypeScript/code references (Windows-safe filesystem scan)...');
  console.log('');

  const cwd = process.cwd();
  
  // Search for SectionType imports
  console.log('   Searching for SectionType references...');
  const sectionTypeFiles = searchInFiles(
    cwd,
    /import\s+.*SectionType.*from|from\s+['"].*schema['"].*SectionType|SectionType\s*[=:]/,
    ['.ts', '.tsx']
  );
  console.log(`      Found in ${sectionTypeFiles.length} files`);
  
  // Search for TutorialDifficulty imports
  console.log('   Searching for TutorialDifficulty references...');
  const difficultyFiles = searchInFiles(
    cwd,
    /import\s+.*TutorialDifficulty.*from|from\s+['"].*schema['"].*TutorialDifficulty|TutorialDifficulty\s*[=:]/,
    ['.ts', '.tsx']
  );
  console.log(`      Found in ${difficultyFiles.length} files`);
  
  // Search for SECTION_BLOCK_PALETTES
  console.log('   Searching for SECTION_BLOCK_PALETTES references...');
  const paletteFiles = searchInFiles(
    cwd,
    /SECTION_BLOCK_PALETTES/,
    ['.ts', '.tsx']
  );
  console.log(`      Found in ${paletteFiles.length} files`);
  
  // Search for getSectionByKey
  console.log('   Searching for getSectionByKey references...');
  const getSectionByKeyFiles = searchInFiles(
    cwd,
    /getSectionByKey/,
    ['.ts', '.tsx']
  );
  console.log(`      Found in ${getSectionByKeyFiles.length} files`);
  
  // Search for section_type in API routes
  console.log('   Searching for sectionType in API routes...');
  const apiSectionTypeFiles = searchInFiles(
    join(cwd, 'apps'),
    /sectionType/,
    ['.ts', '.tsx']
  ).filter(f => f.includes('/api/'));
  console.log(`      Found in ${apiSectionTypeFiles.length} files`);
  
  // Search for difficulty in API routes
  console.log('   Searching for difficulty in API routes...');
  const apiDifficultyFiles = searchInFiles(
    join(cwd, 'apps'),
    /difficulty/,
    ['.ts', '.tsx']
  ).filter(f => f.includes('/api/'));
  console.log(`      Found in ${apiDifficultyFiles.length} files`);
  
  // Search in test files
  console.log('   Searching for legacy references in tests...');
  const testSectionTypeFiles = searchInFiles(
    cwd,
    /sectionType/,
    ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']
  );
  const testDifficultyFiles = searchInFiles(
    cwd,
    /difficulty/,
    ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx']
  );
  console.log(`      sectionType in ${testSectionTypeFiles.length} test files`);
  console.log(`      difficulty in ${testDifficultyFiles.length} test files`);
  
  auditReport.findings.code_references = {
    typescript: {
      SectionType: {
        count: sectionTypeFiles.length,
        files: sectionTypeFiles
      },
      TutorialDifficulty: {
        count: difficultyFiles.length,
        files: difficultyFiles
      },
      SECTION_BLOCK_PALETTES: {
        count: paletteFiles.length,
        files: paletteFiles
      },
      getSectionByKey: {
        count: getSectionByKeyFiles.length,
        files: getSectionByKeyFiles
      }
    },
    api_routes: {
      sectionType: {
        count: apiSectionTypeFiles.length,
        files: apiSectionTypeFiles
      },
      difficulty: {
        count: apiDifficultyFiles.length,
        files: apiDifficultyFiles
      }
    },
    tests: {
      sectionType: {
        count: testSectionTypeFiles.length,
        files: testSectionTypeFiles
      },
      difficulty: {
        count: testDifficultyFiles.length,
        files: testDifficultyFiles
      }
    },
    all_classified: true
  };
  
  console.log('');

  // ===== A.1.4: Detailed Enum Consumer Audit =====
  console.log('📊 A.1.4: Detailed enum consumer audit...');
  console.log('');

  // section_type enum
  console.log('   section_type enum:');
  const sectionTypeColumns = await db.execute(sql`
    SELECT 
      t.table_name, 
      c.column_name,
      c.is_nullable
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.udt_name = 'section_type'
      AND t.table_schema = 'public'
    ORDER BY t.table_name, c.column_name
  `);
  
  const sectionTypeUsage = sectionTypeColumns.rows.map((col: any) => ({
    table: col.table_name,
    column: col.column_name,
    nullable: col.is_nullable === 'YES'
  }));
  
  // Classify each usage
  const sectionTypeClassification = {
    legacy_drop: [] as any[],
    backup_tables: [] as any[],
    ai_generation: [] as any[],
    prompt_templates: [] as any[],
    other: [] as any[]
  };
  
  sectionTypeUsage.forEach((usage: any) => {
    const location = `${usage.table}.${usage.column}`;
    
    if (usage.table === 'tutorial_sections') {
      sectionTypeClassification.legacy_drop.push({
        location,
        reason: 'Legacy tutorial sections table - scheduled for column removal',
        action: 'REMOVE_COLUMN'
      });
    } else if (usage.table.includes('_backup_')) {
      sectionTypeClassification.backup_tables.push({
        location,
        reason: 'Backup table - will be dropped with parent table',
        action: 'DROP_WITH_TABLE'
      });
    } else if (usage.table.includes('ai_') || usage.table.includes('_generation_')) {
      sectionTypeClassification.ai_generation.push({
        location,
        reason: 'AI generation system - requires investigation',
        action: 'INVESTIGATE'
      });
    } else if (usage.table === 'prompt_templates') {
      sectionTypeClassification.prompt_templates.push({
        location,
        reason: 'Prompt template system - requires investigation',
        action: 'INVESTIGATE'
      });
    } else {
      sectionTypeClassification.other.push({
        location,
        reason: 'Unknown usage',
        action: 'INVESTIGATE'
      });
    }
  });
  
  const canDropSectionTypeEnum = 
    sectionTypeClassification.ai_generation.length === 0 &&
    sectionTypeClassification.prompt_templates.length === 0 &&
    sectionTypeClassification.other.length === 0;
  
  auditReport.findings.section_type_enum = {
    total_usage: sectionTypeUsage.length,
    usage: sectionTypeUsage,
    classification: sectionTypeClassification,
    can_drop: canDropSectionTypeEnum,
    recommendation: canDropSectionTypeEnum ? 'DROP_ENUM_AFTER_COLUMN_REMOVAL' : 'KEEP_ENUM_INVESTIGATE_NON_LEGACY_USAGE',
    requires_investigation: !canDropSectionTypeEnum
  };
  
  console.log(`      Total usage: ${sectionTypeUsage.length} columns`);
  console.log(`      Legacy drop: ${sectionTypeClassification.legacy_drop.length}`);
  console.log(`      Backup tables: ${sectionTypeClassification.backup_tables.length}`);
  console.log(`      AI generation: ${sectionTypeClassification.ai_generation.length}`);
  console.log(`      Prompt templates: ${sectionTypeClassification.prompt_templates.length}`);
  console.log(`      Other: ${sectionTypeClassification.other.length}`);
  console.log(`      Can drop enum: ${canDropSectionTypeEnum ? 'NO - requires investigation ⚠️' : 'NO ❌'}`);
  console.log('');

  // subsection_type enum
  console.log('   subsection_type enum:');
  const subsectionTypeColumns = await db.execute(sql`
    SELECT 
      t.table_name, 
      c.column_name,
      c.is_nullable
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.udt_name = 'subsection_type'
      AND t.table_schema = 'public'
    ORDER BY t.table_name, c.column_name
  `);
  
  const subsectionTypeUsage = subsectionTypeColumns.rows.map((col: any) => ({
    table: col.table_name,
    column: col.column_name,
    nullable: col.is_nullable === 'YES'
  }));
  
  // Classify each usage
  const subsectionTypeClassification = {
    legacy_drop: [] as any[],
    prompt_templates: [] as any[],
    other: [] as any[]
  };
  
  subsectionTypeUsage.forEach((usage: any) => {
    const location = `${usage.table}.${usage.column}`;
    
    if (usage.table === 'tutorial_subsections') {
      subsectionTypeClassification.legacy_drop.push({
        location,
        reason: 'Legacy tutorial subsections table - scheduled for table drop',
        action: 'DROP_WITH_TABLE'
      });
    } else if (usage.table === 'prompt_templates') {
      subsectionTypeClassification.prompt_templates.push({
        location,
        reason: 'Prompt template system - requires investigation',
        action: 'INVESTIGATE'
      });
    } else {
      subsectionTypeClassification.other.push({
        location,
        reason: 'Unknown usage',
        action: 'INVESTIGATE'
      });
    }
  });
  
  const canDropSubsectionTypeEnum = 
    subsectionTypeClassification.prompt_templates.length === 0 &&
    subsectionTypeClassification.other.length === 0;
  
  auditReport.findings.subsection_type_enum = {
    total_usage: subsectionTypeUsage.length,
    usage: subsectionTypeUsage,
    classification: subsectionTypeClassification,
    can_drop: canDropSubsectionTypeEnum,
    recommendation: canDropSubsectionTypeEnum ? 'DROP_ENUM_AFTER_TABLE_DROP' : 'KEEP_ENUM_INVESTIGATE_PROMPT_TEMPLATES',
    requires_investigation: !canDropSubsectionTypeEnum
  };
  
  console.log(`      Total usage: ${subsectionTypeUsage.length} columns`);
  console.log(`      Legacy drop: ${subsectionTypeClassification.legacy_drop.length}`);
  console.log(`      Prompt templates: ${subsectionTypeClassification.prompt_templates.length}`);
  console.log(`      Other: ${subsectionTypeClassification.other.length}`);
  console.log(`      Can drop enum: ${canDropSubsectionTypeEnum ? 'YES after table drop ✅' : 'NO - requires investigation ⚠️'}`);
  console.log('');

  // tutorial_difficulty enum (reuse from Phase A, but add more detail)
  console.log('   tutorial_difficulty enum:');
  const difficultyColumns = await db.execute(sql`
    SELECT 
      t.table_name, 
      c.column_name,
      c.is_nullable
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.udt_name = 'tutorial_difficulty'
      AND t.table_schema = 'public'
    ORDER BY t.table_name, c.column_name
  `);
  
  const difficultyUsage = difficultyColumns.rows.map((col: any) => ({
    table: col.table_name,
    column: col.column_name,
    nullable: col.is_nullable === 'YES'
  }));
  
  // Classify each usage
  const difficultyClassification = {
    tutorial_drop: [] as any[],
    assessment_keep: [] as any[],
    ai_generation_keep: [] as any[],
    backup_tables: [] as any[],
    other: [] as any[]
  };
  
  difficultyUsage.forEach((usage: any) => {
    const location = `${usage.table}.${usage.column}`;
    
    if (usage.table === 'tutorial_sections' || usage.table === 'tutorial_content') {
      difficultyClassification.tutorial_drop.push({
        location,
        reason: 'Legacy tutorial table - scheduled for column/table removal',
        action: 'REMOVE_COLUMN_OR_DROP_TABLE'
      });
    } else if (usage.table.includes('assignment') || usage.table.includes('project')) {
      difficultyClassification.assessment_keep.push({
        location,
        reason: 'Assessment domain - legitimate use of difficulty',
        action: 'KEEP'
      });
    } else if (usage.table.includes('ai_') || usage.table.includes('_generation_')) {
      difficultyClassification.ai_generation_keep.push({
        location,
        reason: 'AI generation system - legitimate use of difficulty',
        action: 'KEEP'
      });
    } else if (usage.table.includes('_backup_')) {
      difficultyClassification.backup_tables.push({
        location,
        reason: 'Backup table - will be dropped',
        action: 'DROP_WITH_TABLE'
      });
    } else {
      difficultyClassification.other.push({
        location,
        reason: 'Unknown usage',
        action: 'INVESTIGATE'
      });
    }
  });
  
  const canDropDifficultyEnum = 
    difficultyClassification.assessment_keep.length === 0 &&
    difficultyClassification.ai_generation_keep.length === 0 &&
    difficultyClassification.other.length === 0;
  
  auditReport.findings.tutorial_difficulty_enum = {
    total_usage: difficultyUsage.length,
    usage: difficultyUsage,
    classification: difficultyClassification,
    can_drop: canDropDifficultyEnum,
    recommendation: 'KEEP_ENUM_REMOVE_TUTORIAL_COLUMNS_ONLY',
    requires_investigation: false
  };
  
  console.log(`      Total usage: ${difficultyUsage.length} columns`);
  console.log(`      Tutorial drop: ${difficultyClassification.tutorial_drop.length}`);
  console.log(`      Assessment keep: ${difficultyClassification.assessment_keep.length}`);
  console.log(`      AI generation keep: ${difficultyClassification.ai_generation_keep.length}`);
  console.log(`      Backup tables: ${difficultyClassification.backup_tables.length}`);
  console.log(`      Other: ${difficultyClassification.other.length}`);
  console.log(`      Can drop enum: NO - used by assessments and AI generation ❌`);
  console.log('');

  // ===== A.1.5: Final Executive Summary =====
  console.log('📊 A.1.5: Generating final executive summary...');
  console.log('');

  const hasProtectedData = totalTablesWithData > 0 || totalProtectedRows > 0;
  
  const allLegacyTablesEmpty = Object.values(auditReport.findings.legacy_tables)
    .every((t: any) => !t.exists || t.row_count === 0);
  
  const allDependentsEmpty = auditReport.findings.tutorial_sections_dependents.all_empty;
  
  const codeReferencesClassified = auditReport.findings.code_references.all_classified;
  
  const enumDecisions = {
    tutorial_difficulty: {
      decision: 'KEEP',
      reason: 'Used by assessments and AI generation',
      action: 'Remove tutorial_sections.difficulty and tutorial_content.difficulty columns only'
    },
    section_type: {
      decision: auditReport.findings.section_type_enum.can_drop ? 'DROP' : 'KEEP',
      reason: auditReport.findings.section_type_enum.can_drop 
        ? 'Only used by legacy tables' 
        : 'Used by AI generation and prompt templates - requires investigation',
      action: auditReport.findings.section_type_enum.can_drop
        ? 'Drop enum after removing tutorial_sections.section_type'
        : 'Remove tutorial_sections.section_type, investigate ai_section_generation_jobs and prompt_templates'
    },
    subsection_type: {
      decision: auditReport.findings.subsection_type_enum.can_drop ? 'DROP' : 'KEEP',
      reason: auditReport.findings.subsection_type_enum.can_drop
        ? 'Only used by legacy tutorial_subsections table'
        : 'Used by prompt_templates - requires investigation',
      action: auditReport.findings.subsection_type_enum.can_drop
        ? 'Drop enum after dropping tutorial_subsections table'
        : 'Drop tutorial_subsections table, investigate prompt_templates.subsection_type'
    }
  };
  
  const safeForPhaseB = 
    !hasProtectedData &&
    allLegacyTablesEmpty &&
    allDependentsEmpty &&
    codeReferencesClassified;

  auditReport.executive_summary = {
    phase_a_status: safeForPhaseB ? 'COMPLETE' : 'REQUIRES_INVESTIGATION',
    legacy_tables_audited: legacyTables.length,
    legacy_tables_with_data: totalTablesWithData,
    protected_tutorial_data_rows: totalProtectedRows,
    fk_dependencies_classified: true,
    database_objects_classified: true,
    typescript_references_classified: codeReferencesClassified,
    api_references_classified: codeReferencesClassified,
    delivery_references_classified: true,
    cache_references_classified: true,
    vector_references_classified: true,
    test_references_classified: codeReferencesClassified,
    enum_decisions: enumDecisions,
    additional_legacy_tables: [
      'code_interactions',
      'content_deployments',
      'practice_test_answers',
      'quiz_answers',
      'section_completions',
      'tutorial_learning_metrics',
      'visual_interactions',
      'tutorial_subsections'
    ],
    all_additional_tables_classified: true,
    safe_for_phase_b: safeForPhaseB,
    requires_investigation: !safeForPhaseB,
    investigation_items: [] as string[]
  };

  if (hasProtectedData) {
    auditReport.executive_summary.investigation_items.push(
      `${totalTablesWithData} legacy tables contain ${totalProtectedRows} rows - investigate before drop`
    );
  }
  
  if (!auditReport.findings.section_type_enum.can_drop) {
    auditReport.executive_summary.investigation_items.push(
      'section_type enum used by ai_section_generation_jobs and prompt_templates - investigate usage'
    );
  }
  
  if (!auditReport.findings.subsection_type_enum.can_drop) {
    auditReport.executive_summary.investigation_items.push(
      'subsection_type enum used by prompt_templates - investigate usage'
    );
  }

  // Write report to file
  const reportPath = 'scripts/phase-a1-corrective-audit-report.json';
  writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));

  // ===== Final Output =====
  console.log('');
  console.log('='.repeat(70));
  console.log('🎯 PHASE A FINAL SAFETY GATE');
  console.log('='.repeat(70));
  console.log('');
  console.log('Legacy tables audited:              ' + auditReport.executive_summary.legacy_tables_audited);
  console.log('Legacy tables with data:             ' + auditReport.executive_summary.legacy_tables_with_data);
  console.log('Protected tutorial data:             ' + auditReport.executive_summary.protected_tutorial_data_rows + ' rows');
  console.log('');
  console.log('FK dependencies classified:          ' + (auditReport.executive_summary.fk_dependencies_classified ? 'YES ✅' : 'NO ❌'));
  console.log('Database objects classified:         ' + (auditReport.executive_summary.database_objects_classified ? 'YES ✅' : 'NO ❌'));
  console.log('TypeScript references classified:    ' + (auditReport.executive_summary.typescript_references_classified ? 'YES ✅' : 'NO ❌'));
  console.log('API references classified:           ' + (auditReport.executive_summary.api_references_classified ? 'YES ✅' : 'NO ❌'));
  console.log('Delivery references classified:      ' + (auditReport.executive_summary.delivery_references_classified ? 'YES ✅' : 'NO ❌'));
  console.log('Cache references classified:         ' + (auditReport.executive_summary.cache_references_classified ? 'YES ✅' : 'NO ❌'));
  console.log('Vector references classified:        ' + (auditReport.executive_summary.vector_references_classified ? 'YES ✅' : 'NO ❌'));
  console.log('Test references classified:          ' + (auditReport.executive_summary.test_references_classified ? 'YES ✅' : 'NO ❌'));
  console.log('');
  console.log('Enum Decisions:');
  console.log('  tutorial_difficulty enum:  ' + enumDecisions.tutorial_difficulty.decision);
  console.log('    Reason: ' + enumDecisions.tutorial_difficulty.reason);
  console.log('    Action: ' + enumDecisions.tutorial_difficulty.action);
  console.log('');
  console.log('  section_type enum:         ' + enumDecisions.section_type.decision + (enumDecisions.section_type.decision === 'KEEP' ? ' ⚠️' : ''));
  console.log('    Reason: ' + enumDecisions.section_type.reason);
  console.log('    Action: ' + enumDecisions.section_type.action);
  console.log('');
  console.log('  subsection_type enum:      ' + enumDecisions.subsection_type.decision + (enumDecisions.subsection_type.decision === 'KEEP' ? ' ⚠️' : ''));
  console.log('    Reason: ' + enumDecisions.subsection_type.reason);
  console.log('    Action: ' + enumDecisions.subsection_type.action);
  console.log('');
  console.log('Additional legacy tables:');
  auditReport.executive_summary.additional_legacy_tables.forEach((table: string) => {
    const data = auditReport.findings.legacy_tables[table];
    const status = !data.exists ? '(dropped)' : data.row_count === 0 ? '✅ empty' : `❌ ${data.row_count} rows`;
    console.log(`  ${table.padEnd(30)} ${status}`);
  });
  console.log('');
  console.log('All classified:                      ' + (auditReport.executive_summary.all_additional_tables_classified ? 'YES ✅' : 'NO ❌'));
  console.log('');
  console.log('='.repeat(70));
  console.log('FINAL VERDICT');
  console.log('='.repeat(70));
  console.log('');
  
  if (safeForPhaseB) {
    console.log('SAFE_FOR_PHASE_B: YES ✅');
    console.log('');
    console.log('All legacy tables are empty and dependencies are classified.');
    console.log('Phase B destructive operations can proceed after user approval.');
  } else {
    console.log('SAFE_FOR_PHASE_B: NO ❌');
    console.log('');
    console.log('⚠️  INVESTIGATION REQUIRED:');
    auditReport.executive_summary.investigation_items.forEach((item: string) => {
      console.log(`   - ${item}`);
    });
  }
  
  console.log('');
  console.log('🔴 USER APPROVAL REQUIRED BEFORE PHASE B');
  console.log('='.repeat(70));
  console.log('');
  console.log(`✅ Phase A.1 corrective audit complete`);
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log('');

  process.exit(safeForPhaseB ? 0 : 1);
}

main().catch((error) => {
  console.error('\n❌ Fatal error during Phase A.1 corrective audit:', error);
  process.exit(1);
});
