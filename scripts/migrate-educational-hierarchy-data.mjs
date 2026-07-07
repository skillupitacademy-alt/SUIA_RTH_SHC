/**
 * Migrate Educational Hierarchy Data from RealTutorialHub to SkillHubCore
 * 
 * This script copies data from realtutorialhub-admin's educational hierarchy tables
 * to skillhubcore-admin's new tables:
 * 
 * SOURCE (DATABASE_URL_TUTORIAL): tutorial_prod database
 *   - tutorial_domains
 *   - tutorial_subjects  
 *   - tutorial_topics
 *   - tutorial_subtopics
 * 
 * TARGET (SKILLHUBCORE_DATABASE_URL): tutorial_prod database (same database)
 *   - domains
 *   - subjects
 *   - topics
 *   - subtopics
 * 
 * Usage:
 *   node scripts/migrate-educational-hierarchy-data.mjs
 * 
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 *   --force      Skip confirmation prompt
 */

import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');

// Database connections
const sourceDatabaseUrl = process.env.DATABASE_URL; // quiz_platform_prod
const targetDatabaseUrl = process.env.SKILLHUBCORE_DATABASE_URL || 
                          process.env.DATABASE_URL_TUTORIAL; // tutorial_prod

if (!sourceDatabaseUrl || !targetDatabaseUrl) {
  console.error('❌ Missing database URLs');
  console.error('Source (DATABASE_URL):', sourceDatabaseUrl ? '✅' : '❌');
  console.error('Target (SKILLHUBCORE_DATABASE_URL or DATABASE_URL_TUTORIAL):', targetDatabaseUrl ? '✅' : '❌');
  process.exit(1);
}

const sourcePool = new Pool({
  connectionString: sourceDatabaseUrl,
  max: 5,
});

const targetPool = new Pool({
  connectionString: targetDatabaseUrl,
  max: 5,
});

console.log('🔄 Educational Hierarchy Data Migration\n');
console.log('📂 Source database: quiz_platform_prod');
console.log('   Connection:', sourceDatabaseUrl.replace(/:[^:]*@/, ':****@'));
console.log('   Tables: domains, subjects, topics, subtopics, skills');
console.log('📂 Target database: tutorial_prod');
console.log('   Connection:', targetDatabaseUrl.replace(/:[^:]*@/, ':****@'));
console.log('   Tables: domains, subjects, topics, subtopics, skills');
console.log('');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

// Statistics
const stats = {
  domains: { source: 0, target: 0, migrated: 0, skipped: 0 },
  subjects: { source: 0, target: 0, migrated: 0, skipped: 0 },
  topics: { source: 0, target: 0, migrated: 0, skipped: 0 },
  subtopics: { source: 0, target: 0, migrated: 0, skipped: 0 },
};

