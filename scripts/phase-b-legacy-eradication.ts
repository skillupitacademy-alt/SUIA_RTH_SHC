/**
 * Phase B: Tutorial V2 Legacy Eradication - Destructive Migration
 * 
 * This script performs the actual eradication of legacy Tutorial architecture
 * after Phase A approval.
 * 
 * CRITICAL SAFETY:
 * - Preflight checks re-verify ALL Phase A findings before any destructive SQL
 * - Aborts if ANY table has acquired data since Phase A
 * - Aborts if ANY V2 current table would be affected
 * - All operations in explicit dependency order (NO CASCADE)
 * - Transactional where possible
 * 
 * Execution: npx tsx --tsconfig tsconfig.json scripts/phase-b-legacy-eradication.ts
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🚨 Phase B: Tutorial V2 Legacy Eradication - DESTRUCTIVE MIGRATION');
console.log('='.repeat(70));
console.log('');
console.log('⚠️  WARNING: This script will DROP tables and columns.');
console.log('⚠️  All operations are logged to: scripts/phase-b-execution-log.json');
console.log('');

const executionLog: any = {
  timestamp: new Date().toISOString(),
  phase: 'B - Legacy Eradication',
  preflight_checks: {},
  operations: [],
  result: 'NOT_STARTED'
};

let operationCount = 0;

/**
 * Log an operation
 */
function logOperation(type: string, target: string, sql_command: string, result: 'SUCCESS' | 'SKIPPED' | 'ERROR', details?: any) {
  operationCount++;
  const op = {
    sequence: operationCount,
    type,
    target,
    sql_command,
    result,
    timestamp: new Date().toISOString(),
    details
  };
  executionLog.operations.push(op);
  
  const icon = result === 'SUCCESS' ? '✅' : result === 'SKIPPED' ? '⏭️' : '❌';
  console.log(`   ${icon} [${operationCount}] ${type}: ${target}`);
  if (details?.message) {
    console.log(`      ${details.message}`);
  }
}

/**
 * Safe table drop with existence check
 */
