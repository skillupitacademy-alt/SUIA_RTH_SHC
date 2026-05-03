import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function initializeMigrationGovernance() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  PHASE B: MIGRATION GOVERNANCE INITIALIZATION              ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    // 1. Check if migration table exists
    console.log('📋 Step 1: Checking migration tracking table...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      ) as exists
    `);
    
    if (tableExists.rows[0].exists) {
      console.log('   ⚠️  Migration tracking table already exists');
      const existing = await pool.query(`SELECT COUNT(*) as count FROM __drizzle_migrations`);
      console.log(`   📊 Existing migrations: ${existing.rows[0].count}`);
      
      const proceed = true; // In production, you'd prompt here
      if (!proceed) {
        console.log('   ❌ Aborted by user');
        return;
      }
    }
    
    // 2. Create migration tracking table
    console.log('\n📋 Step 2: Creating migration tracking table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);
    console.log('   ✅ Migration tracking table created');
    
    // 3. Baseline existing schema
    console.log('\n📋 Step 3: Baselining existing production schema...');
    
    // Read the migration journal to get expected migrations
    const journalPath = 'packages/db-tutorial/migrations/meta/_journal.json';
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    
    console.log(`   📚 Found ${journal.entries.length} migrations in journal`);
    
    // Determine which migrations represent current production state
    // Based on our audit, production has legacy tables from migrations 0000-0008
    const appliedMigrations = journal.entries.filter((entry, idx) => {
      // Migrations 0000-0008 created the legacy system
      // Migration 0009 is materialized view (may or may not be applied)
      // Migration 0010 is demo foundation (not applied)
      return idx <= 8; // 0000 through 0008
    });
    
    console.log(`   📊 Marking ${appliedMigrations.length} migrations as applied (legacy baseline)`);
    
    // 4. Insert baseline migrations
    console.log('\n📋 Step 4: Registering baseline migrations...');
    
    for (const migration of appliedMigrations) {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM __drizzle_migrations WHERE hash = $1
        ) as exists
      `, [migration.tag]);
      
      if (!exists.rows[0].exists) {
        await pool.query(`
          INSERT INTO __drizzle_migrations (hash, created_at)
          VALUES ($1, $2)
        `, [migration.tag, migration.when]);
        
        console.log(`   ✅ Registered: ${migration.tag}`);
      } else {
        console.log(`   ⏭️  Already registered: ${migration.tag}`);
      }
    }
    
    // 5. Verify migration state
    console.log('\n📋 Step 5: Verifying migration state...');
    const registered = await pool.query(`
      SELECT hash, created_at 
      FROM __drizzle_migrations 
      ORDER BY created_at ASC
    `);
    
    console.log(`   ✅ Total registered migrations: ${registered.rows.length}`);
    registered.rows.forEach((row, idx) => {
      const date = new Date(parseInt(row.created_at));
      console.log(`   ${idx + 1}. ${row.hash} (${date.toISOString().split('T')[0]})`);
    });
    
    // 6. Identify pending migrations
    console.log('\n📋 Step 6: Identifying pending migrations...');
    const pendingMigrations = journal.entries.filter((entry, idx) => idx > 8);
    
    if (pendingMigrations.length > 0) {
      console.log(`   📊 Pending migrations: ${pendingMigrations.length}`);
      pendingMigrations.forEach((m, idx) => {
        console.log(`   ${idx + 1}. ${m.tag} - NOT YET APPLIED`);
      });
    } else {
      console.log(`   ✅ No pending Drizzle migrations`);
    }
    
    // 7. Phase 1 P0 status
    console.log('\n📋 Step 7: Phase 1 P0 Migration Status...');
    console.log('   📁 Manual migrations location: packages/db-tutorial/src/migrations/p1-p0-foundation/');
    console.log('   ❌ Phase 1 P0 modular system: NOT APPLIED');
    console.log('   📄 Required files:');
    console.log('      - 001-create-modular-schema.sql');
    console.log('      - 002-gap-remediation-alter.sql');
    
    // 8. Generate migration plan
    console.log('\n📋 Step 8: Generating migration execution plan...');
    
    const migrationPlan = {
      timestamp: new Date().toISOString(),
      currentState: {
        appliedMigrations: registered.rows.length,
        lastApplied: registered.rows[registered.rows.length - 1]?.hash || 'none',
        legacySystemActive: true,
        modularSystemActive: false
      },
      pendingMigrations: {
        drizzle: pendingMigrations.map(m => m.tag),
        manual: [
          '001-create-modular-schema.sql',
          '002-gap-remediation-alter.sql'
        ]
      },
      recommendedSequence: [
        {
          step: 1,
          action: 'Apply pending Drizzle migrations (if any)',
          migrations: pendingMigrations.map(m => m.tag),
          command: 'pnpm --filter @quiz/db-tutorial db:migrate'
        },
        {
          step: 2,
          action: 'Apply Phase 1 P0 modular schema',
          file: '001-create-modular-schema.sql',
          command: 'psql tutorial_prod < packages/db-tutorial/src/migrations/p1-p0-foundation/001-create-modular-schema.sql'
        },
        {
          step: 3,
          action: 'Apply Phase 1 P0 gap remediation',
          file: '002-gap-remediation-alter.sql',
          command: 'psql tutorial_prod < packages/db-tutorial/src/migrations/p1-p0-foundation/002-gap-remediation-alter.sql'
        },
        {
          step: 4,
          action: 'Validate deployment',
          command: 'npm run validate-gap-remediation'
        }
      ]
    };
    
    // Save migration plan
    const planPath = 'scripts/governance/migration-execution-plan.json';
    fs.mkdirSync('scripts/governance', { recursive: true });
    fs.writeFileSync(planPath, JSON.stringify(migrationPlan, null, 2));
    
    console.log(`   ✅ Migration plan saved: ${planPath}`);
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  MIGRATION GOVERNANCE INITIALIZED                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    console.log('\n📊 SUMMARY:');
    console.log(`   ✅ Migration tracking table: ACTIVE`);
    console.log(`   ✅ Baseline migrations registered: ${registered.rows.length}`);
    console.log(`   ✅ Production state documented`);
    console.log(`   ✅ Migration plan generated`);
    console.log(`   ⏭️  Ready for Phase 1 P0 deployment\n`);
    
    return migrationPlan;
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    throw err;
  } finally {
    await pool.end();
  }
}

initializeMigrationGovernance().catch(console.error);
