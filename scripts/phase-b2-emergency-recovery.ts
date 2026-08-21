/**
 * Phase B.2: EMERGENCY RECOVERY - Recreate tutorial_sections V2 Table
 * 
 * Phase B.1 accidentally dropped tutorial_sections table instead of just removing columns.
 * This script recreates the table with the CORRECT V2 schema (without legacy columns).
 * 
 * SAFE BECAUSE:
 * - Table had 0 rows (verified in Phase A)
 * - We have complete V2 schema definition
 * - All FKs referencing it also had 0 rows (already dropped)
 * 
 * Execution: npx tsx --tsconfig tsconfig.json scripts/phase-b2-emergency-recovery.ts
 */

import { db } from '@quiz/db-tutorial';
import { sql } from 'drizzle-orm';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('🚨 Phase B.2: EMERGENCY RECOVERY - Recreate tutorial_sections V2');
console.log('='.repeat(70));
console.log('');

const executionLog: any = {
  timestamp: new Date().toISOString(),
  phase: 'B.2 - Emergency Recovery',
  preflight_checks: {},
  operations: [],
  postflight_verification: {},
  result: 'NOT_STARTED'
};

let operationCount = 0;

function logOperation(type: string, target: string, result: string, details?: any) {
  operationCount++;
  const operation = {
    sequence: operationCount,
    type,
    target,
    result,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  };
  executionLog.operations.push(operation);
  const icon = result === 'SUCCESS' ? '✅' : result === 'FAILED' ? '❌' : '⚠️';
  console.log(`${icon} [${operationCount}] ${type}: ${target} - ${result}`);
  if (details) {
    console.log(`   Details: ${JSON.stringify(details)}`);
  }
}