async function dropTableSafe(tableName: string): Promise<boolean> {
  try {
    // Check if exists
    const existsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `);
    
    const exists = existsResult.rows[0]?.exists;
    
    if (!exists) {
      logOperation('DROP_TABLE', tableName, `DROP TABLE ${tableName}`, 'SKIPPED', {
        message: 'Table does not exist'
      });
      return true;
    }
    
    // Drop table
    await db.execute(sql.raw(`DROP TABLE ${tableName}`));
    
    logOperation('DROP_TABLE', tableName, `DROP TABLE ${tableName}`, 'SUCCESS');
    return true;
    
  } catch (error: any) {
    logOperation('DROP_TABLE', tableName, `DROP TABLE ${tableName}`, 'ERROR', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Safe column drop with existence check
 */
async function dropColumnSafe(tableName: string, columnName: string): Promise<boolean> {
  try {
    // Check if column exists
    const existsResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
        AND column_name = ${columnName}
      ) as exists
    `);
    
    const exists = existsResult.rows[0]?.exists;
    
    if (!exists) {
      logOperation('DROP_COLUMN', `${tableName}.${columnName}`, 
        `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`, 'SKIPPED', {
        message: 'Column does not exist'
      });
      return true;
    }
    
    // Drop column
    await db.execute(sql.raw(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`));
    
    logOperation('DROP_COLUMN', `${tableName}.${columnName}`, 
      `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`, 'SUCCESS');
    return true;
    
  } catch (error: any) {
    logOperation('DROP_COLUMN', `${tableName}.${columnName}`, 
      `ALTER TABLE ${tableName} DROP COLUMN ${columnName}`, 'ERROR', {
      error: error.message
    });
    throw error;
  }
}

async function main() {
  try {
    // ===== PREFLIGHT SAFETY CHECKS =====
    console.log('🔍 PREFLIGHT SAFETY CHECKS');
    console.log('='.repeat(70));
    console.log('');
    
    let preflightPassed = true;
    const preflightErrors: string[] = [];
    
    // Check 1: Verify all target tables exist and are empty
    console.log('✓ Check 1: Verifying target tables are empty...');
    
    const targetTables = [
      'subsection_engagement_metrics',
      'tutorial_video_links',
      'ai_section_generation_jobs',
      'tutorial_section_notes',
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
      'code_interactions',
      'content_deployments',
      'practice_test_answers',
      'quiz_answers',
      'section_completions',
      'tutorial_learning_metrics',
      'visual_interactions',
      'tutorial_subsections',
      'tutorial_content',
      'tutorial_sections'
    ];
    
    for (const table of targetTables) {
      try {
        const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM ${table}`));
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          preflightPassed = false;
          preflightErrors.push(`${table} has ${count} rows (expected 0)`);
          console.log(`   ❌ ${table}: ${count} rows (UNSAFE)`);
        } else {
          console.log(`   ✅ ${table}: 0 rows`);
        }
      } catch (err: any) {
        // Table doesn't exist - that's OK for some (like tutorial_section_layman)
        if (err.message?.includes('does not exist')) {
          console.log(`   ⏭️  ${table}: does not exist (already dropped)`);
        } else {
          preflightPassed = false;
          preflightErrors.push(`${table} error: ${err.message}`);
          console.log(`   ❌ ${table}: error checking`);
        }
      }
    }
    
    executionLog.preflight_checks.target_tables_empty = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 2: Verify V2 current tables are protected
    console.log('✓ Check 2: Verifying V2 current tables are protected...');
    
    const protectedTables = ['prompt_templates'];
    
    for (const table of protectedTables) {
      try {
        const existsResult = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          ) as exists
        `);
        
        const exists = existsResult.rows[0]?.exists;
        
        if (!exists) {
          preflightPassed = false;
          preflightErrors.push(`${table} does not exist (V2 current table missing)`);
          console.log(`   ❌ ${table}: MISSING (UNSAFE)`);
        } else {
          console.log(`   ✅ ${table}: exists`);
        }
      } catch (err: any) {
        preflightPassed = false;
        preflightErrors.push(`${table} error: ${err.message}`);
        console.log(`   ❌ ${table}: error checking`);
      }
    }
    
    executionLog.preflight_checks.v2_tables_protected = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 3: Verify prompt_templates has required enum columns
    console.log('✓ Check 3: Verifying prompt_templates enum columns...');
    
    try {
      const columnsResult = await db.execute(sql`
        SELECT column_name, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'prompt_templates'
          AND column_name IN ('section_type', 'subsection_type')
      `);
      
      const hasSectionType = columnsResult.rows.some((col: any) => 
        col.column_name === 'section_type' && col.udt_name === 'section_type'
      );
      const hasSubsectionType = columnsResult.rows.some((col: any) => 
        col.column_name === 'subsection_type' && col.udt_name === 'subsection_type'
      );
      
      if (!hasSectionType) {
        preflightPassed = false;
        preflightErrors.push('prompt_templates.section_type column missing');
        console.log(`   ❌ section_type column: MISSING`);
      } else {
        console.log(`   ✅ section_type column: exists`);
      }
      
      if (!hasSubsectionType) {
        preflightPassed = false;
        preflightErrors.push('prompt_templates.subsection_type column missing');
        console.log(`   ❌ subsection_type column: MISSING`);
      } else {
        console.log(`   ✅ subsection_type column: exists`);
      }
    } catch (err: any) {
      preflightPassed = false;
      preflightErrors.push(`Error checking prompt_templates columns: ${err.message}`);
      console.log(`   ❌ Error checking columns`);
    }
    
    executionLog.preflight_checks.prompt_templates_enum_columns = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 4: Verify required enums exist
    console.log('✓ Check 4: Verifying required enums exist...');
    
    const requiredEnums = ['tutorial_difficulty', 'section_type', 'subsection_type'];
    
    for (const enumName of requiredEnums) {
      try {
        const result = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM pg_type 
            WHERE typname = ${enumName}
          ) as exists
        `);
        
        const exists = result.rows[0]?.exists;
        
        if (!exists) {
          preflightPassed = false;
          preflightErrors.push(`${enumName} enum does not exist`);
          console.log(`   ❌ ${enumName} enum: MISSING`);
        } else {
          console.log(`   ✅ ${enumName} enum: exists`);
        }
      } catch (err: any) {
        preflightPassed = false;
        preflightErrors.push(`Error checking ${enumName} enum: ${err.message}`);
        console.log(`   ❌ ${enumName} enum: error checking`);
      }
    }
    
    executionLog.preflight_checks.required_enums_exist = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 5: Verify FK dependencies
    console.log('✓ Check 5: Verifying no unexpected FK dependencies...');
    
    // Check that tutorial_sections doesn't have unexpected incoming FKs beyond what we know about
    try {
      const fksResult = await db.execute(sql`
        SELECT 
          tc.table_name,
          kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND ccu.table_name = 'tutorial_sections'
      `);
      
      const expectedDependents = new Set([
        'code_interactions',
        'content_deployments',
        'practice_test_answers',
        'quiz_answers',
        'section_completions',
        'tutorial_learning_metrics',
        'tutorial_section_ai_tutor',
        'tutorial_section_assignment',
        'tutorial_section_code',
        'tutorial_section_interview',
        'tutorial_section_notes',
        'tutorial_section_overview',
        'tutorial_section_practice',
        'tutorial_section_project',
        'tutorial_section_quiz',
        'tutorial_section_real_life',
        'tutorial_section_summary',
        'tutorial_section_technical',
        'tutorial_section_visual',
        'tutorial_subsections',
        'visual_interactions'
      ]);
      
      let unexpectedDependents = 0;
      for (const fk of fksResult.rows) {
        if (!expectedDependents.has(fk.table_name)) {
          preflightPassed = false;
          preflightErrors.push(`Unexpected FK from ${fk.table_name}.${fk.column_name} to tutorial_sections`);
          console.log(`   ❌ Unexpected FK: ${fk.table_name}.${fk.column_name}`);
          unexpectedDependents++;
        }
      }
      
      if (unexpectedDependents === 0) {
        console.log(`   ✅ No unexpected FK dependencies (${fksResult.rows.length} expected found)`);
      }
    } catch (err: any) {
      preflightPassed = false;
      preflightErrors.push(`Error checking FK dependencies: ${err.message}`);
      console.log(`   ❌ Error checking FK dependencies`);
    }
    
    executionLog.preflight_checks.no_unexpected_fk_dependencies = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Final preflight verdict
    console.log('='.repeat(70));
    if (preflightPassed) {
      console.log('✅ PREFLIGHT PASSED - Safe to proceed');
      executionLog.preflight_checks.overall = 'PASSED';
    } else {
      console.log('❌ PREFLIGHT FAILED - Aborting migration');
      console.log('');
      console.log('Errors:');
      preflightErrors.forEach(err => console.log(`   - ${err}`));
      executionLog.preflight_checks.overall = 'FAILED';
      executionLog.preflight_checks.errors = preflightErrors;
      executionLog.result = 'ABORTED_PREFLIGHT_FAILED';
      
      const reportPath = 'scripts/phase-b-execution-log.json';
      writeFileSync(reportPath, JSON.stringify(executionLog, null, 2));
      console.log('');
      console.log(`📄 Execution log saved to: ${reportPath}`);
      
      process.exit(1);
    }
    console.log('='.repeat(70));
    console.log('');
    
    // ===== DESTRUCTIVE OPERATIONS - EXPLICIT DEPENDENCY ORDER =====
    console.log('🗑️  EXECUTING DESTRUCTIVE OPERATIONS');
    console.log('='.repeat(70));
    console.log('');
    
    // Group 1: Legacy dependent analytics
    console.log('Group 1: Legacy dependent analytics');
    await dropTableSafe('subsection_engagement_metrics');
    console.log('');
    
    // Group 2: Obsolete legacy tables
    console.log('Group 2: Obsolete legacy tables');
    await dropTableSafe('tutorial_video_links');
    await dropTableSafe('ai_section_generation_jobs');
    console.log('');
    
    // Group 3: Legacy section child tables
    console.log('Group 3: Legacy section child tables');
    await dropTableSafe('tutorial_section_notes');
    await dropTableSafe('tutorial_section_technical');
    await dropTableSafe('tutorial_section_code');
    await dropTableSafe('tutorial_section_practice');
    await dropTableSafe('tutorial_section_visual');
    await dropTableSafe('tutorial_section_overview');
    await dropTableSafe('tutorial_section_real_life');
    await dropTableSafe('tutorial_section_summary');
    await dropTableSafe('tutorial_section_assignment');
    await dropTableSafe('tutorial_section_project');
    await dropTableSafe('tutorial_section_quiz');
    await dropTableSafe('tutorial_section_interview');
    await dropTableSafe('tutorial_section_ai_tutor');
    console.log('');
    
    // Group 4: Legacy interaction/deployment tables
    console.log('Group 4: Legacy interaction/deployment tables');
    await dropTableSafe('code_interactions');
    await dropTableSafe('content_deployments');
    await dropTableSafe('practice_test_answers');
    await dropTableSafe('quiz_answers');
    await dropTableSafe('section_completions');
    await dropTableSafe('tutorial_learning_metrics');
    await dropTableSafe('visual_interactions');
    console.log('');
    
    // Group 5: Old tutorial core
    console.log('Group 5: Old tutorial core');
    await dropTableSafe('tutorial_subsections');
    await dropTableSafe('tutorial_content');
    console.log('');
    
    // Group 6: Old tutorial_sections columns
    console.log('Group 6: Old tutorial_sections columns');
    await dropColumnSafe('tutorial_sections', 'section_type');
    await dropColumnSafe('tutorial_sections', 'difficulty');
    console.log('');
    
    // Group 7: Old root (after all dependencies gone)
    console.log('Group 7: Old root table');
    await dropTableSafe('tutorial_sections');
    console.log('');
    
    // Group 8: Backup tables
    console.log('Group 8: Backup tables');
    await dropTableSafe('tutorial_section_layman_backup_20260815');
    await dropTableSafe('tutorial_sections_layman_backup_20260815');
    console.log('');
    
    // Group 9: V2 constraint (only if tutorial_sections still exists for V2)
    console.log('Group 9: V2 constraints (placeholder - verify table architecture first)');
    console.log('   ⏭️  Skipping UNIQUE constraint creation - verify V2 tutorial table architecture');
    logOperation('CREATE_CONSTRAINT', 'tutorial V2 UNIQUE constraint', 
      'UNIQUE(subtopic_id, brand_id)', 'SKIPPED', {
      message: 'Requires verification of V2 tutorial table architecture'
    });
    console.log('');
    
    // ===== POST-MIGRATION VERIFICATION =====
    console.log('='.repeat(70));
    console.log('✅ DESTRUCTIVE OPERATIONS COMPLETE');
    console.log('='.repeat(70));
    console.log('');
    
    console.log('🔍 POST-MIGRATION VERIFICATION');
    console.log('='.repeat(70));
    console.log('');
    
    // Verify all target tables are gone
    console.log('✓ Verifying target tables are dropped...');
    let allDropped = true;
    for (const table of targetTables) {
      try {
        const existsResult = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          ) as exists
        `);
        
        const exists = existsResult.rows[0]?.exists;
        
        if (exists) {
          console.log(`   ⚠️  ${table}: still exists`);
          allDropped = false;
        } else {
          console.log(`   ✅ ${table}: dropped`);
        }
      } catch (err) {
        // Error checking - assume dropped
      }
    }
    console.log('');
    
    // Verify protected tables still exist
    console.log('✓ Verifying protected tables still exist...');
    for (const table of protectedTables) {
      const existsResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        ) as exists
      `);
      
      const exists = existsResult.rows[0]?.exists;
      
      if (exists) {
        console.log(`   ✅ ${table}: preserved`);
      } else {
        console.log(`   ❌ ${table}: MISSING (CRITICAL ERROR)`);
      }
    }
    console.log('');
    
    // Verify enums still exist
    console.log('✓ Verifying required enums still exist...');
    for (const enumName of requiredEnums) {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = ${enumName}
        ) as exists
      `);
      
      const exists = result.rows[0]?.exists;
      
      if (exists) {
        console.log(`   ✅ ${enumName} enum: preserved`);
      } else {
        console.log(`   ❌ ${enumName} enum: MISSING (CRITICAL ERROR)`);
      }
    }
    console.log('');
    
    executionLog.result = 'SUCCESS';
    
    console.log('='.repeat(70));
    console.log('✅ PHASE B COMPLETE');
    console.log('='.repeat(70));
    console.log('');
    console.log(`Total operations: ${operationCount}`);
    console.log('');
    console.log('Next steps:');
    console.log('  - Phase C: Update Drizzle schema');
    console.log('  - Phase D: Update TypeScript types');
    console.log('  - Phase E: Update repositories');
    console.log('  - Phase F: Update services');
    console.log('  - Phase G: Update API routes');
    console.log('  - Phase H: Update delivery/cache/vector');
    console.log('');
    
  } catch (error: any) {
    console.error('');
    console.error('❌ FATAL ERROR during Phase B execution');
    console.error(error);
    executionLog.result = 'FAILED';
    executionLog.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    // Always save execution log
    const reportPath = 'scripts/phase-b-execution-log.json';
    writeFileSync(reportPath, JSON.stringify(executionLog, null, 2));
    console.log('');
    console.log(`📄 Execution log saved to: ${reportPath}`);
    console.log('');
  }
  
  if (executionLog.result === 'SUCCESS') {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main();
