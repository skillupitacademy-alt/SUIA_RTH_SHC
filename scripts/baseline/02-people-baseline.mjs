import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_PEOPLE });

async function generateBaseline() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `scripts/baseline/reports/people-baseline-${timestamp}.json`;
  
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  PEOPLE DATABASE PRODUCTION BASELINE SNAPSHOT             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    const baseline = {
      database: 'people_prod',
      timestamp: new Date().toISOString(),
    };
    
    // 1. TABLES
    console.log('📊 Auditing Tables...');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    baseline.tables = {
      count: tables.rows.length,
      list: tables.rows.map(r => r.table_name)
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
    
    console.log(`   ✅ Total rows: ${Object.values(rowCounts).reduce((s, c) => typeof c === 'number' ? s + c : s, 0).toLocaleString()}`);
    
    // 3. ANOMALY DETECTION
    console.log('\n🔍 Detecting Anomalies...');
    
    const unexpectedTables = ['domains', 'subjects', 'topics', 'subtopics'].filter(t => 
      baseline.tables.list.includes(t)
    );
    
    baseline.anomalies = {
      unexpectedDomainTables: {
        found: unexpectedTables.length > 0,
        tables: unexpectedTables,
        rowCounts: unexpectedTables.reduce((acc, t) => {
          acc[t] = rowCounts[t];
          return acc;
        }, {}),
        risk: unexpectedTables.length > 0 ? 'HIGH - Potential duplication with quiz DB' : 'NONE'
      }
    };
    
    if (unexpectedTables.length > 0) {
      console.log(`   ⚠️  ANOMALY: Found unexpected domain tables: ${unexpectedTables.join(', ')}`);
      console.log(`   📊 Row counts:`, baseline.anomalies.unexpectedDomainTables.rowCounts);
    } else {
      console.log(`   ✅ No unexpected domain tables`);
    }
    
    // 4. BRAND ANALYSIS
    console.log('\n🏢 Analyzing Brand Partitioning...');
    
    if (baseline.tables.list.includes('users')) {
      const platformDist = await pool.query(`
        SELECT platform, COUNT(*) as count
        FROM users
        WHERE deleted_at IS NULL
        GROUP BY platform
      `);
      
      baseline.brandAnalysis = {
        usersByPlatform: platformDist.rows.reduce((acc, row) => {
          acc[row.platform] = parseInt(row.count);
          return acc;
        }, {}),
        totalActiveUsers: platformDist.rows.reduce((sum, row) => sum + parseInt(row.count), 0)
      };
      
      console.log(`   ✅ Users by platform:`, baseline.brandAnalysis.usersByPlatform);
    }
    
    // 5. ENUMS
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
    
    // 6. SAVE BASELINE
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
