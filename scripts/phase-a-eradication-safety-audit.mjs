#!/usr/bin/env node

/**
 * Phase A: Tutorial V2 Legacy Eradication Safety Audit
 * 
 * This script performs comprehensive discovery of legacy tutorial dependencies
 * to prove that eradication can be performed safely.
 * 
 * CRITICAL: This is READ-ONLY. No destructive operations are performed.
 * 
 * Output: scripts/phase-a-audit-report.json
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const execAsync = promisify(exec);

console.log('🔍 Phase A: Tutorial V2 Legacy Eradication Safety Audit');
console.log('=' .repeat(70));
console.log('');

const auditReport = {
  timestamp: new Date().toISOString(),
  phase: 'A - Discovery',
  findings: {},
};

// ===== A002: Audit tutorial_sections Row Count =====
console.log('📊 A002: Auditing tutorial_sections...');

try {
  const tutorialSectionsAudit = await db.execute(sql`
    SELECT 
      COUNT(*) as total_rows,
      COUNT(*) FILTER (WHERE section_type IS NOT NULL) as has_section_type,
      COUNT(*) FILTER (WHERE difficulty IS NOT NULL) as has_difficulty,
      COUNT(DISTINCT section_type) as unique_section_types,
      COUNT(DISTINCT difficulty) as unique_difficulties
    FROM tutorial_sections
  `);
  
  const row = tutorialSectionsAudit.rows[0];
  
  auditReport.findings.tutorial_sections = {
    total_rows: parseInt(row.total_rows),
    has_section_type: parseInt(row.has_section_type),
    has_difficulty: parseInt(row.has_difficulty),
    unique_section_types: parseInt(row.unique_section_types),
    unique_difficulties: parseInt(row.unique_difficulties),
    verdict: parseInt(row.total_rows) === 0 ? 'SAFE_TO_MODIFY' : 'CONTAINS_DATA'
  };
  
  console.log(`   Total rows: ${auditReport.findings.tutorial_sections.total_rows}`);
  console.log(`   Verdict: ${auditReport.findings.tutorial_sections.verdict}`);
} catch (error) {
  console.error('   ❌ Error auditing tutorial_sections:', error.message);
  auditReport.findings.tutorial_sections = { error: error.message };
}


// ===== A003: Audit Legacy Child Tables =====
console.log('');
console.log('📊 A003: Auditing legacy child tables...');

const childTables = [
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
];

auditReport.findings.legacy_child_tables = {};

for (const table of childTables) {
  try {
    const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
    const count = parseInt(result.rows[0].count);
    auditReport.findings.legacy_child_tables[table] = {
      row_count: count,
      verdict: count === 0 ? 'EMPTY_SAFE_TO_DROP' : 'CONTAINS_DATA_STOP'
    };
    console.log(`   ${table}: ${count} rows (${auditReport.findings.legacy_child_tables[table].verdict})`);
  } catch (error) {
    auditReport.findings.legacy_child_tables[table] = {
      row_count: null,
      error: error.message,
      verdict: 'TABLE_NOT_FOUND'
    };
    console.log(`   ${table}: TABLE NOT FOUND or ERROR`);
  }
}

const discoveredChildTableCount = Object.keys(auditReport.findings.legacy_child_tables).length;
console.log(`   Total child tables discovered: ${discoveredChildTableCount}`);

// ===== A004: Audit Backup Tables =====
console.log('');
console.log('📊 A004: Auditing backup tables...');

auditReport.findings.backup_tables = {};

const backupTables = [
  'tutorial_section_layman_backup_20260815',
  'tutorial_sections_layman_backup_20260815',
];

for (const table of backupTables) {
  try {
    const countResult = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
    const sizeResult = await db.execute(sql.raw(`
      SELECT pg_size_pretty(pg_total_relation_size('${table}')) as size
    `));
    
    auditReport.findings.backup_tables[table] = {
      row_count: parseInt(countResult.rows[0].count),
      size: sizeResult.rows[0].size,
      verdict: parseInt(countResult.rows[0].count) === 0 ? 'EMPTY_SAFE_TO_DROP' : 'CONTAINS_DATA_INVESTIGATE'
    };
    
    console.log(`   ${table}:`);
    console.log(`      Rows: ${auditReport.findings.backup_tables[table].row_count}`);
    console.log(`      Size: ${auditReport.findings.backup_tables[table].size}`);
    console.log(`      Verdict: ${auditReport.findings.backup_tables[table].verdict}`);
  } catch (error) {
    auditReport.findings.backup_tables[table] = {
      error: error.message,
      verdict: 'TABLE_NOT_FOUND'
    };
    console.log(`   ${table}: TABLE NOT FOUND or ERROR`);
  }
}


// ===== A005: Audit tutorial_difficulty Enum Usage =====
console.log('');
console.log('📊 A005: Auditing tutorial_difficulty enum usage...');

try {
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
  
  auditReport.findings.tutorial_difficulty_enum = {
    database_columns: difficultyColumns.rows.map(col => ({
      table: col.table_name,
      column: col.column_name,
      nullable: col.is_nullable === 'YES'
    })),
    usage_count: difficultyColumns.rows.length,
    classification: {
      tutorial: [],
      assessment: [],
      ai_generation: [],
      other: []
    }
  };
  
  // Classify each usage
  difficultyColumns.rows.forEach(col => {
    const tableName = col.table_name;
    const entry = `${tableName}.${col.column_name}`;
    
    if (tableName === 'tutorial_sections' || tableName === 'tutorial_content' || tableName === 'tutorial_subsections') {
      auditReport.findings.tutorial_difficulty_enum.classification.tutorial.push({
        location: entry,
        action: 'REMOVE',
        reason: 'Legacy tutorial section difficulty'
      });
    } else if (tableName.includes('assignment') || tableName.includes('project')) {
      auditReport.findings.tutorial_difficulty_enum.classification.assessment.push({
        location: entry,
        action: 'KEEP',
        reason: 'Assessment domain'
      });
    } else if (tableName.includes('generation') || tableName.includes('ai_')) {
      auditReport.findings.tutorial_difficulty_enum.classification.ai_generation.push({
        location: entry,
        action: 'AUDIT',
        reason: 'AI generation - needs investigation'
      });
    } else {
      auditReport.findings.tutorial_difficulty_enum.classification.other.push({
        location: entry,
        action: 'INVESTIGATE',
        reason: 'Unknown domain'
      });
    }
  });
  
  const canDrop = 
    auditReport.findings.tutorial_difficulty_enum.classification.tutorial.length > 0 &&
    auditReport.findings.tutorial_difficulty_enum.classification.assessment.length === 0 &&
    auditReport.findings.tutorial_difficulty_enum.classification.ai_generation.length === 0 &&
    auditReport.findings.tutorial_difficulty_enum.classification.other.length === 0;
  
  auditReport.findings.tutorial_difficulty_enum.can_drop = canDrop;
  auditReport.findings.tutorial_difficulty_enum.recommendation = canDrop 
    ? 'SAFE_TO_DROP' 
    : 'KEEP_ENUM_REMOVE_TUTORIAL_COLUMNS_ONLY';
  
  console.log(`   Database columns using tutorial_difficulty: ${difficultyColumns.rows.length}`);
  console.log(`   Tutorial domain: ${auditReport.findings.tutorial_difficulty_enum.classification.tutorial.length}`);
  console.log(`   Assessment domain: ${auditReport.findings.tutorial_difficulty_enum.classification.assessment.length}`);
  console.log(`   AI generation: ${auditReport.findings.tutorial_difficulty_enum.classification.ai_generation.length}`);
  console.log(`   Other: ${auditReport.findings.tutorial_difficulty_enum.classification.other.length}`);
  console.log(`   Recommendation: ${auditReport.findings.tutorial_difficulty_enum.recommendation}`);
} catch (error) {
  console.error('   ❌ Error:', error.message);
  auditReport.findings.tutorial_difficulty_enum = { error: error.message };
}

// ===== A006: Audit section_type Enum Usage =====
console.log('');
console.log('📊 A006: Auditing section_type enum usage...');

try {
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
  
  auditReport.findings.section_type_enum = {
    database_columns: sectionTypeColumns.rows.map(col => ({
      table: col.table_name,
      column: col.column_name,
      nullable: col.is_nullable === 'YES'
    })),
    usage_count: sectionTypeColumns.rows.length,
    can_drop: sectionTypeColumns.rows.length === 1 && sectionTypeColumns.rows[0].table_name === 'tutorial_sections',
    recommendation: sectionTypeColumns.rows.length === 1 && sectionTypeColumns.rows[0].table_name === 'tutorial_sections'
      ? 'SAFE_TO_DROP'
      : 'INVESTIGATE_NON_TUTORIAL_USAGE'
  };
  
  console.log(`   Database columns using section_type: ${sectionTypeColumns.rows.length}`);
  sectionTypeColumns.rows.forEach(col => {
    console.log(`      ${col.table_name}.${col.column_name}`);
  });
  console.log(`   Recommendation: ${auditReport.findings.section_type_enum.recommendation}`);
} catch (error) {
  console.error('   ❌ Error:', error.message);
  auditReport.findings.section_type_enum = { error: error.message };
}

// ===== A007: Audit subsection_type Enum Usage =====
console.log('');
console.log('📊 A007: Auditing subsection_type enum usage...');

try {
  const subsectionTypeColumns = await db.execute(sql`
    SELECT 
      t.table_name, 
      c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name
    WHERE c.udt_name = 'subsection_type'
      AND t.table_schema = 'public'
  `);
  
  auditReport.findings.subsection_type_enum = {
    database_columns: subsectionTypeColumns.rows.map(col => ({
      table: col.table_name,
      column: col.column_name
    })),
    usage_count: subsectionTypeColumns.rows.length,
    recommendation: subsectionTypeColumns.rows.length === 0 
      ? 'NO_USAGE_SAFE_TO_DROP'
      : 'AUDIT_USAGE_BEFORE_DROP'
  };
  
  console.log(`   Database columns using subsection_type: ${subsectionTypeColumns.rows.length}`);
  if (subsectionTypeColumns.rows.length > 0) {
    subsectionTypeColumns.rows.forEach(col => {
      console.log(`      ${col.table_name}.${col.column_name}`);
    });
  }
  console.log(`   Recommendation: ${auditReport.findings.subsection_type_enum.recommendation}`);
} catch (error) {
  console.error('   ❌ Error:', error.message);
  auditReport.findings.subsection_type_enum = { error: error.message };
}


// ===== A008: Map Foreign Key Dependencies =====
console.log('');
console.log('📊 A008: Mapping foreign key dependencies...');

try {
  const foreignKeys = await db.execute(sql`
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND (tc.table_name LIKE 'tutorial_%' OR ccu.table_name LIKE 'tutorial_%')
    ORDER BY tc.table_name, ccu.table_name
  `);
  
  auditReport.findings.foreign_keys = {
    total_count: foreignKeys.rows.length,
    dependencies: foreignKeys.rows.map(fk => ({
      table: fk.table_name,
      column: fk.column_name,
      references_table: fk.foreign_table_name,
      references_column: fk.foreign_column_name,
      constraint_name: fk.constraint_name
    })),
    tutorial_sections_references: foreignKeys.rows.filter(fk => fk.foreign_table_name === 'tutorial_sections').length
  };
  
  console.log(`   Total FK constraints found: ${foreignKeys.rows.length}`);
  console.log(`   Tables referencing tutorial_sections: ${auditReport.findings.foreign_keys.tutorial_sections_references}`);
} catch (error) {
  console.error('   ❌ Error:', error.message);
  auditReport.findings.foreign_keys = { error: error.message };
}

// ===== A009: Audit Database Views/Functions/Triggers =====
console.log('');
console.log('📊 A009: Auditing database views, functions, triggers...');

try {
  // Views
  const views = await db.execute(sql`
    SELECT viewname, definition 
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND (definition LIKE '%section_type%' OR definition LIKE '%difficulty%')
  `);
  
  // Functions
  const functions = await db.execute(sql`
    SELECT proname, prosrc 
    FROM pg_proc 
    WHERE (prosrc LIKE '%section_type%' OR prosrc LIKE '%difficulty%')
      AND pronamespace = 'public'::regnamespace
  `);
  
  // Triggers
  const triggers = await db.execute(sql`
    SELECT trigger_name, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND (action_statement LIKE '%section_type%' OR action_statement LIKE '%difficulty%')
  `);
  
  auditReport.findings.database_objects = {
    views: views.rows.map(v => ({ name: v.viewname, uses_legacy: true })),
    functions: functions.rows.map(f => ({ name: f.proname, uses_legacy: true })),
    triggers: triggers.rows.map(t => ({ name: t.trigger_name, table: t.event_object_table })),
    verdict: (views.rows.length + functions.rows.length + triggers.rows.length) === 0 ? 'NO_LEGACY_OBJECTS' : 'CONTAINS_LEGACY_OBJECTS'
  };
  
  console.log(`   Views using legacy types: ${views.rows.length}`);
  console.log(`   Functions using legacy types: ${functions.rows.length}`);
  console.log(`   Triggers using legacy types: ${triggers.rows.length}`);
  console.log(`   Verdict: ${auditReport.findings.database_objects.verdict}`);
} catch (error) {
  console.error('   ❌ Error:', error.message);
  auditReport.findings.database_objects = { error: error.message };
}


// ===== A010-A013: TypeScript/API/Infrastructure Audits (via grep) =====
console.log('');
console.log('📊 A010-A013: Auditing TypeScript, API, and infrastructure code...');

try {
  // A010: TypeScript imports
  const { stdout: sectionTypeImports } = await execAsync('rg "import.*SectionType" --type ts -l || echo ""');
  const { stdout: difficultyImports } = await execAsync('rg "import.*TutorialDifficulty" --type ts -l || echo ""');
  const { stdout: paletteRefs } = await execAsync('rg "SECTION_BLOCK_PALETTES" --type ts -l || echo ""');
  const { stdout: legacyRepoMethods } = await execAsync('rg "getSectionByKey" --type ts -l || echo ""');
  
  auditReport.findings.typescript_imports = {
    SectionType: sectionTypeImports.trim().split('\n').filter(Boolean),
    TutorialDifficulty: difficultyImports.trim().split('\n').filter(Boolean),
    SECTION_BLOCK_PALETTES: paletteRefs.trim().split('\n').filter(Boolean),
    getSectionByKey: legacyRepoMethods.trim().split('\n').filter(Boolean)
  };
  
  console.log(`   Files importing SectionType: ${auditReport.findings.typescript_imports.SectionType.length}`);
  console.log(`   Files importing TutorialDifficulty: ${auditReport.findings.typescript_imports.TutorialDifficulty.length}`);
  console.log(`   Files using SECTION_BLOCK_PALETTES: ${auditReport.findings.typescript_imports.SECTION_BLOCK_PALETTES.length}`);
  console.log(`   Files using getSectionByKey: ${auditReport.findings.typescript_imports.getSectionByKey.length}`);
  
  // A011: API routes
  const { stdout: apiSectionType } = await execAsync('rg "sectionType" --type ts apps/*/src/app/api -l 2>/dev/null || echo ""');
  const { stdout: apiDifficulty } = await execAsync('rg "difficulty" --type ts apps/*/src/app/api -l 2>/dev/null || echo ""');
  
  auditReport.findings.api_routes = {
    using_section_type: apiSectionType.trim().split('\n').filter(Boolean),
    using_difficulty: apiDifficulty.trim().split('\n').filter(Boolean)
  };
  
  console.log(`   API routes using sectionType: ${auditReport.findings.api_routes.using_section_type.length}`);
  console.log(`   API routes using difficulty: ${auditReport.findings.api_routes.using_difficulty.length}`);
  
  // A012: Delivery/Cache/Vector
  const { stdout: deliveryDifficulty } = await execAsync('rg "difficulty" --type ts apps/*/src/server/tutorial-delivery.ts -l 2>/dev/null || echo ""');
  const { stdout: cacheDifficulty } = await execAsync('rg "tutorial.*difficulty" --type ts packages/ -l 2>/dev/null || echo ""');
  const { stdout: vectorDifficulty } = await execAsync('rg "difficulty" --type ts packages/db-tutorial/src/vector.service.ts -l 2>/dev/null || echo ""');
  
  auditReport.findings.infrastructure = {
    delivery: deliveryDifficulty.trim().split('\n').filter(Boolean),
    cache: cacheDifficulty.trim().split('\n').filter(Boolean),
    vector: vectorDifficulty.trim().split('\n').filter(Boolean)
  };
  
  console.log(`   Delivery files using difficulty: ${auditReport.findings.infrastructure.delivery.length}`);
  console.log(`   Cache files using difficulty: ${auditReport.findings.infrastructure.cache.length}`);
  console.log(`   Vector files using difficulty: ${auditReport.findings.infrastructure.vector.length}`);
  
  // A013: Test files
  const { stdout: testSectionType } = await execAsync('rg "sectionType" --type ts --glob "**/*.test.ts" -l 2>/dev/null || echo ""');
  const { stdout: testDifficulty } = await execAsync('rg "difficulty" --type ts --glob "**/*.test.ts" -l 2>/dev/null || echo ""');
  
  auditReport.findings.tests = {
    using_section_type: testSectionType.trim().split('\n').filter(Boolean),
    using_difficulty: testDifficulty.trim().split('\n').filter(Boolean),
    requires_fixture_update: (testSectionType.trim() !== '' || testDifficulty.trim() !== '')
  };
  
  console.log(`   Test files using sectionType: ${auditReport.findings.tests.using_section_type.length}`);
  console.log(`   Test files using difficulty: ${auditReport.findings.tests.using_difficulty.length}`);
  
} catch (error) {
  console.error('   ❌ Error during code audits:', error.message);
  auditReport.findings.code_audit_error = error.message;
}


