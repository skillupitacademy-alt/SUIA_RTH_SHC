/**
 * Phase B.1: Tutorial V2 Legacy Eradication - Hardened Destructive Migration
 * 
 * This script performs the actual eradication of legacy Tutorial architecture
 * with comprehensive safety checks and transactional integrity.
 * 
 * CRITICAL SAFETY:
 * - Real transaction support for all-or-nothing execution
 * - Preflight checks re-verify ALL Phase A findings
 * - Every table drop verified for zero incoming FKs
 * - Aborts if ANY table has acquired data since Phase A
 * - Aborts if ANY V2 current table would be affected
 * - All operations in explicit dependency order (NO CASCADE)
 * - Post-migration verification with hard failure gates
 * 
 * Execution: npx tsx --tsconfig tsconfig.json scripts/phase-b1-hardened-eradication.ts
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🚨 Phase B.1: Tutorial V2 Legacy Eradication - HARDENED MIGRATION');
console.log('='.repeat(70));
console.log('');
console.log('⚠️  WARNING: This script will DROP tables and columns in a transaction.');
console.log('⚠️  All operations are logged to: scripts/phase-b1-execution-log.json');
console.log('');

const executionLog: any = {
  timestamp: new Date().toISOString(),
  phase: 'B.1 - Hardened Legacy Eradication',
  preflight_checks: {},
  operations: [],
  postflight_verification: {},
  result: 'NOT_STARTED'
};

let operationCount = 0;

// ===== AUTHORITATIVE LEGACY OBJECT DEFINITIONS =====

const LEGACY_TABLES_DROP_ORDER = [
  // Group 1: Legacy dependent analytics
  {
    group: 'Legacy dependent analytics',
    tables: ['subsection_engagement_metrics']
  },
  // Group 2: Obsolete legacy tables
  {
    group: 'Obsolete legacy tables',
    tables: ['tutorial_video_links', 'ai_section_generation_jobs']
  },
  // Group 3: Legacy section child tables
  {
    group: 'Legacy section child tables',
    tables: [
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
      'tutorial_section_ai_tutor'
    ]
  },
  // Group 4: Legacy interaction/deployment tables
  {
    group: 'Legacy interaction/deployment tables',
    tables: [
      'code_interactions',
      'content_deployments',
      'practice_test_answers',
      'quiz_answers',
      'section_completions',
      'tutorial_learning_metrics',
      'visual_interactions'
    ]
  },
  // Group 5: Old tutorial core
  {
    group: 'Old tutorial core',
    tables: ['tutorial_subsections', 'tutorial_content']
  },
  // Group 7: Old root (after all dependencies gone)
  {
    group: 'Old root table',
    tables: ['tutorial_sections']
  },
  // Group 8: Backup tables
  {
    group: 'Backup tables',
    tables: [
      'tutorial_section_layman_backup_20260815',
      'tutorial_sections_layman_backup_20260815'
    ]
  }
];

const LEGACY_COLUMNS = [
  { table: 'tutorial_sections', column: 'section_type' },
  { table: 'tutorial_sections', column: 'difficulty' }
];

const ALL_LEGACY_TABLES = LEGACY_TABLES_DROP_ORDER.flatMap(g => g.tables);

const PROTECTED_V2_TABLES = ['prompt_templates'];

const PROTECTED_ENUM_COLUMNS = [
  { table: 'prompt_templates', column: 'section_type', enum: 'section_type' },
  { table: 'prompt_templates', column: 'subsection_type', enum: 'subsection_type' }
];

const LEGITIMATE_ENUM_CONSUMERS = [
  { table: 'assignment_progress', column: 'difficulty', enum: 'tutorial_difficulty' },
  { table: 'tutorial_assignments', column: 'difficulty', enum: 'tutorial_difficulty' },
  { table: 'tutorial_project_submissions', column: 'difficulty', enum: 'tutorial_difficulty' },
  { table: 'ai_generation_orchestration', column: 'difficulty', enum: 'tutorial_difficulty' },
  { table: 'content_generation_jobs', column: 'difficulty', enum: 'tutorial_difficulty' }
];

const REQUIRED_ENUMS = ['tutorial_difficulty', 'section_type', 'subsection_type'];

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
 * Check if table exists (transaction-aware)
 */
