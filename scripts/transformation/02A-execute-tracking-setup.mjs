#!/usr/bin/env node
/**
 * Execute Migration Tracking Table Setup
 */

import { neon } from '@neondatabase/serverless';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;
const sql = neon(TUTORIAL_DB_URL);

console.log('🔧 Creating Migration Tracking Infrastructure...\n');

try {
  // Create migration_status enum
  console.log('Creating migration_status enum...');
  await sql`
    DO $$ BEGIN
      CREATE TYPE migration_status AS ENUM (
        'pending',
        'in_progress',
        'success',
        'partial',
        'failed',
        'skipped',
        'rolled_back'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log('✅ migration_status enum ready');
  
  // Create migration_mode enum
  console.log('Creating migration_mode enum...');
  await sql`
    DO $$ BEGIN
      CREATE TYPE migration_mode AS ENUM (
        'pilot',
        'full',
        'retry',
        'manual'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `;
  console.log('✅ migration_mode enum ready');
  
  // Create tracking table
  console.log('Creating legacy_content_migration_tracking table...');
  await sql`
    CREATE TABLE IF NOT EXISTS legacy_content_migration_tracking (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      legacy_content_id UUID NOT NULL,
      subtopic_id UUID NOT NULL,
      topic_id UUID,
      migration_batch_id UUID NOT NULL,
      migration_mode migration_mode NOT NULL DEFAULT 'full',
      migration_status migration_status NOT NULL DEFAULT 'pending',
      sections_created INTEGER DEFAULT 0,
      subsections_created INTEGER DEFAULT 0,
      sections_expected INTEGER DEFAULT 12,
      subsections_expected INTEGER,
      duplicate_sections_skipped INTEGER DEFAULT 0,
      was_already_migrated BOOLEAN DEFAULT FALSE,
      validation_score INTEGER,
      validation_passed BOOLEAN,
      validation_errors JSONB,
      rollback_ready BOOLEAN DEFAULT TRUE,
      rollback_batch_id UUID,
      can_resume BOOLEAN DEFAULT TRUE,
      started_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      duration_seconds INTEGER,
      error_log JSONB,
      warnings JSONB,
      retry_count INTEGER DEFAULT 0,
      created_by TEXT DEFAULT 'migration_script',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_legacy_content_migration UNIQUE (legacy_content_id, migration_mode)
    );
  `;
  console.log('✅ Tracking table created');
  
  // Create indexes
  console.log('Creating indexes...');
  await sql`CREATE INDEX IF NOT EXISTS idx_migration_tracking_content ON legacy_content_migration_tracking(legacy_content_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_migration_tracking_batch ON legacy_content_migration_tracking(migration_batch_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_migration_tracking_status ON legacy_content_migration_tracking(migration_status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_migration_tracking_mode ON legacy_content_migration_tracking(migration_mode)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_migration_tracking_subtopic ON legacy_content_migration_tracking(subtopic_id)`;
  console.log('✅ Indexes created');
  
  console.log('\n✅ Migration tracking infrastructure ready');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}