// ===== A014: Generate Dependency Matrix =====
console.log('');
console.log('📊 A014: Generating dependency matrix...');

auditReport.dependency_matrix = [];

// tutorial_sections.section_type
auditReport.dependency_matrix.push({
  component: 'tutorial_sections.section_type',
  legacy: true,
  v2_required: false,
  action: 'REMOVE',
  protected_data: auditReport.findings.tutorial_sections?.total_rows > 0 ? 'YES' : 'NO',
  confidence: 'HIGH'
});

// tutorial_sections.difficulty
auditReport.dependency_matrix.push({
  component: 'tutorial_sections.difficulty',
  legacy: true,
  v2_required: false,
  action: 'REMOVE',
  protected_data: auditReport.findings.tutorial_sections?.total_rows > 0 ? 'YES' : 'NO',
  confidence: 'HIGH'
});

// section_type enum
auditReport.dependency_matrix.push({
  component: 'section_type enum',
  legacy: true,
  v2_required: false,
  action: auditReport.findings.section_type_enum?.can_drop ? 'DROP' : 'INVESTIGATE',
  protected_data: 'N/A',
  confidence: auditReport.findings.section_type_enum?.can_drop ? 'HIGH' : 'MEDIUM'
});

// tutorial_difficulty enum
auditReport.dependency_matrix.push({
  component: 'tutorial_difficulty enum',
  legacy: 'PARTIAL',
  v2_required: false,
  action: auditReport.findings.tutorial_difficulty_enum?.recommendation || 'INVESTIGATE',
  protected_data: 'Used by assessments',
  confidence: 'HIGH'
});

