#!/usr/bin/env node
/**
 * Apply migration 0021: Drop obsolete hierarchy foreign keys
 * 
 * These FKs reference local tutorial_* tables that don't exist.
 * The hierarchy is owned by quiz_platform_prod (parent DB).
 * Tutorial DB only stores hierarchy IDs as references.
 */

import { neon } from '@neondatabase/serverless';

const TUTORIAL_DB = process.env.TUTORIAL_DATABASE_URL || process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB) {
  console.error('❌ TUTORIAL_DATABASE_URL or DATABASE_URL_TUTORIAL required');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB);

console.log('🔧 Applying Migration 0021: Drop Tutorial V2 Hierarchy FKs');
console.log('============================================================\n');

async function main() {
  try {
    // Drop tutorial_sidebar_trees_v2 FKs
    console.log('1️⃣ Dropping tutorial_sidebar_trees_v2 foreign keys...\n');
    
    await sql`
      ALTER TABLE "tutorial_sidebar_trees_v2" 
      DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_domain_id_tutorial_domains_id_fk"
    `;
    console.log('  ✅ Dropped domain FK');

    await sql`
      ALTER TABLE "tutorial_sidebar_trees_v2"
      DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_subject_id_tutorial_subjects_id_fk"
    `;
    console.log('  ✅ Dropped subject FK');

    await sql`
      ALTER TABLE "tutorial_sidebar_trees_v2"
      DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_topic_id_tutorial_topics_id_fk"
    `;
    console.log('  ✅ Dropped topic FK');

    await sql`
      ALTER TABLE "tutorial_sidebar_trees_v2"
      DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_active_subtopic_id_tutorial_subtopics_id_fk"
    `;
    console.log('  ✅ Dropped active_subtopic FK');

    // Drop tutorial_page_content_v2 FKs
    console.log('\n2️⃣ Dropping tutorial_page_content_v2 foreign keys...\n');
    
    await sql`
      ALTER TABLE "tutorial_page_content_v2"
      DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_domain_id_tutorial_domains_id_fk"
    `;
    console.log('  ✅ Dropped domain FK');

    await sql`
      ALTER TABLE "tutorial_page_content_v2"
      DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_subject_id_tutorial_subjects_id_fk"
    `;
    console.log('  ✅ Dropped subject FK');

    await sql`
      ALTER TABLE "tutorial_page_content_v2"
      DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_topic_id_tutorial_topics_id_fk"
    `;
    console.log('  ✅ Dropped topic FK');

    await sql`
      ALTER TABLE "tutorial_page_content_v2"
      DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_subtopic_id_tutorial_subtopics_id_fk"
    `;
    console.log('  ✅ Dropped subtopic FK');

    console.log('\n✅ Migration 0021 applied successfully!');
    console.log('\nArchitecture:');
    console.log('  quiz_platform_prod (Parent DB)');
    console.log('    ├── domains');
    console.log('    ├── subjects');
    console.log('    ├── topics');
    console.log('    └── subtopics');
    console.log('         │');
    console.log('         │ IDs referenced by');
    console.log('         ▼');
    console.log('  tutorial_prod (Tutorial DB)');
    console.log('    ├── tutorial_sidebar_trees_v2');
    console.log('    └── tutorial_page_content_v2');
    console.log('\n  Hierarchy validation: APPLICATION LEVEL ✅');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nDetails:', {
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
    });
    process.exit(1);
  }
}

main();
