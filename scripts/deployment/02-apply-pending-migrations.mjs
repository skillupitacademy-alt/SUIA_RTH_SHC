import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function applyPendingMigrations() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE B: LEGACY DRIZZLE NORMALIZATION                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    pendingMigrations: [],
    appliedMigrations: [],
    status: 'PENDING'
  };
  
  try {
    // Check current migration state
    console.log('📋 Step 1: Checking current migration state...\n');
    
    const currentMigrations = await pool.query(`
      SELECT hash, created_at 
      FROM __drizzle_migrations 
      ORDER BY created_at ASC
    `);
    
    console.log(`   ✅ Currently applied: ${currentMigrations.rows.length} migrations`);
    currentMigrations.rows.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.hash}`);
    });
    
    // Load migration journal
    const journalPath = 'packages/db-tutorial/migrations/meta/_journal.json';
    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
    
    // Identify pending migrations
    const appliedHashes = new Set(currentMigrations.rows.map(m => m.hash));
    const pendingMigrations = journal.entries.filter(entry => !appliedHashes.has(entry.tag));
    
    report.pendingMigrations = pendingMigrations.map(m => m.tag);
    
    console.log(`\n📋 Step 2: Identified ${pendingMigrations.length} pending migrations...\n`);
    
    if (pendingMigrations.length === 0) {
      console.log('   ✅ No pending migrations - database is up to date');
      report.status = 'UP_TO_DATE';
      return report;
    }
    
    pendingMigrations.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.tag}`);
    });
    
    // Apply each pending migration
    console.log(`\n📋 Step 3: Applying pending migrations...\n`);
    
    for (const migration of pendingMigrations) {
      console.log(`   🔄 Applying: ${migration.tag}...`);
      
      const migrationPath = `packages/db-tutorial/migrations/${migration.tag}.sql`;
      
      if (!fs.existsSync(migrationPath)) {
        console.log(`   ⚠️  Migration file not found: ${migrationPath}`);
        continue;
      }
      
      // Read migration SQL
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      try {
        // Execute migration
        await pool.query(migrationSQL);
        
        // Register in tracking table
        await pool.query(`
          INSERT INTO __drizzle_migrations (hash, created_at)
          VALUES ($1, $2)
        `, [migration.tag, migration.when]);
        
        report.appliedMigrations.push({
          tag: migration.tag,
          status: 'SUCCESS',
          timestamp: new Date().toISOString()
        });
        
        console.log(`   ✅ Applied: ${migration.tag}`);
        
      } catch (err) {
        console.error(`   ❌ Failed: ${migration.tag}`);
        console.error(`   Error: ${err.message}`);
        
        report.appliedMigrations.push({
          tag: migration.tag,
          status: 'FAILED',
          error: err.message,
          timestamp: new Date().toISOString()
        });
        
        report.status = 'FAILED';
        throw new Error(`Migration ${migration.tag} failed: ${err.message}`);
      }
    }
    
    // Verify final state
    console.log(`\n📋 Step 4: Verifying migration state...\n`);
    
    const finalMigrations = await pool.query(`
      SELECT hash, created_at 
      FROM __drizzle_migrations 
      ORDER BY created_at ASC
    `);
    
    console.log(`   ✅ Total applied migrations: ${finalMigrations.rows.length}`);
    
    report.status = 'SUCCESS';
    report.finalMigrationCount = finalMigrations.rows.length;
    
    // Save report
    const reportPath = `scripts/deployment/reports/legacy-normalization-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.mkdirSync('scripts/deployment/reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  LEGACY NORMALIZATION COMPLETE                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    console.log('\n📊 NORMALIZATION SUMMARY:');
    console.log(`   ✅ Pending migrations: ${report.pendingMigrations.length}`);
    console.log(`   ✅ Applied migrations: ${report.appliedMigrations.length}`);
    console.log(`   ✅ Total migrations: ${report.finalMigrationCount}`);
    console.log(`   ✅ Status: ${report.status}`);
    console.log(`\n📄 Report: ${reportPath}\n`);
    
    console.log('⏭️  READY FOR PHASE C: Modular Foundation Deployment\n');
    
    return report;
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    report.status = 'FAILED';
    report.error = err.message;
    throw err;
  } finally {
    await pool.end();
  }
}

applyPendingMigrations().catch(console.error);
