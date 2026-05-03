#!/usr/bin/env node
/**
 * PHASE 1 P0 - DELIVERABLE 1B
 * Phase E: Verify Analytics Tables Deployment
 * 
 * Purpose: Verify that all analytics tables from GAP 5 were created successfully
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB_URL);

async function verifyAnalyticsTables() {
  console.log('🔍 PHASE E: ANALYTICS TABLES VERIFICATION');
  console.log('==========================================\n');

  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    phase: 'PHASE_E_ANALYTICS_VERIFICATION',
    status: 'IN_PROGRESS',
    analyticsTablesExpected: [
      'tutorial_learning_metrics',
      'subsection_engagement_metrics',
      'educational_architecture_performance',
      'ui_architecture_performance',
      'prompt_template_performance',
      'brand_performance_metrics',
      'deployment_cohort_metrics',
      'revenue_attribution_metrics'
    ],
    analyticsTablesFound: [],
    analyticsTablesMissing: [],
    tableDetails: {}
  };

  try {
    // Query all tables in the public schema
    console.log('📊 Querying all tables in public schema...\n');
    
    const allTables = await sql`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    console.log(`Found ${allTables.length} total tables in database\n`);

    // Check each expected analytics table
    for (const expectedTable of report.analyticsTablesExpected) {
      const tableExists = allTables.find(t => t.table_name === expectedTable);
      
      if (tableExists) {
        console.log(`✅ ${expectedTable} - EXISTS (${tableExists.column_count} columns)`);
        report.analyticsTablesFound.push(expectedTable);
        
        // Get detailed column information
        const columns = await sql`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = ${expectedTable}
          ORDER BY ordinal_position;
        `;
        
        // Get indexes
        const indexes = await sql`
          SELECT indexname, indexdef
          FROM pg_indexes
          WHERE tablename = ${expectedTable};
        `;
        
        // Get row count using dynamic query
        const rowCountQuery = `SELECT COUNT(*) as count FROM ${expectedTable}`;
        const rowCount = await sql([rowCountQuery]);
        
        report.tableDetails[expectedTable] = {
          exists: true,
          columnCount: columns.length,
          columns: columns.map(c => ({
            name: c.column_name,
            type: c.data_type,
            nullable: c.is_nullable === 'YES',
            default: c.column_default
          })),
          indexCount: indexes.length,
          indexes: indexes.map(i => i.indexname),
          rowCount: parseInt(rowCount[0].count)
        };
      } else {
        console.log(`❌ ${expectedTable} - MISSING`);
        report.analyticsTablesMissing.push(expectedTable);
        report.tableDetails[expectedTable] = {
          exists: false
        };
      }
    }

    console.log('\n==========================================');
    console.log('📊 ANALYTICS TABLES SUMMARY');
    console.log('==========================================');
    console.log(`✅ Found: ${report.analyticsTablesFound.length}/${report.analyticsTablesExpected.length}`);
    console.log(`❌ Missing: ${report.analyticsTablesMissing.length}/${report.analyticsTablesExpected.length}`);

    if (report.analyticsTablesMissing.length === 0) {
      report.status = 'SUCCESS';
      console.log('\n✅ ALL ANALYTICS TABLES DEPLOYED SUCCESSFULLY');
    } else {
      report.status = 'PARTIAL';
      console.log('\n⚠️  SOME ANALYTICS TABLES MISSING');
      console.log('Missing tables:', report.analyticsTablesMissing.join(', '));
    }

    // Save report
    const reportPath = `scripts/deployment/reports/analytics-verification-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    return report;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    
    const reportPath = `scripts/deployment/reports/analytics-verification-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    throw error;
  }
}

// Execute
verifyAnalyticsTables()
  .then(() => {
    console.log('\n✅ Analytics verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analytics verification failed:', error);
    process.exit(1);
  });