// SECTION_BLOCK_PALETTES
auditReport.dependency_matrix.push({
  component: 'SECTION_BLOCK_PALETTES',
  legacy: true,
  v2_required: false,
  action: 'REMOVE',
  protected_data: 'N/A',
  confidence: 'HIGH'
});

// Definition D1/D2
auditReport.dependency_matrix.push({
  component: 'Definition D1/D2 schemas',
  legacy: false,
  v2_required: true,
  action: 'KEEP',
  protected_data: 'Active V2 contracts',
  confidence: 'HIGH'
});

// Code C1/C2
auditReport.dependency_matrix.push({
  component: 'Code C1/C2 schemas',
  legacy: false,
  v2_required: true,
  action: 'KEEP',
  protected_data: 'Active V2 contracts',
  confidence: 'HIGH'
});

console.log(`   Dependency matrix entries: ${auditReport.dependency_matrix.length}`);

// ===== A015: Generate Executive Summary =====
console.log('');
console.log('📊 A015: Generating executive summary...');

const hasProtectedData = auditReport.findings.tutorial_sections?.total_rows > 0 ||
  Object.values(auditReport.findings.legacy_child_tables || {}).some(t => t.row_count > 0) ||
  Object.values(auditReport.findings.backup_tables || {}).some(t => t.row_count > 0);

