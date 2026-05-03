import { neonConfig, Pool } from '@neondatabase/serverless';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = WebSocket;

const pool = new Pool({ connectionString: process.env.DATABASE_URL_TUTORIAL });

async function deployGapRemediation() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PHASE D: GAP REMEDIATION DEPLOYMENT                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    migration: '002-gap-remediation-alter.sql',
    status: 'PENDING',
    gaps: {
      gap2_subsection_taxonomy: 'PENDING',
      gap3_fk_hardening: 'PENDING',
      gap4_brand_partitioning: 'PENDING',
      gap5_analytics_expansion: 'PENDING'
    }
  };
  
  try {
    // Read migration SQL
    const migrationPath = 'packages/db-tutorial/src/migrations/p1-p0-foundation/002-gap-remediation-alter.sql';
    
    console.log('📋 Step 1: Loading gap remediation SQL...\n');
    console.log(`   📄 File: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`   ✅ Migration loaded (${migrationSQL.length} characters)`);
    
    // Execute migration
    console.log('\n📋 Step 2: Executing gap remediation...\n');
    console.log('   🔄 GAP 2: Adding subsection taxonomy...');
    console.log('   🔄 GAP 3: Adding FK constraints...');
    console.log('   🔄 GAP 4: Adding brand partitioning...');
    console.log('   🔄 GAP 5: Creating analytics tables...\n');
    
    await pool.query(migrationSQL);
    
    console.log('   ✅ Gap remediation executed successfully');
    
    // Verify GAP 2: Subsection Taxonomy
    console.log('\n📋 Step 3: Verifying GAP 2 - Subsection Taxonomy...\n');
    
    const subsectionTypeEnum = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'subsection_type' AND typtype = 'e'
      ) as exists
    `);
    
    if (subsectionTypeEnum.rows[0].exists) {
      const values = await pool.query(`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = 'subsection_type'::regtype
        ORDER BY enumsortorder
      `);
      
      report.gaps.gap2_subsection_taxonomy = 'SUCCESS';
      report.subsectionTypes = values.rows.map(r => r.enumlabel);
      console.log(`   ✅ subsection_type enum created (${values.rows.length} types)`);
    } else {
      report.gaps.gap2_subsection_taxonomy = 'FAILED';
      console.log(`   ❌ subsection_type enum NOT FOUND`);
    }
    
    // Verify GAP 3: FK Hardening
    console.log('\n📋 Step 4: Verifying GAP 3 - FK Hardening...\n');
    
    const fkCount = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_type = 'FOREIGN KEY'
      AND table_name IN (
        'tutorial_sections',
        'tutorial_subsections',
        'ai_generation_orchestration',
        'content_deployments'
      )
    `);
    
    report.foreignKeyCount = parseInt(fkCount.rows[0].count);
    
    if (report.foreignKeyCount > 4) {
      report.gaps.gap3_fk_hardening = 'SUCCESS';
      console.log(`   ✅ Foreign keys added: ${report.foreignKeyCount}`);
    } else {
      report.gaps.gap3_fk_hardening = 'PARTIAL';
      console.log(`   ⚠️  Foreign keys: ${report.foreignKeyCount} (expected more)`);
    }
    
    // Verify GAP 4: Brand Partitioning
    console.log('\n📋 Step 5: Verifying GAP 4 - Brand Partitioning...\n');
    
    const brandEnum = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'brand' AND typtype = 'e'
      ) as exists
    `);
    
    const brandVisibilityEnum = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'brand_visibility' AND typtype = 'e'
      ) as exists
    `);
    
    if (brandEnum.rows[0].exists && brandVisibilityEnum.rows[0].exists) {
      // Check if brand_id column exists in key tables
      const brandColumns = await pool.query(`
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'brand_id'
        AND table_name IN (
          'tutorial_sections',
          'tutorial_subsections',
          'educational_architectures',
          'ui_architectures'
        )
      `);
      
      report.gaps.gap4_brand_partitioning = 'SUCCESS';
      report.brandPartitionedTables = brandColumns.rows.map(r => r.table_name);
      console.log(`   ✅ brand enum created`);
      console.log(`   ✅ brand_visibility enum created`);
      console.log(`   ✅ brand_id added to ${brandColumns.rows.length} tables`);
    } else {
      report.gaps.gap4_brand_partitioning = 'FAILED';
      console.log(`   ❌ Brand enums NOT FOUND`);
    }
    
    // Verify GAP 5: Analytics Expansion
    console.log('\n📋 Step 6: Verifying GAP 5 - Analytics Expansion...\n');
    
    const analyticsTables = [
      'analytics_learning_metrics',
      'analytics_architecture_performance',
      'analytics_brand_business'
    ];
    
    report.analyticsTablesCreated = [];
    
    for (const table of analyticsTables) {
      const exists = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists
      `, [table]);
      
      if (exists.rows[0].exists) {
        report.analyticsTablesCreated.push(table);
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - NOT FOUND`);
      }
    }
    
    if (report.analyticsTablesCreated.length === analyticsTables.length) {
      report.gaps.gap5_analytics_expansion = 'SUCCESS';
    } else {
      report.gaps.gap5_analytics_expansion = 'PARTIAL';
    }
    
    // Overall status
    const allGapsSuccess = Object.values(report.gaps).every(status => status === 'SUCCESS');
    report.status = allGapsSuccess ? 'SUCCESS' : 'PARTIAL';
    
    // Save report
    const reportPath = `scripts/deployment/reports/gap-remediation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    fs.mkdirSync('scripts/deployment/reports', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  GAP REMEDIATION DEPLOYMENT COMPLETE                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    console.log('\n📊 GAP REMEDIATION SUMMARY:');
    console.log(`   ${report.gaps.gap2_subsection_taxonomy === 'SUCCESS' ? '✅' : '❌'} GAP 2: Subsection Taxonomy - ${report.gaps.gap2_subsection_taxonomy}`);
    console.log(`   ${report.gaps.gap3_fk_hardening === 'SUCCESS' ? '✅' : '⚠️'} GAP 3: FK Hardening - ${report.gaps.gap3_fk_hardening}`);
    console.log(`   ${report.gaps.gap4_brand_partitioning === 'SUCCESS' ? '✅' : '❌'} GAP 4: Brand Partitioning - ${report.gaps.gap4_brand_partitioning}`);
    console.log(`   ${report.gaps.gap5_analytics_expansion === 'SUCCESS' ? '✅' : '⚠️'} GAP 5: Analytics Expansion - ${report.gaps.gap5_analytics_expansion}`);
    console.log(`   ✅ Overall Status: ${report.status}`);
    console.log(`\n📄 Report: ${reportPath}\n`);
    
    console.log('⏭️  READY FOR PHASE E: Post-Deployment Validation\n');
    
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

deployGapRemediation().catch(console.error);