async function tableExists(tableName: string, txOrDb: any = db): Promise<boolean> {
  const result = await txOrDb.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    ) as exists
  `);
  return result.rows[0]?.exists || false;
}

/**
 * Check if column exists (transaction-aware)
 */
async function columnExists(tableName: string, columnName: string, txOrDb: any = db): Promise<boolean> {
  const result = await txOrDb.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    ) as exists
  `);
  return result.rows[0]?.exists || false;
}

/**
 * Get row count for table (transaction-aware)
 */
async function getRowCount(tableName: string, txOrDb: any = db): Promise<number> {
  const result = await txOrDb.execute(sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`));
  return parseInt(result.rows[0].count);
}

/**
 * Get incoming FK count for table (transaction-aware)
 */
async function getIncomingFkCount(tableName: string, txOrDb: any = db): Promise<number> {
  const result = await txOrDb.execute(sql`
    SELECT COUNT(*) as count
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name = ${tableName}
  `);
  return parseInt(result.rows[0].count);
}

/**
 * Get incoming FK details for table (transaction-aware)
 */
async function getIncomingFks(tableName: string, txOrDb: any = db): Promise<any[]> {
  const result = await txOrDb.execute(sql`
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
      AND ccu.table_name = ${tableName}
    ORDER BY tc.table_name
  `);
  return result.rows;
}

async function main() {
  try {
    // ===== PREFLIGHT SAFETY CHECKS =====
    console.log('🔍 PREFLIGHT SAFETY CHECKS');
    console.log('='.repeat(70));
    console.log('');
    
    let preflightPassed = true;
    const preflightErrors: string[] = [];
    
    // Check 1: Verify all legacy tables exist and are empty
    console.log('✓ Check 1: Verifying legacy tables exist and are empty...');
    
    for (const table of ALL_LEGACY_TABLES) {
      const exists = await tableExists(table);
      
      if (!exists) {
        // Table doesn't exist - that's OK if it was already dropped (like tutorial_section_layman)
        console.log(`   ⏭️  ${table}: does not exist (already dropped)`);
        continue;
      }
      
      const rowCount = await getRowCount(table);
      
      if (rowCount > 0) {
        preflightPassed = false;
        preflightErrors.push(`${table} has ${rowCount} rows (expected 0)`);
        console.log(`   ❌ ${table}: ${rowCount} rows (UNSAFE)`);
      } else {
        console.log(`   ✅ ${table}: 0 rows`);
      }
    }
    
    executionLog.preflight_checks.legacy_tables_empty = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 2: Verify protected V2 tables exist
    console.log('✓ Check 2: Verifying V2 protected tables exist...');
    
    for (const table of PROTECTED_V2_TABLES) {
      const exists = await tableExists(table);
      
      if (!exists) {
        preflightPassed = false;
        preflightErrors.push(`${table} does not exist (V2 current table missing)`);
        console.log(`   ❌ ${table}: MISSING (UNSAFE)`);
      } else {
        console.log(`   ✅ ${table}: exists`);
      }
    }
    
    executionLog.preflight_checks.v2_tables_protected = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 3: Verify protected enum columns exist
    console.log('✓ Check 3: Verifying protected enum columns exist...');
    
    for (const col of PROTECTED_ENUM_COLUMNS) {
      const exists = await columnExists(col.table, col.column);
      
      if (!exists) {
        preflightPassed = false;
        preflightErrors.push(`${col.table}.${col.column} (${col.enum}) does not exist`);
        console.log(`   ❌ ${col.table}.${col.column} (${col.enum}): MISSING`);
      } else {
        // Verify it uses the correct enum type
        const typeResult = await db.execute(sql`
          SELECT udt_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = ${col.table}
            AND column_name = ${col.column}
        `);
        
        const actualType = typeResult.rows[0]?.udt_name;
        
        if (actualType !== col.enum) {
          preflightPassed = false;
          preflightErrors.push(`${col.table}.${col.column} has type ${actualType}, expected ${col.enum}`);
          console.log(`   ❌ ${col.table}.${col.column}: wrong type (${actualType} vs ${col.enum})`);
        } else {
          console.log(`   ✅ ${col.table}.${col.column} (${col.enum}): exists`);
        }
      }
    }
    
    executionLog.preflight_checks.protected_enum_columns = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 4: Verify required enums exist
    console.log('✓ Check 4: Verifying required enums exist...');
    
    for (const enumName of REQUIRED_ENUMS) {
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
    }
    
    executionLog.preflight_checks.required_enums_exist = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 5: Verify FK dependencies for ALL tables being dropped
    console.log('✓ Check 5: Verifying FK dependencies for all target tables...');
    
    const expectedDependencies: Record<string, string[]> = {
      'tutorial_sections': [
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
      ],
      'tutorial_subsections': ['subsection_engagement_metrics'],
      // All other tables should have 0 incoming FKs
    };
    
    for (const table of ALL_LEGACY_TABLES) {
      const exists = await tableExists(table);
      if (!exists) continue;
      
      const incomingFks = await getIncomingFks(table);
      const incomingFkTables = incomingFks.map((fk: any) => fk.table_name);
      
      const expectedFks = expectedDependencies[table] || [];
      
      // Check for unexpected FKs (not in expected list and not in legacy tables being dropped)
      const unexpectedFks = incomingFkTables.filter(fkTable => 
        !expectedFks.includes(fkTable) && !ALL_LEGACY_TABLES.includes(fkTable)
      );
      
      if (unexpectedFks.length > 0) {
        preflightPassed = false;
        preflightErrors.push(`${table} has unexpected incoming FKs: ${unexpectedFks.join(', ')}`);
        console.log(`   ❌ ${table}: unexpected FKs from ${unexpectedFks.join(', ')}`);
      } else {
        console.log(`   ✅ ${table}: ${incomingFks.length} expected FKs`);
      }
    }
    
    executionLog.preflight_checks.fk_dependencies_verified = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 6: Verify legitimate enum consumers still exist
    console.log('✓ Check 6: Verifying legitimate enum consumers exist...');
    
    for (const consumer of LEGITIMATE_ENUM_CONSUMERS) {
      const exists = await columnExists(consumer.table, consumer.column);
      
      if (!exists) {
        preflightPassed = false;
        preflightErrors.push(`${consumer.table}.${consumer.column} (${consumer.enum}) does not exist`);
        console.log(`   ❌ ${consumer.table}.${consumer.column} (${consumer.enum}): MISSING`);
      } else {
        console.log(`   ✅ ${consumer.table}.${consumer.column} (${consumer.enum}): exists`);
      }
    }
    
    executionLog.preflight_checks.legitimate_enum_consumers_exist = preflightPassed && preflightErrors.length === 0;
    console.log('');
    
    // Check 7: Verify protected tables are NOT in legacy drop list
    console.log('✓ Check 7: Verifying protected tables not in drop list...');
    
    for (const protectedTable of PROTECTED_V2_TABLES) {
      if (ALL_LEGACY_TABLES.includes(protectedTable)) {
        preflightPassed = false;
        preflightErrors.push(`Protected table ${protectedTable} is in legacy drop list`);
        console.log(`   ❌ ${protectedTable}: IN DROP LIST (CRITICAL ERROR)`);
      } else {
        console.log(`   ✅ ${protectedTable}: not in drop list`);
      }
    }
    
    executionLog.preflight_checks.protected_tables_not_in_drop_list = preflightPassed && preflightErrors.length === 0;
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
      
      const reportPath = 'scripts/phase-b1-execution-log.json';
      writeFileSync(reportPath, JSON.stringify(executionLog, null, 2));
      console.log('');
      console.log(`📄 Execution log saved to: ${reportPath}`);
      
      process.exit(1);
    }
    console.log('='.repeat(70));
    console.log('');
    
    // ===== DESTRUCTIVE OPERATIONS IN TRANSACTION =====
    console.log('🗑️  EXECUTING DESTRUCTIVE OPERATIONS (TRANSACTIONAL)');
    console.log('='.repeat(70));
    console.log('');
    
    console.log('⚠️  Starting transaction...');
    logOperation('TRANSACTION', 'BEGIN', 'db.transaction()', 'SUCCESS');
    console.log('');
    
    await db.transaction(async (tx) => {
      // Execute all drop groups in order
      for (const group of LEGACY_TABLES_DROP_ORDER) {
        console.log(`Group: ${group.group}`);
        
        for (const table of group.tables) {
          const exists = await tableExists(table, tx);
          
          if (!exists) {
            logOperation('DROP_TABLE', table, `DROP TABLE ${table}`, 'SKIPPED', {
              message: 'Table does not exist'
            });
            continue;
          }
          
          // Final safety check: verify ZERO incoming FKs before drop
          const incomingFkCount = await getIncomingFkCount(table, tx);
          
          if (incomingFkCount > 0) {
            const incomingFks = await getIncomingFks(table, tx);
            const incomingFkTables = incomingFks.map((fk: any) => fk.table_name);
            
            // STRICT: incoming FK count must be exactly 0
            // If not, the drop order is wrong or a dependency was missed
            throw new Error(
              `Cannot drop ${table}: has ${incomingFkCount} incoming FKs from ${incomingFkTables.join(', ')}. ` +
              `Drop order should guarantee 0 FKs at this point.`
            );
          }
          
          // Drop table using transaction connection
          await tx.execute(sql.raw(`DROP TABLE ${table}`));
          logOperation('DROP_TABLE', table, `DROP TABLE ${table}`, 'SUCCESS');
        }
        
        console.log('');
      }
      
      // Group 6: Drop legacy columns (after most tables gone)
      console.log('Group: Old tutorial_sections columns');
      
      for (const col of LEGACY_COLUMNS) {
        const tableStillExists = await tableExists(col.table, tx);
        
        if (!tableStillExists) {
          logOperation('DROP_COLUMN', `${col.table}.${col.column}`, 
            `ALTER TABLE ${col.table} DROP COLUMN ${col.column}`, 'SKIPPED', {
            message: 'Table does not exist'
          });
          continue;
        }
        
        const columnStillExists = await columnExists(col.table, col.column, tx);
        
        if (!columnStillExists) {
          logOperation('DROP_COLUMN', `${col.table}.${col.column}`, 
            `ALTER TABLE ${col.table} DROP COLUMN ${col.column}`, 'SKIPPED', {
            message: 'Column does not exist'
          });
          continue;
        }
        
        // Drop column using transaction connection
        await tx.execute(sql.raw(`ALTER TABLE ${col.table} DROP COLUMN ${col.column}`));
        logOperation('DROP_COLUMN', `${col.table}.${col.column}`, 
          `ALTER TABLE ${col.table} DROP COLUMN ${col.column}`, 'SUCCESS');
      }
      
      console.log('');
      console.log('✅ All operations successful - transaction will commit automatically');
      logOperation('TRANSACTION', 'COMMIT', 'auto-commit', 'SUCCESS');
      console.log('');
    });
    
    // ===== POST-MIGRATION VERIFICATION =====
    console.log('='.repeat(70));
    console.log('✅ DESTRUCTIVE OPERATIONS COMPLETE');
    console.log('='.repeat(70));
    console.log('');
    
    console.log('🔍 POST-MIGRATION VERIFICATION');
    console.log('='.repeat(70));
    console.log('');
    
    let postflightPassed = true;
    const postflightErrors: string[] = [];
    
    // Verify 1: All target tables are dropped
    console.log('✓ Verify 1: All target tables are dropped...');
    
    for (const table of ALL_LEGACY_TABLES) {
      const exists = await tableExists(table);
      
      if (exists) {
        postflightPassed = false;
        postflightErrors.push(`${table} still exists (should be dropped)`);
        console.log(`   ❌ ${table}: still exists`);
      } else {
        console.log(`   ✅ ${table}: dropped`);
      }
    }
    
    executionLog.postflight_verification.all_target_tables_dropped = !postflightErrors.length;
    console.log('');
    
    // Verify 2: All protected tables still exist
    console.log('✓ Verify 2: All protected tables still exist...');
    
    for (const table of PROTECTED_V2_TABLES) {
      const exists = await tableExists(table);
      
      if (!exists) {
        postflightPassed = false;
        postflightErrors.push(`${table} does not exist (V2 table was dropped)`);
        console.log(`   ❌ ${table}: MISSING (CRITICAL ERROR)`);
      } else {
        console.log(`   ✅ ${table}: preserved`);
      }
    }
    
    executionLog.postflight_verification.all_protected_tables_exist = !postflightErrors.length;
    console.log('');
    
    // Verify 3: Protected enum columns still exist
    console.log('✓ Verify 3: Protected enum columns still exist...');
    
    for (const col of PROTECTED_ENUM_COLUMNS) {
      const exists = await columnExists(col.table, col.column);
      
      if (!exists) {
        postflightPassed = false;
        postflightErrors.push(`${col.table}.${col.column} does not exist (V2 column was dropped)`);
        console.log(`   ❌ ${col.table}.${col.column}: MISSING (CRITICAL ERROR)`);
      } else {
        console.log(`   ✅ ${col.table}.${col.column}: preserved`);
      }
    }
    
    executionLog.postflight_verification.protected_enum_columns_exist = !postflightErrors.length;
    console.log('');
    
    // Verify 4: Legitimate enum consumers still exist
    console.log('✓ Verify 4: Legitimate enum consumers still exist...');
    
    for (const consumer of LEGITIMATE_ENUM_CONSUMERS) {
      const exists = await columnExists(consumer.table, consumer.column);
      
      if (!exists) {
        postflightPassed = false;
        postflightErrors.push(`${consumer.table}.${consumer.column} does not exist (legitimate consumer was dropped)`);
        console.log(`   ❌ ${consumer.table}.${consumer.column}: MISSING (CRITICAL ERROR)`);
      } else {
        console.log(`   ✅ ${consumer.table}.${consumer.column}: preserved`);
      }
    }
    
    executionLog.postflight_verification.legitimate_enum_consumers_exist = !postflightErrors.length;
    console.log('');
    
    // Verify 5: Required enums still exist
    console.log('✓ Verify 5: Required enums still exist...');
    
    for (const enumName of REQUIRED_ENUMS) {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = ${enumName}
        ) as exists
      `);
      
      const exists = result.rows[0]?.exists;
      
      if (!exists) {
        postflightPassed = false;
        postflightErrors.push(`${enumName} enum does not exist (enum was dropped)`);
        console.log(`   ❌ ${enumName} enum: MISSING (CRITICAL ERROR)`);
      } else {
        console.log(`   ✅ ${enumName} enum: preserved`);
      }
    }
    
    executionLog.postflight_verification.required_enums_exist = !postflightErrors.length;
    console.log('');
    
    // Verify 6: Legacy columns are gone
    console.log('✓ Verify 6: Legacy columns are gone...');
    
    for (const col of LEGACY_COLUMNS) {
      const exists = await columnExists(col.table, col.column);
      
      if (exists) {
        postflightPassed = false;
        postflightErrors.push(`${col.table}.${col.column} still exists (should be dropped)`);
        console.log(`   ❌ ${col.table}.${col.column}: still exists`);
      } else {
        console.log(`   ✅ ${col.table}.${col.column}: dropped`);
      }
    }
    
    executionLog.postflight_verification.legacy_columns_dropped = !postflightErrors.length;
    console.log('');
    
    // Verify 7: No FKs referencing dropped tables remain
    console.log('✓ Verify 7: No FKs referencing dropped tables remain...');
    
    // Query all FK constraints and check if any reference our dropped tables
    const allFksResult = await db.execute(sql`
      SELECT 
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    `);
    
    let orphanedFkCount = 0;
    for (const fk of allFksResult.rows) {
      if (ALL_LEGACY_TABLES.includes(fk.foreign_table_name)) {
        postflightPassed = false;
        postflightErrors.push(
          `FK ${fk.constraint_name} from ${fk.table_name}.${fk.column_name} ` +
          `references dropped table ${fk.foreign_table_name}`
        );
        console.log(`   ❌ Orphaned FK: ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}`);
        orphanedFkCount++;
      }
    }
    
    if (orphanedFkCount === 0) {
      console.log(`   ✅ No FKs referencing dropped tables (checked ${allFksResult.rows.length} total FKs)`);
    }
    
    executionLog.postflight_verification.no_fks_to_dropped_tables = orphanedFkCount === 0;
    console.log('');
    
    // Final postflight verdict
    console.log('='.repeat(70));
    if (postflightPassed) {
      console.log('✅ POSTFLIGHT VERIFICATION PASSED');
      executionLog.postflight_verification.overall = 'PASSED';
      executionLog.result = 'SUCCESS';
    } else {
      console.log('❌ POSTFLIGHT VERIFICATION FAILED');
      console.log('');
      console.log('⚠️  Migration completed but verification found issues:');
      postflightErrors.forEach(err => console.log(`   - ${err}`));
      executionLog.postflight_verification.overall = 'FAILED';
      executionLog.postflight_verification.errors = postflightErrors;
      executionLog.result = 'COMPLETED_WITH_VERIFICATION_ERRORS';
    }
    console.log('='.repeat(70));
    console.log('');
    
    if (postflightPassed) {
      console.log('='.repeat(70));
      console.log('✅ PHASE B.1 COMPLETE');
      console.log('='.repeat(70));
      console.log('');
      console.log(`Total operations: ${operationCount}`);
      console.log('');
      console.log('Migration Summary:');
      console.log(`  - Legacy tables dropped: ${ALL_LEGACY_TABLES.length}`);
      console.log(`  - Legacy columns dropped: ${LEGACY_COLUMNS.length}`);
      console.log(`  - Protected V2 tables: ${PROTECTED_V2_TABLES.length}`);
      console.log(`  - Protected enum columns: ${PROTECTED_ENUM_COLUMNS.length}`);
      console.log(`  - Preserved enums: ${REQUIRED_ENUMS.join(', ')}`);
      console.log('');
      console.log('Next steps:');
      console.log('  - Phase C: Update Drizzle schema');
      console.log('  - Phase D: Update TypeScript types');
      console.log('  - Phase E: Update repositories');
      console.log('  - Phase F: Update services');
      console.log('  - Phase G: Update API routes');
      console.log('  - Phase H: Update delivery/cache/vector');
      console.log('');
    }
    
  } catch (error: any) {
    console.error('');
    console.error('❌ FATAL ERROR during Phase B.1 execution');
    console.error(error);
    executionLog.result = 'FAILED';
    executionLog.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    // Always save execution log
    const reportPath = 'scripts/phase-b1-execution-log.json';
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
