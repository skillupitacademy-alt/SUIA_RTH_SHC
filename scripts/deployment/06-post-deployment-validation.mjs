#!/usr/bin/env node
/**
 * PHASE 1 P0 - DELIVERABLE 1B
 * Phase E: Post-Deployment Validation
 * 
 * Purpose: Comprehensive validation of modular deployment
 * Validates: Tables, Enums, FKs, Indexes, Brand Partitioning, Legacy Preservation
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync } from 'fs';

const TUTORIAL_DB_URL = process.env.DATABASE_URL_TUTORIAL;

if (!TUTORIAL_DB_URL) {
  console.error('❌ DATABASE_URL_TUTORIAL not found');
  process.exit(1);
}

const sql = neon(TUTORIAL_DB_URL);

async function validateDeployment() {
  console.log('🔍 PHASE E: POST-DEPLOYMENT VALIDATION');
  console.log('==========================================\n');

  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    phase: 'PHASE_E_POST_DEPLOYMENT_VALIDATION',
    status: 'IN_PROGRESS',
    validations: {}
  };

  try {
    // ========================================
    // VALIDATION 1: MODULAR TABLES
    // ========================================
    console.log('📊 VALIDATION 1: Modular Tables');
    console.log('------------------------------------------');
    
    const expectedModularTables = [
      'tutorial_sections',
      'tutorial_subsections',
      'educational_architectures',
      'ui_architectures',
      'prompt_templates',
      'ai_generation_orchestration',
      'ai_section_generation_jobs',
      'content_review_queue',
      'content_deployments'
    ];

    const modularTablesFound = [];
    const modularTablesMissing = [];

    for (const table of expectedModularTables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      
      if (result[0].exists) {
        const rowCount = await sql([`SELECT COUNT(*) as count FROM ${table}`]);
        console.log(`  ✅ ${table} (${rowCount[0].count} rows)`);
        modularTablesFound.push({ table, rowCount: parseInt(rowCount[0].count) });
      } else {
        console.log(`  ❌ ${table} - MISSING`);
        modularTablesMissing.push(table);
      }
    }

    report.validations.modularTables = {
      status: modularTablesMissing.length === 0 ? 'SUCCESS' : 'FAILED',
      expected: expectedModularTables.length,
      found: modularTablesFound.length,
      missing: modularTablesMissing,
      tables: modularTablesFound
    };

    // ========================================
    // VALIDATION 2: ANALYTICS TABLES
    // ========================================
    console.log('\n📊 VALIDATION 2: Analytics Tables');
    console.log('------------------------------------------');
    
    const expectedAnalyticsTables = [
      'tutorial_learning_metrics',
      'subsection_engagement_metrics',
      'educational_architecture_performance',
      'ui_architecture_performance',
      'prompt_template_performance',
      'brand_performance_metrics',
      'deployment_cohort_metrics',
      'revenue_attribution_metrics'
    ];

    const analyticsTablesFound = [];
    const analyticsTablesMissing = [];

    for (const table of expectedAnalyticsTables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      
      if (result[0].exists) {
        const rowCount = await sql([`SELECT COUNT(*) as count FROM ${table}`]);
        console.log(`  ✅ ${table} (${rowCount[0].count} rows)`);
        analyticsTablesFound.push({ table, rowCount: parseInt(rowCount[0].count) });
      } else {
        console.log(`  ❌ ${table} - MISSING`);
        analyticsTablesMissing.push(table);
      }
    }

    report.validations.analyticsTables = {
      status: analyticsTablesMissing.length === 0 ? 'SUCCESS' : 'FAILED',
      expected: expectedAnalyticsTables.length,
      found: analyticsTablesFound.length,
      missing: analyticsTablesMissing,
      tables: analyticsTablesFound
    };

    // ========================================
    // VALIDATION 3: ENUMS
    // ========================================
    console.log('\n📊 VALIDATION 3: Enums');
    console.log('------------------------------------------');
    
    const expectedEnums = [
      'section_type',
      'section_status',
      'subsection_type',
      'deployment_type',
      'review_status',
      'orchestration_status',
      'priority_level',
      'brand',
      'brand_visibility'
    ];

    const enumsFound = [];
    const enumsMissing = [];

    for (const enumName of expectedEnums) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM pg_type 
          WHERE typname = ${enumName}
        );
      `;
      
      if (result[0].exists) {
        const values = await sql`
          SELECT enumlabel 
          FROM pg_enum 
          WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = ${enumName})
          ORDER BY enumsortorder;
        `;
        console.log(`  ✅ ${enumName} (${values.length} values)`);
        enumsFound.push({ enum: enumName, valueCount: values.length, values: values.map(v => v.enumlabel) });
      } else {
        console.log(`  ❌ ${enumName} - MISSING`);
        enumsMissing.push(enumName);
      }
    }

    report.validations.enums = {
      status: enumsMissing.length === 0 ? 'SUCCESS' : 'FAILED',
      expected: expectedEnums.length,
      found: enumsFound.length,
      missing: enumsMissing,
      enums: enumsFound
    };

    // ========================================
    // VALIDATION 4: FOREIGN KEY CONSTRAINTS
    // ========================================
    console.log('\n📊 VALIDATION 4: Foreign Key Constraints');
    console.log('------------------------------------------');
    
    const expectedFKs = [
      { table: 'tutorial_sections', constraint: 'fk_sections_prompt_template' },
      { table: 'tutorial_sections', constraint: 'fk_sections_educational_architecture' },
      { table: 'tutorial_sections', constraint: 'fk_sections_ui_architecture' },
      { table: 'tutorial_subsections', constraint: 'fk_subsections_prompt_template' },
      { table: 'ai_generation_orchestration', constraint: 'fk_orchestration_subtopic' },
      { table: 'ai_generation_orchestration', constraint: 'fk_orchestration_educational_architecture' },
      { table: 'content_deployments', constraint: 'fk_deployments_section' }
    ];

    const fksFound = [];
    const fksMissing = [];

    for (const fk of expectedFKs) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.table_constraints 
          WHERE constraint_type = 'FOREIGN KEY'
          AND table_name = ${fk.table}
          AND constraint_name = ${fk.constraint}
        );
      `;
      
      if (result[0].exists) {
        console.log(`  ✅ ${fk.table}.${fk.constraint}`);
        fksFound.push(fk);
      } else {
        console.log(`  ❌ ${fk.table}.${fk.constraint} - MISSING`);
        fksMissing.push(fk);
      }
    }

    report.validations.foreignKeys = {
      status: fksMissing.length === 0 ? 'SUCCESS' : 'FAILED',
      expected: expectedFKs.length,
      found: fksFound.length,
      missing: fksMissing,
      constraints: fksFound
    };

    // ========================================
    // VALIDATION 5: BRAND PARTITIONING
    // ========================================
    console.log('\n📊 VALIDATION 5: Brand Partitioning');
    console.log('------------------------------------------');
    
    const brandPartitionedTables = [
      'tutorial_sections',
      'tutorial_subsections',
      'educational_architectures',
      'ui_architectures',
      'prompt_templates',
      'ai_generation_orchestration',
      'content_deployments'
    ];

    const brandColumnsFound = [];
    const brandColumnsMissing = [];

    for (const table of brandPartitionedTables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = ${table}
          AND column_name = 'brand_id'
        );
      `;
      
      if (result[0].exists) {
        // Check if index exists
        const indexResult = await sql`
          SELECT EXISTS (
            SELECT FROM pg_indexes 
            WHERE tablename = ${table}
            AND indexname LIKE '%brand%'
          );
        `;
        console.log(`  ✅ ${table}.brand_id ${indexResult[0].exists ? '(indexed)' : '(no index)'}`);
        brandColumnsFound.push({ table, indexed: indexResult[0].exists });
      } else {
        console.log(`  ❌ ${table}.brand_id - MISSING`);
        brandColumnsMissing.push(table);
      }
    }

    report.validations.brandPartitioning = {
      status: brandColumnsMissing.length === 0 ? 'SUCCESS' : 'FAILED',
      expected: brandPartitionedTables.length,
      found: brandColumnsFound.length,
      missing: brandColumnsMissing,
      tables: brandColumnsFound
    };

    // ========================================
    // VALIDATION 6: LEGACY SYSTEM PRESERVATION
    // ========================================
    console.log('\n📊 VALIDATION 6: Legacy System Preservation');
    console.log('------------------------------------------');
    
    const legacyTables = [
      'tutorial_topics',
      'tutorial_subtopics',
      'tutorial_content'
    ];

    const legacyTablesFound = [];
    const legacyTablesMissing = [];

    for (const table of legacyTables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      
      if (result[0].exists) {
        const rowCount = await sql([`SELECT COUNT(*) as count FROM ${table}`]);
        console.log(`  ✅ ${table} (${rowCount[0].count} rows preserved)`);
        legacyTablesFound.push({ table, rowCount: parseInt(rowCount[0].count) });
      } else {
        console.log(`  ❌ ${table} - MISSING`);
        legacyTablesMissing.push(table);
      }
    }

    report.validations.legacyPreservation = {
      status: legacyTablesMissing.length === 0 ? 'SUCCESS' : 'FAILED',
      expected: legacyTables.length,
      found: legacyTablesFound.length,
      missing: legacyTablesMissing,
      tables: legacyTablesFound
    };

    // ========================================
    // VALIDATION 7: MIGRATION TRACKING
    // ========================================
    console.log('\n📊 VALIDATION 7: Migration Tracking');
    console.log('------------------------------------------');
    
    const migrationTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '__drizzle_migrations'
      );
    `;

    if (migrationTableExists[0].exists) {
      const migrations = await sql`
        SELECT id, hash, created_at 
        FROM __drizzle_migrations 
        ORDER BY created_at;
      `;
      console.log(`  ✅ __drizzle_migrations table exists`);
      console.log(`  ✅ ${migrations.length} migrations registered`);
      
      report.validations.migrationTracking = {
        status: 'SUCCESS',
        tableExists: true,
        migrationCount: migrations.length,
        migrations: migrations.map(m => ({
          id: m.id,
          hash: m.hash,
          createdAt: m.created_at
        }))
      };
    } else {
      console.log(`  ❌ __drizzle_migrations table - MISSING`);
      report.validations.migrationTracking = {
        status: 'FAILED',
        tableExists: false
      };
    }

    // ========================================
    // VALIDATION 8: SUBSECTION TAXONOMY
    // ========================================
    console.log('\n📊 VALIDATION 8: Subsection Taxonomy');
    console.log('------------------------------------------');
    
    const subsectionTypeExists = await sql`
      SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'subsection_type'
      );
    `;

    if (subsectionTypeExists[0].exists) {
      const subsectionTypes = await sql`
        SELECT enumlabel 
        FROM pg_enum 
        WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'subsection_type')
        ORDER BY enumsortorder;
      `;
      console.log(`  ✅ subsection_type enum exists`);
      console.log(`  ✅ ${subsectionTypes.length} subsection types defined`);
      
      // Check if tutorial_subsections has subsection_type column
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'tutorial_subsections'
          AND column_name = 'subsection_type'
        );
      `;
      
      console.log(`  ${columnExists[0].exists ? '✅' : '❌'} tutorial_subsections.subsection_type column`);
      
      report.validations.subsectionTaxonomy = {
        status: columnExists[0].exists ? 'SUCCESS' : 'PARTIAL',
        enumExists: true,
        typeCount: subsectionTypes.length,
        types: subsectionTypes.map(t => t.enumlabel),
        columnExists: columnExists[0].exists
      };
    } else {
      console.log(`  ❌ subsection_type enum - MISSING`);
      report.validations.subsectionTaxonomy = {
        status: 'FAILED',
        enumExists: false
      };
    }

    // ========================================
    // OVERALL STATUS
    // ========================================
    console.log('\n==========================================');
    console.log('📊 VALIDATION SUMMARY');
    console.log('==========================================');

    const validationResults = Object.entries(report.validations);
    const successCount = validationResults.filter(([_, v]) => v.status === 'SUCCESS').length;
    const totalCount = validationResults.length;

    validationResults.forEach(([name, result]) => {
      const icon = result.status === 'SUCCESS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
      console.log(`${icon} ${name}: ${result.status}`);
    });

    console.log(`\nOverall: ${successCount}/${totalCount} validations passed`);

    if (successCount === totalCount) {
      report.status = 'SUCCESS';
      report.overallScore = 100;
      console.log('\n✅ ALL VALIDATIONS PASSED - DEPLOYMENT SUCCESSFUL');
    } else if (successCount >= totalCount * 0.8) {
      report.status = 'PARTIAL';
      report.overallScore = Math.round((successCount / totalCount) * 100);
      console.log(`\n⚠️  PARTIAL SUCCESS - ${report.overallScore}% validations passed`);
    } else {
      report.status = 'FAILED';
      report.overallScore = Math.round((successCount / totalCount) * 100);
      console.log(`\n❌ VALIDATION FAILED - Only ${report.overallScore}% validations passed`);
    }

    // Save report
    const reportPath = `scripts/deployment/reports/post-deployment-validation-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Report saved: ${reportPath}`);

    return report;

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    report.status = 'FAILED';
    report.error = error.message;
    
    const reportPath = `scripts/deployment/reports/post-deployment-validation-${timestamp.replace(/:/g, '-')}.json`;
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    throw error;
  }
}

// Execute
validateDeployment()
  .then(() => {
    console.log('\n✅ Post-deployment validation complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Post-deployment validation failed:', error);
    process.exit(1);
  });