// Helper function to prompt user
function promptUser(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

// Step 1: Count records in source and target
async function countRecords() {
  console.log('📊 Step 1: Counting records\n');

  try {
    // Verify connections
    const sourceDb = await sourcePool.query('SELECT current_database()');
    const targetDb = await targetPool.query('SELECT current_database()');
    console.log(`Source DB: ${sourceDb.rows[0].current_database}`);
    console.log(`Target DB: ${targetDb.rows[0].current_database}\n`);
    
    // Simple test - just count domains directly
    console.log('Testing direct query...');
    const testQuery = await sourcePool.query('SELECT COUNT(*) as count FROM domains');
    console.log(`Test result: ${testQuery.rows[0].count} domains\n`);
    
    // Count source records
    const sourceDomains = await sourcePool.query(
      'SELECT COUNT(*) as count FROM domains'
    );
    stats.domains.source = parseInt(sourceDomains.rows[0].count);

    const sourceSubjects = await sourcePool.query(
      `SELECT COUNT(*) as count FROM public.subjects ${deletedCondition}`
    );
    stats.subjects.source = parseInt(sourceSubjects.rows[0].count);

    const sourceTopics = await sourcePool.query(
      `SELECT COUNT(*) as count FROM public.topics ${deletedCondition}`
    );
    stats.topics.source = parseInt(sourceTopics.rows[0].count);

    const sourceSubtopics = await sourcePool.query(
      `SELECT COUNT(*) as count FROM public.subtopics ${deletedCondition}`
    );
    stats.subtopics.source = parseInt(sourceSubtopics.rows[0].count);

    // Count target records  
    const targetDomains = await targetPool.query(
      'SELECT COUNT(*) as count FROM public.domains WHERE deleted_at IS NULL'
    );
    stats.domains.target = parseInt(targetDomains.rows[0].count);

    const targetSubjects = await targetPool.query(
      'SELECT COUNT(*) as count FROM public.subjects WHERE deleted_at IS NULL'
    );
    stats.subjects.target = parseInt(targetSubjects.rows[0].count);

    const targetTopics = await targetPool.query(
      'SELECT COUNT(*) as count FROM public.topics WHERE deleted_at IS NULL'
    );
    stats.topics.target = parseInt(targetTopics.rows[0].count);

    const targetSubtopics = await targetPool.query(
      'SELECT COUNT(*) as count FROM public.subtopics WHERE deleted_at IS NULL'
    );
    stats.subtopics.target = parseInt(targetSubtopics.rows[0].count);

    console.log('Source Records (quiz_platform_prod):');
    console.log(`  domains:    ${stats.domains.source}`);
    console.log(`  subjects:   ${stats.subjects.source}`);
    console.log(`  topics:     ${stats.topics.source}`);
    console.log(`  subtopics:  ${stats.subtopics.source}`);
    console.log('');
    console.log('Target Records (tutorial_prod / SkillHubCore):');
    console.log(`  domains:    ${stats.domains.target}`);
    console.log(`  subjects:   ${stats.subjects.target}`);
    console.log(`  topics:     ${stats.topics.target}`);
    console.log(`  subtopics:  ${stats.subtopics.target}`);
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ Error counting records:', error.message);
    return false;
  }
}

// Step 2: Migrate Domains
async function migrateDomains() {
  console.log('📋 Step 2: Migrating domains\n');

  try {
    // Fetch source domains
    const result = await sourcePool.query(`
      SELECT id, name, description, category, status, "order", created_at, updated_at
      FROM domains
      ORDER BY name
    `);

    console.log(`Found ${result.rows.length} domain(s) to migrate`);

    if (isDryRun) {
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (${row.slug})`);
      });
      stats.domains.migrated = result.rows.length;
      return true;
    }

    for (const row of result.rows) {
      // Check if domain already exists by id
      const existing = await targetPool.query(
        'SELECT id FROM domains WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.domains.skipped++;
        continue;
      }

      // Insert into target
      await targetPool.query(`
        INSERT INTO domains (id, name, description, category, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        row.category || 'technology',
        row.status || 'active',
        row.order || 0,
        row.created_at,
        row.updated_at,
      ]);

      console.log(`  ✅ Migrated: ${row.name}`);
      stats.domains.migrated++;
    }

    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error migrating domains:', error.message);
    return false;
  }
}

// Step 3: Migrate Subjects
async function migrateSubjects() {
  console.log('📋 Step 3: Migrating subjects\n');

  try {
    // Fetch source subjects
    const result = await sourcePool.query(`
      SELECT s.id, s.domain_id, s.name, s.description, s.status, s."order", s.created_at, s.updated_at
      FROM subjects s
      INNER JOIN domains d ON s.domain_id = d.id
      ORDER BY s.name
    `);

    console.log(`Found ${result.rows.length} subject(s) to migrate`);

    if (isDryRun) {
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (${row.slug})`);
      });
      stats.subjects.migrated = result.rows.length;
      return true;
    }

    for (const row of result.rows) {
      // Check if subject already exists
      const existing = await targetPool.query(
        'SELECT id FROM subjects WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.subjects.skipped++;
        continue;
      }

      // Insert into target
      await targetPool.query(`
        INSERT INTO subjects (id, domain_id, name, description, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.id,
        row.domain_id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        row.status || 'active',
        row.order || 0,
        row.created_at,
        row.updated_at,
      ]);

      console.log(`  ✅ Migrated: ${row.name}`);
      stats.subjects.migrated++;
    }

    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error migrating subjects:', error.message);
    return false;
  }
}

// Step 4: Migrate Topics
async function migrateTopics() {
  console.log('📋 Step 4: Migrating topics\n');

  try {
    // Fetch source topics
    const result = await sourcePool.query(`
      SELECT t.id, t.subject_id, t.name, t.description, t.complexity, t.status, t."order", t.created_at, t.updated_at
      FROM topics t
      INNER JOIN subjects s ON t.subject_id = s.id
      ORDER BY t.name
    `);

    console.log(`Found ${result.rows.length} topic(s) to migrate`);

    if (isDryRun) {
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (${row.slug})`);
      });
      stats.topics.migrated = result.rows.length;
      return true;
    }

    for (const row of result.rows) {
      // Check if topic already exists
      const existing = await targetPool.query(
        'SELECT id FROM topics WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.topics.skipped++;
        continue;
      }

      // Insert into target
      await targetPool.query(`
        INSERT INTO topics (id, subject_id, name, description, complexity, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        row.id,
        row.subject_id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        row.complexity || 'intermediate',
        row.status || 'active',
        row.order || 0,
        row.created_at,
        row.updated_at,
      ]);

      console.log(`  ✅ Migrated: ${row.name}`);
      stats.topics.migrated++;
    }

    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error migrating topics:', error.message);
    return false;
  }
}

