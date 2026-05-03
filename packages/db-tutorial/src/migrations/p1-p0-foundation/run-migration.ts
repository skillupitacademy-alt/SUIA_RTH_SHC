/**
 * Phase 1 P0 Foundation - Migration Runner
 * Executes modular schema migration with safety checks
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '../../db';
import { sql } from 'drizzle-orm';

interface MigrationResult {
  success: boolean;
  message: string;
  error?: Error;
  duration?: number;
}

/**
 * Run migration with safety checks
 */
export async function runMigration(): Promise<MigrationResult> {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting Phase 1 P0 Foundation Migration...\n');
    
    // Step 1: Pre-migration validation
    console.log('📋 Step 1: Pre-migration validation');
    await validatePreMigration();
    console.log('✅ Pre-migration validation passed\n');
    
    // Step 2: Backup existing data
    console.log('💾 Step 2: Creating backup');
    await createBackup();
    console.log('✅ Backup created\n');
    
    // Step 3: Execute migration
    console.log('🔨 Step 3: Executing migration');
    await executeMigration();
    console.log('✅ Migration executed\n');
    
    // Step 4: Post-migration validation
    console.log('🔍 Step 4: Post-migration validation');
    await validatePostMigration();
    console.log('✅ Post-migration validation passed\n');
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ Migration completed successfully in ${duration}ms`);
    
    return {
      success: true,
      message: 'Migration completed successfully',
      duration,
    };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    // Attempt rollback
    console.log('\n🔄 Attempting rollback...');
    try {
      await rollbackMigration();
      console.log('✅ Rollback successful');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError);
    }
    
    return {
      success: false,
      message: 'Migration failed',
      error: error as Error,
    };
  }
}

/**
 * Validate system before migration
 */
async function validatePreMigration(): Promise<void> {
  // Check database connection
  await db.execute(sql`SELECT 1`);
  
  // Check if legacy tables exist
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'tutorial_content'
    ) as exists
  `);
  
  if (!result.rows[0]?.exists) {
    throw new Error('Legacy tutorial_content table not found');
  }
  
  // Check for existing modular tables (should not exist)
  const modularExists = await db.execute(sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'tutorial_sections'
    ) as exists
  `);
  
  if (modularExists.rows[0]?.exists) {
    throw new Error('Modular schema already exists. Run rollback first.');
  }
}

/**
 * Create backup of existing data
 */
async function createBackup(): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Create backup table
  await db.execute(sql`
    CREATE TABLE tutorial_content_backup_${sql.raw(timestamp)} AS 
    SELECT * FROM tutorial_content
  `);
  
  console.log(`  Backup table created: tutorial_content_backup_${timestamp}`);
}

/**
 * Execute the migration SQL
 */
async function executeMigration(): Promise<void> {
  const migrationPath = join(__dirname, '001-create-modular-schema.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}

/**
 * Validate system after migration
 */
async function validatePostMigration(): Promise<void> {
  // Check if all new tables exist
  const requiredTables = [
    'tutorial_sections',
    'tutorial_subsections',
    'educational_architectures',
    'ui_architectures',
    'ai_generation_orchestration',
    'ai_section_generation_jobs',
    'prompt_templates',
    'content_review_queue',
    'content_deployments',
    'ai_generation_metrics',
  ];
  
  for (const table of requiredTables) {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${table}
      ) as exists
    `);
    
    if (!result.rows[0]?.exists) {
      throw new Error(`Table ${table} was not created`);
    }
  }
  
  // Check if all enums exist
  const requiredEnums = [
    'section_type',
    'section_status',
    'deployment_type',
    'orchestration_status',
    'job_status',
    'review_status',
    'priority_level',
  ];
  
  for (const enumType of requiredEnums) {
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = ${enumType}
      ) as exists
    `);
    
    if (!result.rows[0]?.exists) {
      throw new Error(`Enum ${enumType} was not created`);
    }
  }
  
  // Validate foreign key constraints
  const fkResult = await db.execute(sql`
    SELECT COUNT(*) as count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND table_name IN (
      'tutorial_sections',
      'tutorial_subsections',
      'ai_section_generation_jobs',
      'content_deployments'
    )
  `);
  
  const fkCount = parseInt(String(fkResult.rows[0]?.count || '0'));
  if (fkCount < 4) {
    throw new Error(`Expected at least 4 foreign keys, found ${fkCount}`);
  }
}

/**
 * Rollback migration
 */
export async function rollbackMigration(): Promise<void> {
  const rollbackPath = join(__dirname, '001-rollback-modular-schema.sql');
  const rollbackSQL = readFileSync(rollbackPath, 'utf-8');
  
  // Split by semicolon and execute each statement
  const statements = rollbackSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }
}

/**
 * CLI execution
 */
if (require.main === module) {
  runMigration()
    .then((result) => {
      if (result.success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
