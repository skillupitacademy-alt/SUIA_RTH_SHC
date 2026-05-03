import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function generateBaseline() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `scripts/baseline/reports/tutorial-baseline-${timestamp}.json`;
  
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  TUTORIAL DATABASE PRODUCTION BASELINE SNAPSHOT           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const baseline = {
      database: 'tutorial_prod',
      timestamp: new Date().toISOString(),
      connection: process.env.DATABASE_URL_TUTORIAL?.split('@')[1]?.split('/')[0] || 'unknown',
    };
    
    // 1. TABLES
    console.log('📊 Auditing Tables...');
    const tables = await pool.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    baseline.tables = {
      count: tables.rows.length,
      list: tables.rows.map(r => r.table_name),
      details: tables.rows
    };
    
    console.log(`   ✅ Found ${tables.rows.length} tables`);
    
    // 2. ROW COUNTS
    console.log('\n📈 Counting Rows...');
    const rowCounts = {};
    for (const table of tables.rows) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
        rowCounts[table.table_name] = parseInt(result.rows[0].count);
      } catch (err) {
        rowCounts[table.table_name] = `ERROR: ${err.message}`;
      }
    }
    baseline.rowCounts = rowCounts;
    
    const totalRows = Object.values(rowCounts).reduce((sum, count) => 
      typeof count === 'number' ? sum + count : sum, 0
    );
    console.log(`   ✅ Total rows across all tables: ${totalRows.toLocaleString()}`);
    
    // 3. ENUMS
    console.log('\n🔤 Auditing Enums...');
    const enums = await pool.query(`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typtype = 'e'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    
    baseline.enums = {
      count: enums.rows.length,
      details: enums.rows.reduce((acc, row) => {
        acc[row.enum_name] = row.values;
        return acc;
      }, {})
    };
    
    console.log(`   ✅ Found ${enums.rows.length} enums`);
    
    // 4. INDEXES
    console.log('\n🔍 Auditing Indexes...');
    const indexes = await pool.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);
    
    baseline.indexes = {
      count: indexes.rows.length,
      byTable: indexes.rows.reduce((acc, idx) => {
        if (!acc[idx.tablename]) acc[idx.tablename] = [];
        acc[idx.tablename].push({
          name: idx.indexname,
          definition: idx.indexdef
        });
        return acc;
      }, {})
    };
    
    console.log(`   ✅ Found ${indexes.rows.length} indexes`);
    
    // 5. FOREIGN KEYS
    console.log('\n🔗 Auditing Foreign Keys...');
    const fks = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name, kcu.column_name
    `);
    
    baseline.foreignKeys = {
      count: fks.rows.length,
      details: fks.rows
    };
    
    console.log(`   ✅ Found ${fks.rows.length} foreign key constraints`);
    
    // 6. UNIQUE CONSTRAINTS
    console.log('\n🔐 Auditing Unique Constraints...');
    const uniques = await pool.query(`
      SELECT
        tc.table_name,
        tc.constraint_name,
        array_agg(kcu.column_name) as columns
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `);
    
    baseline.uniqueConstraints = {
      count: uniques.rows.length,
      details: uniques.rows
    };
    
    console.log(`   ✅ Found ${uniques.rows.length} unique constraints`);
    
    // 7. MIGRATION TRACKING
    console.log('\n📋 Checking Migration Tracking...');
    const migrationTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      ) as exists
    `);
    
    baseline.migrationTracking = {
      exists: migrationTableExists.rows[0].exists,
      appliedMigrations: []
    };
    
    if (migrationTableExists.rows[0].exists) {
      const migrations = await pool.query(`
        SELECT id, hash, created_at 
        FROM __drizzle_migrations 
        ORDER BY created_at ASC
      `);
      baseline.migrationTracking.appliedMigrations = migrations.rows;
      console.log(`   ✅ Migration tracking active: ${migrations.rows.length} migrations applied`);
    } else {
      console.log(`   ⚠️  Migration tracking NOT FOUND`);
    }
    
    // 8. SCHEMA ANALYSIS
    console.log('\n🔬 Analyzing Schema Patterns...');
    
    const legacyTables = baseline.tables.list.filter(t => 
      t.startsWith('tutorial_') && !t.includes('_v2')
    );
    
    const modularTables = baseline.tables.list.filter(t => 
      ['tutorial_sections', 'tutorial_subsections', 'educational_architectures', 
       'ui_architectures', 'ai_generation_orchestration'].includes(t)
    );
    
    const analyticsTables = baseline.tables.list.filter(t => 
      t.includes('analytics_') || t.includes('_metrics')
    );
    
    baseline.schemaAnalysis = {
      legacySystem: {
        tables: legacyTables,
        count: legacyTables.length,
        totalRows: legacyTables.reduce((sum, t) => sum + (rowCounts[t] || 0), 0)
      },
      modularSystem: {
        tables: modularTables,
        count: modularTables.length,
        deployed: modularTables.length > 0,
        totalRows: modularTables.reduce((sum, t) => sum + (rowCounts[t] || 0), 0)
      },
      analyticsSystem: {
        tables: analyticsTables,
        count: analyticsTables.length,
        deployed: analyticsTables.length > 0
      }
    };
    
    console.log(`   ✅ Legacy system: ${legacyTables.length} tables, ${baseline.schemaAnalysis.legacySystem.totalRows.toLocaleString()} rows`);
    console.log(`   ${modularTables.length > 0 ? '✅' : '❌'} Modular system: ${modularTables.length} tables`);
    console.log(`   ${analyticsTables.length > 0 ? '✅' : '❌'} Analytics system: ${analyticsTables.length} tables`);
    
    // 9. SAVE BASELINE
    fs.mkdirSync('scripts/baseline/reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(baseline, null, 2));
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  BASELINE SNAPSHOT COMPLETE                                ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n📄 Report saved: ${reportPath}\n`);
    
    return baseline;
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

generateBaseline().catch(console.error);