// Step 5: Migrate Subtopics
async function migrateSubtopics() {
  console.log('📋 Step 5: Migrating subtopics\n');

  try {
    // Fetch source subtopics
    const result = await sourcePool.query(`
      SELECT st.id, st.topic_id, st.name, st.description, st.status, st."order", st.created_at, st.updated_at
      FROM subtopics st
      INNER JOIN topics t ON st.topic_id = t.id
      ORDER BY st.name
    `);

    console.log(`Found ${result.rows.length} subtopic(s) to migrate`);

    if (isDryRun) {
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (${row.slug})`);
      });
      stats.subtopics.migrated = result.rows.length;
      return true;
    }

    for (const row of result.rows) {
      // Check if subtopic already exists
      const existing = await targetPool.query(
        'SELECT id FROM subtopics WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.subtopics.skipped++;
        continue;
      }

      // Insert into target
      await targetPool.query(`
        INSERT INTO subtopics (id, topic_id, name, description, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.id,
        row.topic_id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        row.status || 'active',
        row.order || 0,
        row.created_at,
        row.updated_at,
      ]);

      console.log(`  ✅ Migrated: ${row.name}`);
      stats.subtopics.migrated++;
    }

    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error migrating subtopics:', error.message);
    return false;
  }
}

// Print summary
function printSummary() {
  console.log('📊 Migration Summary\n');
  console.log('Domains:');
  console.log(`  Source:    ${stats.domains.source}`);
  console.log(`  Target:    ${stats.domains.target} (before migration)`);
  console.log(`  Migrated:  ${stats.domains.migrated}`);
  console.log(`  Skipped:   ${stats.domains.skipped}`);
  console.log('');
  console.log('Subjects:');
  console.log(`  Source:    ${stats.subjects.source}`);
  console.log(`  Target:    ${stats.subjects.target} (before migration)`);
  console.log(`  Migrated:  ${stats.subjects.migrated}`);
  console.log(`  Skipped:   ${stats.subjects.skipped}`);
  console.log('');
  console.log('Topics:');
  console.log(`  Source:    ${stats.topics.source}`);
  console.log(`  Target:    ${stats.topics.target} (before migration)`);
  console.log(`  Migrated:  ${stats.topics.migrated}`);
  console.log(`  Skipped:   ${stats.topics.skipped}`);
  console.log('');
  console.log('Subtopics:');
  console.log(`  Source:    ${stats.subtopics.source}`);
  console.log(`  Target:    ${stats.subtopics.target} (before migration)`);
  console.log(`  Migrated:  ${stats.subtopics.migrated}`);
  console.log(`  Skipped:   ${stats.subtopics.skipped}`);
  console.log('');

  const totalMigrated = stats.domains.migrated + stats.subjects.migrated + 
                        stats.topics.migrated + stats.subtopics.migrated;
  console.log(`✅ Total records migrated: ${totalMigrated}\n`);
}

// Main execution
async function main() {
  try {
    // Step 1: Count records
    const counted = await countRecords();
    if (!counted) {
      process.exit(1);
    }

    // Check if there's anything to migrate
    const totalToMigrate = stats.domains.source + stats.subjects.source + 
                           stats.topics.source + stats.subtopics.source;
    
    if (totalToMigrate === 0) {
      console.log('ℹ️  No records to migrate\n');
      return;
    }

    // Confirm before proceeding (unless --force or --dry-run)
    if (!isDryRun && !isForce) {
      console.log('⚠️  This will copy data from RealTutorialHub tables to SkillHubCore tables');
      console.log('⚠️  Existing records with same IDs will be skipped\n');
      
      const answer = await promptUser('Do you want to proceed? (yes/no): ');
      if (answer !== 'yes' && answer !== 'y') {
        console.log('\n❌ Migration cancelled\n');
        return;
      }
      console.log('');
    }

    // Step 2-5: Migrate data
    const migratedDomains = await migrateDomains();
    if (!migratedDomains) {
      console.error('❌ Domain migration failed\n');
      process.exit(1);
    }

    const migratedSubjects = await migrateSubjects();
    if (!migratedSubjects) {
      console.error('❌ Subject migration failed\n');
      process.exit(1);
    }

    const migratedTopics = await migrateTopics();
    if (!migratedTopics) {
      console.error('❌ Topic migration failed\n');
      process.exit(1);
    }

    const migratedSubtopics = await migrateSubtopics();
    if (!migratedSubtopics) {
      console.error('❌ Subtopic migration failed\n');
      process.exit(1);
    }

    // Print summary
    printSummary();

    if (isDryRun) {
      console.log('🔍 Dry run completed - no changes were made\n');
      console.log('Run without --dry-run to perform the actual migration\n');
    } else {
      console.log('✅ Migration completed successfully!\n');
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run the migration
main();