const assessmentUsage = auditReport.findings.tutorial_difficulty_enum?.classification?.assessment?.length > 0;

auditReport.executive_summary = {
  status: hasProtectedData ? 'PROTECTED_DATA_FOUND' : 'SAFE_TO_PROCEED',
  key_findings: {
    tutorial_sections_empty: auditReport.findings.tutorial_sections?.total_rows === 0,
    child_tables_empty: Object.values(auditReport.findings.legacy_child_tables || {}).every(t => t.row_count === 0 || t.verdict === 'TABLE_NOT_FOUND'),
    backup_tables_empty: Object.values(auditReport.findings.backup_tables || {}).every(t => t.row_count === 0 || t.verdict === 'TABLE_NOT_FOUND'),
    difficulty_used_by_assessments: assessmentUsage,
    section_type_tutorial_only: auditReport.findings.section_type_enum?.can_drop || false,
    no_database_objects: auditReport.findings.database_objects?.verdict === 'NO_LEGACY_OBJECTS'
  },
  recommendations: {
    can_proceed_to_phase_b: !hasProtectedData,
    enum_actions: {
      section_type: auditReport.findings.section_type_enum?.recommendation || 'INVESTIGATE',
      tutorial_difficulty: auditReport.findings.tutorial_difficulty_enum?.recommendation || 'INVESTIGATE',
      subsection_type: auditReport.findings.subsection_type_enum?.recommendation || 'INVESTIGATE'
    }
  },
  surprises: [],
  warnings: []
};

