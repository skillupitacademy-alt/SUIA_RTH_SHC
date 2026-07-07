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
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const targetPool = new Pool({
  connectionString: targetDatabaseUrl,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test connections immediately
async function testConnections() {
  console.log('🔄 Educational Hierarchy Data Migration\n');
  console.log('📂 Source database: quiz_platform_prod');
  console.log('   Connection:', sourceDatabaseUrl.replace(/:[^:]*@/, ':****@'));
  
  try {
    const sourceClient = await sourcePool.connect();
    const sourceDb = await sourceClient.query('SELECT current_database()');
    console.log('   ✅ Connected to:', sourceDb.rows[0].current_database);
    sourceClient.release();
  } catch (error) {
    console.error('   ❌ Connection failed:', error.message);
    process.exit(1);
  }
  
  console.log('📂 Target database: tutorial_prod');
  console.log('   Connection:', targetDatabaseUrl.replace(/:[^:]*@/, ':****@'));
  
  try {
    const targetClient = await targetPool.connect();
    const targetDb = await targetClient.query('SELECT current_database()');
    console.log('   ✅ Connected to:', targetDb.rows[0].current_database);
    targetClient.release();
  } catch (error) {
    console.error('   ❌ Connection failed:', error.message);
    process.exit(1);
  }
  
  console.log('');
}

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
}

// Statistics
const stats = {
  domains: { source: 0, target: 0, migrated: 0, skipped: 0 },
  subjects: { source: 0, target: 0, migrated: 0, skipped: 0 },
  topics: { source: 0, target: 0, migrated: 0, skipped: 0 },
  subtopics: { source: 0, target: 0, migrated: 0, skipped: 0 },
  skills: { source: 0, target: 0, migrated: 0, skipped: 0 },
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
    // Count source records with explicit client
    const sourceClient = await sourcePool.connect();
    
    try {
      console.log('Querying source domains...');
      const sourceDomains = await sourceClient.query('SELECT COUNT(*) as count FROM domains');
      stats.domains.source = parseInt(sourceDomains.rows[0].count);
      console.log(`Found ${stats.domains.source} domains`);

      const sourceSubjects = await sourceClient.query('SELECT COUNT(*) as count FROM subjects');
      stats.subjects.source = parseInt(sourceSubjects.rows[0].count);

      const sourceTopics = await sourceClient.query('SELECT COUNT(*) as count FROM topics');
      stats.topics.source = parseInt(sourceTopics.rows[0].count);

      const sourceSubtopics = await sourceClient.query('SELECT COUNT(*) as count FROM subtopics');
      stats.subtopics.source = parseInt(sourceSubtopics.rows[0].count);

      const sourceSkills = await sourceClient.query('SELECT COUNT(*) as count FROM skills');
      stats.skills.source = parseInt(sourceSkills.rows[0].count);
    } finally {
      sourceClient.release();
    }

    // Count target records with explicit client
    const targetClient = await targetPool.connect();
    
    try {
      const targetDomains = await targetClient.query('SELECT COUNT(*) as count FROM domains WHERE deleted_at IS NULL');
      stats.domains.target = parseInt(targetDomains.rows[0].count);

      const targetSubjects = await targetClient.query('SELECT COUNT(*) as count FROM subjects WHERE deleted_at IS NULL');
      stats.subjects.target = parseInt(targetSubjects.rows[0].count);

      const targetTopics = await targetClient.query('SELECT COUNT(*) as count FROM topics WHERE deleted_at IS NULL');
      stats.topics.target = parseInt(targetTopics.rows[0].count);

      const targetSubtopics = await targetClient.query('SELECT COUNT(*) as count FROM subtopics WHERE deleted_at IS NULL');
      stats.subtopics.target = parseInt(targetSubtopics.rows[0].count);

      const targetSkills = await targetClient.query('SELECT COUNT(*) as count FROM skills WHERE deleted_at IS NULL');
      stats.skills.target = parseInt(targetSkills.rows[0].count);
    } finally {
      targetClient.release();
    }

    console.log('Source Records (quiz_platform_prod):');
    console.log(`  domains:    ${stats.domains.source}`);
    console.log(`  subjects:   ${stats.subjects.source}`);
    console.log(`  topics:     ${stats.topics.source}`);
    console.log(`  subtopics:  ${stats.subtopics.source}`);
    console.log(`  skills:     ${stats.skills.source}`);
    console.log('');
    console.log('Target Records (tutorial_prod / SkillHubCore):');
    console.log(`  domains:    ${stats.domains.target}`);
    console.log(`  subjects:   ${stats.subjects.target}`);
    console.log(`  topics:     ${stats.topics.target}`);
    console.log(`  subtopics:  ${stats.subtopics.target}`);
    console.log(`  skills:     ${stats.skills.target}`);
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

  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    // Fetch source domains
    const result = await sourceClient.query(`
      SELECT id, name, description, category, status, created_at, updated_at
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
      const existing = await targetClient.query(
        'SELECT id FROM domains WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.domains.skipped++;
        continue;
      }

      // Insert into target (normalize category to lowercase and map to valid enum)
      const categoryMapping = {
        'technology': 'technical',
        'academic': 'academic',
        'professional': 'professional',
        'creative': 'creative',
        'life skills': 'life_skills',
      };
      const normalizedCategory = (row.category || 'technology').toLowerCase();
      const mappedCategory = categoryMapping[normalizedCategory] || 'technical';
      
      await targetClient.query(`
        INSERT INTO domains (id, name, description, category, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        mappedCategory,
        (row.status || 'active').toLowerCase(),  // Normalize to lowercase
        0,  // Default order
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
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

// Step 3: Migrate Subjects
async function migrateSubjects() {
  console.log('📋 Step 3: Migrating subjects\n');

  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    // Fetch source subjects
    const result = await sourceClient.query(`
      SELECT s.id, s.domain_id, s.name, s.description, s.status, s.created_at, s.updated_at
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
      const existing = await targetClient.query(
        'SELECT id FROM subjects WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.subjects.skipped++;
        continue;
      }

      // Insert into target (normalize status to lowercase)
      await targetClient.query(`
        INSERT INTO subjects (id, domain_id, name, description, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.id,
        row.domain_id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        (row.status || 'active').toLowerCase(),  // Normalize to lowercase
        0,  // Default order
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
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

// Step 4: Migrate Topics
async function migrateTopics() {
  console.log('📋 Step 4: Migrating topics\n');

  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    // Fetch source topics
    const result = await sourceClient.query(`
      SELECT t.id, t.subject_id, t.name, t.description, t.status, t.created_at, t.updated_at
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
      const existing = await targetClient.query(
        'SELECT id FROM topics WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.topics.skipped++;
        continue;
      }

      // Insert into target (normalize complexity and status to lowercase)
      await targetClient.query(`
        INSERT INTO topics (id, subject_id, name, description, complexity, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        row.id,
        row.subject_id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        (row.complexity || 'intermediate').toLowerCase(),  // Normalize to lowercase
        (row.status || 'active').toLowerCase(),  // Normalize to lowercase
        0,  // Default order
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
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

// Step 5: Migrate Subtopics
async function migrateSubtopics() {
  console.log('📋 Step 5: Migrating subtopics\n');

  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    // Fetch source subtopics (no status or updated_at columns in source)
    const result = await sourceClient.query(`
      SELECT st.id, st.topic_id, st.name, st.description, st.created_at
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
      const existing = await targetClient.query(
        'SELECT id FROM subtopics WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.subtopics.skipped++;
        continue;
      }

      // Insert into target (use created_at for updated_at, default status to 'active')
      await targetClient.query(`
        INSERT INTO subtopics (id, topic_id, name, description, status, "order", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        row.id,
        row.topic_id,
        row.name,
        row.description || `Migrated from quiz_platform_prod`,
        'active',  // Default status
        0,  // Default order
        row.created_at,
        row.created_at,  // Use created_at as updated_at
      ]);

      console.log(`  ✅ Migrated: ${row.name}`);
      stats.subtopics.migrated++;
    }

    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error migrating subtopics:', error.message);
    return false;
  } finally {
    sourceClient.release();
    targetClient.release();
  }
}

// Step 6: Migrate Skills
async function migrateSkills() {
  console.log('📋 Step 6: Migrating skills\n');

  const sourceClient = await sourcePool.connect();
  const targetClient = await targetPool.connect();
  
  try {
    // Fetch source skills
    const result = await sourceClient.query(`
      SELECT id, name, category, weight, created_at, updated_at
      FROM skills
      ORDER BY name
    `);

    console.log(`Found ${result.rows.length} skill(s) to migrate`);

    if (isDryRun) {
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.name} (${row.category})`);
      });
      stats.skills.migrated = result.rows.length;
      return true;
    }

    for (const row of result.rows) {
      // Check if skill already exists
      const existing = await targetClient.query(
        'SELECT id FROM skills WHERE id = $1',
        [row.id]
      );

      if (existing.rows.length > 0) {
        console.log(`  ⏭️  Skipped: ${row.name} (already exists)`);
        stats.skills.skipped++;
        continue;
      }

      // Insert into target (normalize and map category to valid enum)
      const categoryMapping = {
        'technical': 'technical',
        'cognitive': 'analytical',  // Map cognitive to analytical
        'process': 'managerial',  // Map process to managerial
        'soft': 'soft',
        'analytical': 'analytical',
        'creative': 'creative',
        'managerial': 'managerial',
        'communication': 'communication',
      };
      const normalizedCategory = (row.category || 'technical').toLowerCase();
      const mappedCategory = categoryMapping[normalizedCategory] || 'technical';
      
      await targetClient.query(`
        INSERT INTO skills (id, name, category, weight, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        row.id,
        row.name,
        mappedCategory,
        Math.min(row.weight || 5, 9.99),  // Cap weight at 9.99 (max for decimal(3,2))
        'active',  // Default status
        row.created_at,
        row.updated_at,
      ]);

      console.log(`  ✅ Migrated: ${row.name}`);
      stats.skills.migrated++;
    }

    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error migrating skills:', error.message);
    return false;
  } finally {
    sourceClient.release();
    targetClient.release();
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
  console.log('Skills:');
  console.log(`  Source:    ${stats.skills.source}`);
  console.log(`  Target:    ${stats.skills.target} (before migration)`);
  console.log(`  Migrated:  ${stats.skills.migrated}`);
  console.log(`  Skipped:   ${stats.skills.skipped}`);
  console.log('');

  const totalMigrated = stats.domains.migrated + stats.subjects.migrated + 
                        stats.topics.migrated + stats.subtopics.migrated +
                        stats.skills.migrated;
  console.log(`✅ Total records migrated: ${totalMigrated}\n`);
}

// Main execution
async function main() {
  try {
    // Test connections first
    await testConnections();
    
    if (isDryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n');
    }
    
    // Step 1: Count records
    const counted = await countRecords();
    if (!counted) {
      process.exit(1);
    }

    // Check if there's anything to migrate
    const totalToMigrate = stats.domains.source + stats.subjects.source + 
                           stats.topics.source + stats.subtopics.source +
                           stats.skills.source;
    
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

    const migratedSkills = await migrateSkills();
    if (!migratedSkills) {
      console.error('❌ Skill migration failed\n');
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