async function emergencyRecovery() {
  try {
    console.log('📋 PREFLIGHT CHECKS');
    console.log('-'.repeat(70));
    
    // 1. Verify tutorial_sections does NOT exist
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      ) as exists;
    `);
    
    const exists = tableExists.rows[0]?.exists;
    console.log(`✓ tutorial_sections does NOT exist: ${!exists ? '✅ CONFIRMED' : '❌ FAILED'}`);
    executionLog.preflight_checks.table_does_not_exist = !exists;
    
    if (exists) {
      console.log('\n❌ ABORT: tutorial_sections already exists!');
      executionLog.result = 'ABORTED - Table already exists';
      return;
    }
    
    // 2. Verify required enums exist
    const requiredEnums = ['section_status', 'brand', 'brand_visibility'];
    for (const enumName of requiredEnums) {
      const enumExists = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = '${enumName}'
        ) as exists;
      `));
      
      const exists = enumExists.rows[0]?.exists;
      console.log(`✓ Enum ${enumName} exists: ${exists ? '✅ YES' : '❌ NO'}`);
      executionLog.preflight_checks[`enum_${enumName}_exists`] = exists;
      
      if (!exists) {
        console.log(`\n❌ ABORT: Required enum ${enumName} does not exist!`);
        executionLog.result = 'ABORTED - Missing enum';
        return;
      }
    }
    
    // 3. Verify tutorial_subtopics exists (FK parent)
    const subtopicsExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_subtopics'
      ) as exists;
    `);
    
    const subtopicsExist = subtopicsExists.rows[0]?.exists;
    console.log(`✓ tutorial_subtopics exists (FK parent): ${subtopicsExist ? '✅ YES' : '❌ NO'}`);
    executionLog.preflight_checks.tutorial_subtopics_exists = subtopicsExist;
    
    if (!subtopicsExist) {
      console.log('\n❌ ABORT: tutorial_subtopics (FK parent) does not exist!');
      executionLog.result = 'ABORTED - Missing FK parent';
      return;
    }
    
    // 4. Verify FK children exist (optional references)
    const fkChildren = [
      'prompt_templates',
      'educational_architectures',
      'ui_architectures'
    ];
    
    for (const table of fkChildren) {
      const exists = await db.execute(sql.raw(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${table}'
        ) as exists;
      `));
      
      const tableExists = exists.rows[0]?.exists;
      console.log(`✓ ${table} exists (FK reference): ${tableExists ? '✅ YES' : '⚠️ NO'}`);
      executionLog.preflight_checks[`${table}_exists`] = tableExists;
    }
    
    executionLog.preflight_checks.overall = 'PASSED';
    console.log('\n✅ All preflight checks PASSED\n');
    
    console.log('🔨 EXECUTING RECOVERY IN TRANSACTION');
    console.log('-'.repeat(70));
    
    await db.transaction(async (tx) => {
      logOperation('TRANSACTION', 'BEGIN', 'SUCCESS');
      
      // Create tutorial_sections V2 table with CORRECT schema (no section_type, no difficulty)
      await tx.execute(sql`
        CREATE TABLE tutorial_sections (
          -- Primary Key
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          
          -- Hierarchy Reference
          subtopic_id UUID NOT NULL REFERENCES tutorial_subtopics(id) ON DELETE CASCADE,
          
          -- Section Configuration (NO section_type, NO difficulty - those were legacy)
          order_index INTEGER NOT NULL DEFAULT 0,
          
          -- Content Storage (JSONB for flexibility)
          content JSONB NOT NULL,
          
          -- Versioning
          version INTEGER NOT NULL DEFAULT 1,
          language TEXT NOT NULL DEFAULT 'en',
          
          -- Lifecycle Status
          status section_status NOT NULL DEFAULT 'draft',
          
          -- AI Generation Metadata
          generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
          ai_model_used TEXT,
          generation_job_id UUID,
          quality_score INTEGER,
          hallucination_score INTEGER,
          regeneration_count INTEGER NOT NULL DEFAULT 0,
          
          -- Approval Workflow
          approved_by UUID,
          approved_at TIMESTAMP,
          rejection_reason TEXT,
          
          -- FK Hardening - Explicit Architecture References
          prompt_template_id UUID REFERENCES prompt_templates(id) ON DELETE SET NULL,
          educational_architecture_id UUID REFERENCES educational_architectures(id) ON DELETE SET NULL,
          ui_architecture_id UUID REFERENCES ui_architectures(id) ON DELETE SET NULL,
          
          -- Brand Partitioning
          brand_id brand NOT NULL DEFAULT 'shared',
          brand_visibility brand_visibility NOT NULL DEFAULT 'shared_visible',
          brand_customizations JSONB,
          
          -- Timestamps
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          published_at TIMESTAMP,
          deleted_at TIMESTAMP
        );
      `);
      
      logOperation('CREATE_TABLE', 'tutorial_sections', 'SUCCESS');
      
      // Create V2 unique constraint: UNIQUE(subtopic_id, brand_id)
      await tx.execute(sql`
        ALTER TABLE tutorial_sections
          ADD CONSTRAINT uq_tutorial_v2_identity 
          UNIQUE(subtopic_id, brand_id);
      `);
      
      logOperation('CREATE_CONSTRAINT', 'uq_tutorial_v2_identity', 'SUCCESS');
      
      // Create V2 optimized indexes
      await tx.execute(sql`
        CREATE INDEX idx_tutorial_v2_delivery 
          ON tutorial_sections(subtopic_id, brand_id, status)
          WHERE status = 'deployed';
      `);
      logOperation('CREATE_INDEX', 'idx_tutorial_v2_delivery', 'SUCCESS');
      
      await tx.execute(sql`
        CREATE INDEX idx_tutorial_v2_by_brand
          ON tutorial_sections(brand_id, status, updated_at DESC);
      `);
      logOperation('CREATE_INDEX', 'idx_tutorial_v2_by_brand', 'SUCCESS');
      
      await tx.execute(sql`
        CREATE INDEX idx_tutorial_v2_by_status
          ON tutorial_sections(status, updated_at DESC)
          WHERE status IN ('draft', 'pending_review', 'in_review', 'changes_requested');
      `);
      logOperation('CREATE_INDEX', 'idx_tutorial_v2_by_status', 'SUCCESS');
      
      await tx.execute(sql`
        CREATE INDEX idx_tutorial_v2_by_architecture
          ON tutorial_sections(educational_architecture_id)
          WHERE educational_architecture_id IS NOT NULL;
      `);
      logOperation('CREATE_INDEX', 'idx_tutorial_v2_by_architecture', 'SUCCESS');
      
      await tx.execute(sql`
        CREATE INDEX idx_tutorial_v2_subtopic_status
          ON tutorial_sections(subtopic_id, status);
      `);
      logOperation('CREATE_INDEX', 'idx_tutorial_v2_subtopic_status', 'SUCCESS');
      
      logOperation('TRANSACTION', 'COMMIT', 'SUCCESS');
    });
    
    console.log('\n📋 POSTFLIGHT VERIFICATION');
    console.log('-'.repeat(70));
    
    // 1. Verify table exists
    const tableNowExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tutorial_sections'
      ) as exists;
    `);
    
    const nowExists = tableNowExists.rows[0]?.exists;
    console.log(`✓ tutorial_sections now exists: ${nowExists ? '✅ YES' : '❌ NO'}`);
    executionLog.postflight_verification.table_exists = nowExists;
    
    // 2. Verify columns (should NOT have section_type or difficulty)
    const columnsCheck = await db.execute(sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'tutorial_sections'
      ORDER BY ordinal_position;
    `);
    
    const columnNames = columnsCheck.rows.map((r: any) => r.column_name);
    const hasSectionType = columnNames.includes('section_type');
    const hasDifficulty = columnNames.includes('difficulty');
    const hasSubtopicId = columnNames.includes('subtopic_id');
    const hasBrandId = columnNames.includes('brand_id');
    
    console.log(`✓ Has subtopic_id column: ${hasSubtopicId ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Has brand_id column: ${hasBrandId ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Does NOT have section_type: ${!hasSectionType ? '✅ CORRECT' : '❌ WRONG'}`);
    console.log(`✓ Does NOT have difficulty: ${!hasDifficulty ? '✅ CORRECT' : '❌ WRONG'}`);
    
    executionLog.postflight_verification.has_v2_columns = hasSubtopicId && hasBrandId;
    executionLog.postflight_verification.no_legacy_columns = !hasSectionType && !hasDifficulty;
    
    // 3. Verify unique constraint
    const constraintCheck = await db.execute(sql`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'tutorial_sections'::regclass
        AND conname = 'uq_tutorial_v2_identity';
    `);
    
    const hasConstraint = constraintCheck.rows.length > 0;
    console.log(`✓ V2 unique constraint exists: ${hasConstraint ? '✅ YES' : '❌ NO'}`);
    executionLog.postflight_verification.v2_unique_constraint_exists = hasConstraint;
    
    // 4. Verify indexes
    const indexCheck = await db.execute(sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'tutorial_sections'
        AND indexname LIKE 'idx_tutorial_v2%';
    `);
    
    const v2IndexCount = indexCheck.rows.length;
    console.log(`✓ V2 indexes created: ${v2IndexCount} (expected 5)`);
    executionLog.postflight_verification.v2_indexes_count = v2IndexCount;
    executionLog.postflight_verification.v2_indexes_correct = v2IndexCount === 5;
    
    // 5. Verify FK constraints
    const fkCheck = await db.execute(sql`
      SELECT 
        tc.constraint_name,
        ccu.table_name AS foreign_table_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.constraint_column_usage AS ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'tutorial_sections'
      ORDER BY tc.constraint_name;
    `);
    
    console.log(`✓ Foreign key constraints: ${fkCheck.rows.length}`);
    fkCheck.rows.forEach((row: any) => {
      console.log(`  - ${row.constraint_name} → ${row.foreign_table_name}`);
    });
    executionLog.postflight_verification.fk_constraints_count = fkCheck.rows.length;
    
    // Overall verification
    const allChecksPassed = 
      nowExists &&
      hasSubtopicId &&
      hasBrandId &&
      !hasSectionType &&
      !hasDifficulty &&
      hasConstraint &&
      v2IndexCount === 5;
    
    executionLog.postflight_verification.overall = allChecksPassed ? 'PASSED' : 'FAILED';
    
    if (allChecksPassed) {
      console.log('\n✅ All postflight checks PASSED');
      console.log('\n🎉 RECOVERY SUCCESSFUL - tutorial_sections V2 table recreated!');
      executionLog.result = 'SUCCESS';
    } else {
      console.log('\n❌ Some postflight checks FAILED');
      executionLog.result = 'PARTIAL_SUCCESS';
    }
    
  } catch (error) {
    console.error('\n❌ ERROR during recovery:', error);
    executionLog.result = 'FAILED';
    executionLog.error = {
      message: (error as Error).message,
      stack: (error as Error).stack
    };
  } finally {
    // Write execution log
    const logPath = path.resolve(process.cwd(), 'scripts/phase-b2-recovery-log.json');
    writeFileSync(logPath, JSON.stringify(executionLog, null, 2));
    console.log(`\n📄 Execution log: ${logPath}`);
    
    process.exit(executionLog.result === 'SUCCESS' ? 0 : 1);
  }
}

emergencyRecovery();