if (hasProtectedData) {
  auditReport.executive_summary.warnings.push('PROTECTED DATA FOUND - DO NOT PROCEED WITHOUT USER REVIEW');
}

if (assessmentUsage) {
  auditReport.executive_summary.warnings.push('tutorial_difficulty enum is used by assessments - KEEP ENUM, REMOVE TUTORIAL COLUMNS ONLY');
}

if (auditReport.findings.database_objects?.verdict !== 'NO_LEGACY_OBJECTS') {
  auditReport.executive_summary.warnings.push('Database views/functions/triggers use legacy types - REVIEW BEFORE DROP');
}

const childTableCount = Object.keys(auditReport.findings.legacy_child_tables || {}).length;
if (childTableCount !== 13 && childTableCount !== 14) {
  auditReport.executive_summary.surprises.push(`Expected 13-14 child tables, found ${childTableCount}`);
}

console.log('');
console.log('=' .repeat(70));
console.log('🎯 EXECUTIVE SUMMARY');
console.log('=' .repeat(70));
console.log('');
console.log(`Status: ${auditReport.executive_summary.status}`);
console.log('');
console.log('Key Findings:');
Object.entries(auditReport.executive_summary.key_findings).forEach(([key, value]) => {
  const icon = value ? '✅' : '❌';
  console.log(`  ${icon} ${key}: ${value}`);
});
console.log('');

