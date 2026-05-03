import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function deployModularFoundation() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE C: MODULAR FOUNDATION DEPLOYMENT                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    migration: '001-create-modular-schema.sql',
    status: 'PENDING',
    tablesCreated: [],
    enumsCreated: [],
    indexesCreated: 0
  };
  
  try {
    // Read migration SQL
    const migrationPath = 'packages/db-tutorial/src/migrations/p1-p0-foundation/001-create-modular-schema.sql';
    
    console.log('📋 Step 1: Loading migration SQL...\n');
    console.log(`   📄 File: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`   ✅ Migration loaded (${migrationSQL.length} characters)`);
    
    // Execute migration
    console.log('\n📋 Step 2: Executing modular schema deployment...\n');
    console.log('   🔄 Creating enums...');
    console.log('   🔄 Creating tables...');
    console.log('   🔄 Creating indexes...');
    console.log('   🔄 Creating foreign keys...\n');
    
    await pool.query(migrationSQL);
    
    console.log('   ✅ Migration executed successfully');
    
    // Verify deployment
    console.log('\n📋 Step 3: Verifying modular tables...\n');
    
    const expectedTables = [
      'tutorial_sections',
      'tutorial_subsections',
      'educational_architectures',
      'ui_architectures',
      'ai_generation_orchestration',
      'ai_section_generation_jobs',
      'prompt_templates',
      'content_review_queue',
      'content_deployments',
      'ai_generation_metrics'
    ];
    
    for (const table of expectedTables) {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [table]);
      
      if (exists.rows[0].exists) {
        report.tablesCreated.push(table);
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - NOT FOUND`);
      }
    }
    
    // Verify enums
    console.log('\n📋 Step 4: Verifying enums...\n');
    
    const expectedEnums = [
      'section_type',
      'section_status',
      'deployment_type',
      'orchestration_status',
      'job_status',
      'review_status',
      'priority_level'
    ];
    
    for (const enumName of expectedEnums) {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = $1 AND typtype = 'e'
        ) as exists
      `, [enumName]);
      
      if (exists.rows[0].exists) {
        report.enumsCreated.push(enumName);
        console.log(`   ✅ ${enumName}`);
      } else {
        console.log(`   ❌ ${enumName} - NOT FOUND`);
      }
    }
    
    // Count indexes
    console.log('\n📋 Step 5: Counting indexes...\n');
    
    const indexes = await pool.query(`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = ANY($1)
    `, [expectedTables]);
    
    report.indexesCreated = parseInt(indexes.rows[0].count);
    console.log(`   ✅ Indexes created: ${report.indexesCreated}`);
    
    // Verify foreign keys
    console.log('\n📋 Step 6: Verifying foreign keys...\n');
    
    const fks = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = ANY($1)
    `, [expectedTables]);
    
    report.foreignKeysCreated = parseInt(fks.rows[0].count);
    console.log(`   ✅ Foreign keys created: ${report.foreignKeysCreated}`);
    
    // Final validation
    const allTablesCreated = report.tablesCreated.length === expectedTables.length;
    const allEnumsCreated = report.enumsCreated.length === expectedEnums.length;
    
    if (allTablesCreated && allEnumsCreated) {
      report.status = 'SUCCESS';
    } else {
      report.status = 'PARTIAL';
    }
    
    // Save report
    const reportPath = `scripts/deployment/reports/modular-foundation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.mkdirSync('scripts/deployment/reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  MODULAR FOUNDATION DEPLOYMENT COMPLETE                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    console.log('\n📊 DEPLOYMENT SUMMARY:');
    console.log(`   ✅ Tables created: ${report.tablesCreated.length}/${expectedTables.length}`);
    console.log(`   ✅ Enums created: ${report.enumsCreated.length}/${expectedEnums.length}`);
    console.log(`   ✅ Indexes created: ${report.indexesCreated}`);
    console.log(`   ✅ Foreign keys created: ${report.foreignKeysCreated}`);
    console.log(`   ✅ Status: ${report.status}`);
    console.log(`\n📄 Report: ${reportPath}\n`);
    
    console.log('⏭️  READY FOR PHASE D: Gap Remediation Deployment\n');
    
    return report;
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    report.status = 'FAILED';
    report.error = err.message;
    throw err;
  } finally {
    await pool.end();
  }
}

deployModularFoundation().catch(console.error);
