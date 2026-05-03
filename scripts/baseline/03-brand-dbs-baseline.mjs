import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

async function auditBrandDB(dbName, connectionString) {
  const pool = new Pool({ connectionString });
  
  try {
    console.log(`\n📊 Auditing ${dbName}...`);
    
    const baseline = {
      database: dbName,
      timestamp: new Date().toISOString(),
    };
    
    // Tables
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    baseline.tables = tables.rows.map(r => r.table_name);
    console.log(`   ✅ Tables: ${baseline.tables.length}`);
    
    // Row counts
    const rowCounts = {};
    for (const table of tables.rows) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
        rowCounts[table.table_name] = parseInt(result.rows[0].count);
      } catch (err) {
        rowCounts[table.table_name] = 0;
      }
    }
    baseline.rowCounts = rowCounts;
    
    const totalUsers = rowCounts.users || 0;
    console.log(`   ✅ Total users: ${totalUsers.toLocaleString()}`);
    
    // Backup tables detection
    const backupTables = baseline.tables.filter(t => t.includes('backup'));
    if (backupTables.length > 0) {
      baseline.anomalies = {
        backupTables: backupTables,
        risk: 'MEDIUM - Manual backup tables found'
      };
      console.log(`   ⚠️  Backup tables found: ${backupTables.join(', ')}`);
    }
    
    return baseline;
    
  } finally {
    await pool.end();
  }
}

async function generateBaseline() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `scripts/baseline/reports/brand-dbs-baseline-${timestamp}.json`;
  
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  BRAND DATABASES PRODUCTION BASELINE SNAPSHOT             ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    const baseline = {
      timestamp: new Date().toISOString(),
      databases: {}
    };
    
    // RTH
    baseline.databases.rth = await auditBrandDB('rth_prod', process.env.DATABASE_URL_RTH);
    
    // SkillUp
    baseline.databases.skillup = await auditBrandDB('skillup_prod', process.env.DATABASE_URL_SKILLUP);
    
    // Comparison
    console.log('\n🔍 Cross-Brand Analysis...');
    const rthTables = baseline.databases.rth.tables.sort();
    const skillupTables = baseline.databases.skillup.tables.sort();
    
    const tableDiff = {
      onlyInRTH: rthTables.filter(t => !skillupTables.includes(t)),
      onlyInSkillUp: skillupTables.filter(t => !rthTables.includes(t)),
      common: rthTables.filter(t => skillupTables.includes(t))
    };
    
    baseline.crossBrandAnalysis = tableDiff;
    
    if (tableDiff.onlyInRTH.length > 0) {
      console.log(`   ⚠️  Tables only in RTH: ${tableDiff.onlyInRTH.join(', ')}`);
    }
    if (tableDiff.onlyInSkillUp.length > 0) {
      console.log(`   ⚠️  Tables only in SkillUp: ${tableDiff.onlyInSkillUp.join(', ')}`);
    }
    console.log(`   ✅ Common tables: ${tableDiff.common.length}`);
    
    // Save
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
  }
}

generateBaseline().catch(console.error);