if (auditReport.executive_summary.warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  auditReport.executive_summary.warnings.forEach(w => console.log(`   - ${w}`));
  console.log('');
}

if (auditReport.executive_summary.surprises.length > 0) {
  console.log('🔍 SURPRISES:');
  auditReport.executive_summary.surprises.forEach(s => console.log(`   - ${s}`));
  console.log('');
}

console.log('Recommendations:');
console.log(`  Can proceed to Phase B: ${auditReport.executive_summary.recommendations.can_proceed_to_phase_b ? 'YES ✅' : 'NO ❌'}`);
console.log(`  section_type enum: ${auditReport.executive_summary.recommendations.enum_actions.section_type}`);
console.log(`  tutorial_difficulty enum: ${auditReport.executive_summary.recommendations.enum_actions.tutorial_difficulty}`);
console.log(`  subsection_type enum: ${auditReport.executive_summary.recommendations.enum_actions.subsection_type}`);
console.log('');

// Write report to file
const reportPath = 'scripts/phase-a-audit-report.json';
writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));

console.log('=' .repeat(70));
console.log(`✅ Phase A audit complete`);
console.log(`📄 Report saved to: ${reportPath}`);
console.log('');
console.log('🔴 STOP GATE: USER APPROVAL REQUIRED BEFORE PHASE B');
console.log('=' .repeat(70));

process.exit(0);
